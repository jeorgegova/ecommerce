-- =============================================================================
-- FUNCTIONS
-- Ecommerce Platform — PostgreSQL + Supabase
-- =============================================================================
-- Ejecutar DESPUÉS de database_schema.sql.
-- =============================================================================

-- =============================================================================
-- 1. SEQUENCES
-- =============================================================================

CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1;

-- =============================================================================
-- 2. INVENTORY FUNCTIONS
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 2.1 record_movement
-- Registra un movimiento de inventario y actualiza stock.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION record_movement(
  p_product_id    UUID,
  p_variant_id    UUID DEFAULT NULL,
  p_user_id       UUID DEFAULT NULL,
  p_movement_type TEXT DEFAULT 'adjustment',
  p_quantity      INTEGER DEFAULT 0,
  p_reference_type TEXT DEFAULT NULL,
  p_reference_id  TEXT DEFAULT NULL,
  p_notes         TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_current_stock INTEGER;
  v_new_stock     INTEGER;
  v_movement_id   UUID;
  v_table         TEXT;
BEGIN
  -- Validar
  IF p_quantity = 0 THEN
    RAISE EXCEPTION 'Quantity must be non-zero';
  END IF;

  -- Obtener stock actual
  IF p_variant_id IS NOT NULL THEN
    SELECT stock INTO v_current_stock
    FROM product_variants
    WHERE id = p_variant_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Variant not found: %', p_variant_id;
    END IF;
  ELSE
    SELECT stock INTO v_current_stock
    FROM products
    WHERE id = p_product_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product not found: %', p_product_id;
    END IF;
  END IF;

  v_new_stock := v_current_stock + p_quantity;

  IF v_new_stock < 0 THEN
    RAISE EXCEPTION 'Insufficient stock. Current: %, requested change: %', v_current_stock, p_quantity;
  END IF;

  -- Actualizar stock
  IF p_variant_id IS NOT NULL THEN
    UPDATE product_variants
    SET stock = v_new_stock
    WHERE id = p_variant_id;
  ELSE
    UPDATE products
    SET stock = v_new_stock
    WHERE id = p_product_id;
  END IF;

  -- Insertar movimiento
  INSERT INTO inventory_movements (
    product_id, variant_id, user_id, movement_type,
    quantity, stock_before, stock_after,
    reference_type, reference_id, notes
  ) VALUES (
    p_product_id, p_variant_id, p_user_id, p_movement_type,
    p_quantity, v_current_stock, v_new_stock,
    p_reference_type, p_reference_id, p_notes
  ) RETURNING id INTO v_movement_id;

  -- Log audit
  PERFORM log_audit(
    p_user_id,
    'stock_change',
    CASE WHEN p_variant_id IS NOT NULL THEN 'product_variant' ELSE 'product' END,
    COALESCE(p_variant_id, p_product_id)::TEXT,
    jsonb_build_object('stock_before', v_current_stock),
    jsonb_build_object('stock_after', v_new_stock, 'movement_type', p_movement_type, 'movement_id', v_movement_id)
  );

  RETURN v_movement_id;
END;
$$;

-- ---------------------------------------------------------------------------
-- 2.2 get_product_stock
-- Retorna información de stock para un producto.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_product_stock(
  p_product_id UUID
)
RETURNS TABLE (
  variant_id     UUID,
  variant_name   TEXT,
  variant_sku    TEXT,
  stock          INTEGER,
  is_active      BOOLEAN
)
LANGUAGE plpgsql
AS $$
BEGIN
  -- Producto sin variantes
  IF NOT EXISTS (SELECT 1 FROM products WHERE id = p_product_id AND has_variants = true) THEN
    RETURN QUERY
    SELECT
      NULL::UUID,
      NULL::TEXT,
      NULL::TEXT,
      p.stock,
      NULL::BOOLEAN
    FROM products p
    WHERE p.id = p_product_id;
  ELSE
    -- Producto con variantes
    RETURN QUERY
    SELECT
      pv.id,
      pv.name,
      pv.sku,
      pv.stock,
      pv.is_active
    FROM product_variants pv
    WHERE pv.product_id = p_product_id
    ORDER BY pv.sort_order;
  END IF;
END;
$$;

-- =============================================================================
-- 3. ORDER FUNCTIONS
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 3.1 generate_order_number
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_nextval BIGINT;
  v_year    TEXT;
BEGIN
  v_year    := to_char(now(), 'YYYY');
  v_nextval := nextval('order_number_seq');
  RETURN 'ORD-' || v_year || '-' || LPAD(v_nextval::TEXT, 6, '0');
END;
$$;

-- ---------------------------------------------------------------------------
-- 3.2 create_order_from_cart
-- Crea un pedido a partir del carrito del usuario.
-- Retorna el ID de la orden creada.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION create_order_from_cart(
  p_user_id            UUID,
  p_shipping_address_id UUID DEFAULT NULL,
  p_billing_address_id  UUID DEFAULT NULL,
  p_notes              TEXT DEFAULT NULL,
  p_coupon_id          UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_order_id     UUID;
  v_order_number TEXT;
  v_subtotal     NUMERIC(12,2) := 0;
  v_shipping_cost NUMERIC(12,2) := 0;
  v_discount     NUMERIC(12,2) := 0;
  v_total        NUMERIC(12,2);
  v_item         RECORD;
  v_coupon       RECORD;
  v_used_count   INTEGER;
BEGIN
  -- Verificar que el carrito no esté vacío
  IF NOT EXISTS (SELECT 1 FROM cart_items WHERE user_id = p_user_id) THEN
    RAISE EXCEPTION 'Cart is empty';
  END IF;

  -- Verificar stock antes de proceder
  FOR v_item IN
    SELECT
      ci.product_id,
      ci.variant_id,
      ci.quantity,
      p.stock AS product_stock,
      p.has_variants,
      pv.stock AS variant_stock,
      p.base_price,
      p.sale_price,
      COALESCE(pv.price_adjustment, 0) AS price_adjustment,
      p.name AS product_name,
      p.sku AS product_sku,
      pv.name AS variant_name
    FROM cart_items ci
    JOIN products p ON p.id = ci.product_id
    LEFT JOIN product_variants pv ON pv.id = ci.variant_id
    WHERE ci.user_id = p_user_id
    FOR UPDATE OF p
  LOOP
    IF v_item.has_variants AND v_item.variant_id IS NULL THEN
      RAISE EXCEPTION 'Product % requires a variant selection', v_item.product_name;
    END IF;

    IF v_item.variant_id IS NOT NULL AND v_item.variant_stock < v_item.quantity THEN
      RAISE EXCEPTION 'Insufficient stock for variant % of %. Available: %, requested: %',
        v_item.variant_name, v_item.product_name, v_item.variant_stock, v_item.quantity;
    END IF;

    IF v_item.variant_id IS NULL AND v_item.product_stock < v_item.quantity THEN
      RAISE EXCEPTION 'Insufficient stock for %. Available: %, requested: %',
        v_item.product_name, v_item.product_stock, v_item.quantity;
    END IF;
  END LOOP;

  -- Generar número de orden
  v_order_number := generate_order_number();

  -- Calcular subtotal
  SELECT COALESCE(sum(
    (COALESCE(ci_items.sale_price, ci_items.base_price) + COALESCE(ci_items.price_adjustment, 0)) * ci_items.quantity
  ), 0) INTO v_subtotal
  FROM (
    SELECT
      ci.quantity,
      p.sale_price,
      p.base_price,
      pv.price_adjustment
    FROM cart_items ci
    JOIN products p ON p.id = ci.product_id
    LEFT JOIN product_variants pv ON pv.id = ci.variant_id
    WHERE ci.user_id = p_user_id
  ) ci_items;

  -- Validar y aplicar cupón
  IF p_coupon_id IS NOT NULL THEN
    SELECT * INTO v_coupon
    FROM coupons
    WHERE id = p_coupon_id
      AND is_active = true
      AND (starts_at IS NULL OR starts_at <= now())
      AND (ends_at IS NULL OR ends_at >= now());

    IF v_coupon.id IS NULL THEN
      RAISE EXCEPTION 'Coupon not found or expired';
    END IF;

    IF v_coupon.min_order_amount IS NOT NULL AND v_subtotal < v_coupon.min_order_amount THEN
      RAISE EXCEPTION 'Minimum order amount of % not met', v_coupon.min_order_amount;
    END IF;

    IF v_coupon.max_uses IS NOT NULL THEN
      SELECT count(*) INTO v_used_count FROM coupon_usage WHERE coupon_id = p_coupon_id;
      IF v_used_count >= v_coupon.max_uses THEN
        RAISE EXCEPTION 'Coupon usage limit reached';
      END IF;
    END IF;

    IF v_coupon.max_uses_per_user IS NOT NULL THEN
      SELECT count(*) INTO v_used_count FROM coupon_usage WHERE coupon_id = p_coupon_id AND user_id = p_user_id;
      IF v_used_count >= v_coupon.max_uses_per_user THEN
        RAISE EXCEPTION 'Coupon usage limit per user reached';
      END IF;
    END IF;

    IF v_coupon.type = 'percentage' THEN
      v_discount := LEAST(v_subtotal * (v_coupon.value / 100), v_subtotal);
    ELSE
      v_discount := LEAST(v_coupon.value, v_subtotal);
    END IF;
  END IF;

  v_total := v_subtotal + v_shipping_cost - v_discount;

  -- Crear orden
  INSERT INTO orders (
    user_id, order_number, status, subtotal, shipping_cost, discount, total,
    notes, shipping_address_id, billing_address_id, coupon_id
  ) VALUES (
    p_user_id, v_order_number, 'pending', v_subtotal, v_shipping_cost, v_discount, v_total,
    p_notes, p_shipping_address_id, p_billing_address_id, p_coupon_id
  ) RETURNING id INTO v_order_id;

  -- Crear order_items y descontar inventario
  FOR v_item IN
    SELECT
      ci.product_id,
      ci.variant_id,
      ci.quantity,
      p.name AS product_name,
      p.sku AS product_sku,
      pv.name AS variant_name,
      COALESCE(p.sale_price, p.base_price) AS unit_price,
      COALESCE(pv.price_adjustment, 0) AS price_adjustment
    FROM cart_items ci
    JOIN products p ON p.id = ci.product_id
    LEFT JOIN product_variants pv ON pv.id = ci.variant_id
    WHERE ci.user_id = p_user_id
  LOOP
    INSERT INTO order_items (
      order_id, product_id, variant_id,
      product_name, product_sku, variant_name,
      unit_price, quantity, subtotal
    ) VALUES (
      v_order_id, v_item.product_id, v_item.variant_id,
      v_item.product_name, v_item.product_sku, v_item.variant_name,
      v_item.unit_price + v_item.price_adjustment, v_item.quantity,
      (v_item.unit_price + v_item.price_adjustment) * v_item.quantity
    );

    -- Descontar stock
    PERFORM record_movement(
      p_product_id    => v_item.product_id,
      p_variant_id    => v_item.variant_id,
      p_user_id       => p_user_id,
      p_movement_type => 'sale',
      p_quantity      => -v_item.quantity,
      p_reference_type => 'order',
      p_reference_id  => v_order_id::TEXT,
      p_notes         => 'Order ' || v_order_number
    );
  END LOOP;

  -- Registrar uso de cupón
  IF p_coupon_id IS NOT NULL THEN
    INSERT INTO coupon_usage (coupon_id, order_id, user_id)
    VALUES (p_coupon_id, v_order_id, p_user_id);
  END IF;

  -- Vaciar carrito
  DELETE FROM cart_items WHERE user_id = p_user_id;

  -- Log audit
  PERFORM log_audit(
    p_user_id, 'create', 'order', v_order_id::TEXT,
    NULL, jsonb_build_object('order_number', v_order_number, 'total', v_total)
  );

  RETURN v_order_id;
END;
$$;

-- ---------------------------------------------------------------------------
-- 3.3 update_order_status
-- Cambia el estado de una orden con auditoría.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_order_status(
  p_order_id      UUID,
  p_new_status    TEXT,
  p_user_id       UUID DEFAULT NULL,
  p_cancel_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_old_status TEXT;
  v_order_number TEXT;
BEGIN
  SELECT status, order_number INTO v_old_status, v_order_number
  FROM orders WHERE id = p_order_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found: %', p_order_id;
  END IF;

  -- Validar transiciones permitidas
  IF v_old_status = 'cancelled' OR v_old_status = 'delivered' THEN
    RAISE EXCEPTION 'Cannot change status of a % order', v_old_status;
  END IF;

  IF p_new_status = 'cancelled' AND v_old_status IN ('shipped', 'delivered') THEN
    RAISE EXCEPTION 'Cannot cancel an order that has been shipped or delivered';
  END IF;

  -- Actualizar estado
  UPDATE orders SET
    status = p_new_status,
    cancelled_at = CASE WHEN p_new_status = 'cancelled' THEN now() ELSE cancelled_at END,
    cancellation_reason = CASE WHEN p_new_status = 'cancelled' THEN p_cancel_reason ELSE cancellation_reason END
  WHERE id = p_order_id;

  -- Si se cancela, restaurar stock
  IF p_new_status = 'cancelled' AND v_old_status NOT IN ('cancelled', 'delivered') THEN
    INSERT INTO inventory_movements (
      product_id, variant_id, user_id, movement_type,
      quantity, stock_before, stock_after,
      reference_type, reference_id, notes
    )
    SELECT
      oi.product_id,
      oi.variant_id,
      p_user_id,
      'return',
      oi.quantity,
      COALESCE(pv.stock, p.stock),
      COALESCE(pv.stock, p.stock) + oi.quantity,
      'order',
      p_order_id::TEXT,
      'Cancelled order ' || v_order_number
    FROM order_items oi
    LEFT JOIN products p ON p.id = oi.product_id
    LEFT JOIN product_variants pv ON pv.id = oi.variant_id
    WHERE oi.order_id = p_order_id;

    UPDATE products p SET stock = p.stock + oi.quantity
    FROM order_items oi
    WHERE oi.order_id = p_order_id AND oi.variant_id IS NULL AND p.id = oi.product_id;

    UPDATE product_variants pv SET stock = pv.stock + oi.quantity
    FROM order_items oi
    WHERE oi.order_id = p_order_id AND oi.variant_id IS NOT NULL AND pv.id = oi.variant_id;
  END IF;

  -- Log audit
  PERFORM log_audit(
    p_user_id, 'order_status_change', 'order', p_order_id::TEXT,
    jsonb_build_object('status', v_old_status),
    jsonb_build_object('status', p_new_status, 'reason', p_cancel_reason)
  );

  RETURN true;
END;
$$;

-- =============================================================================
-- 4. AUDIT FUNCTIONS
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 4.1 log_audit
-- Inserta un registro de auditoría.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION log_audit(
  p_user_id      UUID DEFAULT NULL,
  p_action       TEXT DEFAULT NULL,
  p_entity_type  TEXT DEFAULT NULL,
  p_entity_id    TEXT DEFAULT NULL,
  p_old_values   JSONB DEFAULT NULL,
  p_new_values   JSONB DEFAULT NULL,
  p_ip_hash      TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, new_values, ip_hash)
  VALUES (p_user_id, p_action, p_entity_type, p_entity_id, p_old_values, p_new_values, p_ip_hash)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- ---------------------------------------------------------------------------
-- 4.2 get_entity_history
-- Retorna el historial de cambios de una entidad.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_entity_history(
  p_entity_type TEXT,
  p_entity_id   TEXT,
  p_limit       INTEGER DEFAULT 50
)
RETURNS TABLE (
  id          UUID,
  user_id     UUID,
  user_name   TEXT,
  action      TEXT,
  old_values  JSONB,
  new_values  JSONB,
  created_at  TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    al.id,
    al.user_id,
    p.full_name AS user_name,
    al.action,
    al.old_values,
    al.new_values,
    al.created_at
  FROM audit_logs al
  LEFT JOIN profiles p ON p.id = al.user_id
  WHERE al.entity_type = p_entity_type
    AND al.entity_id = p_entity_id
  ORDER BY al.created_at DESC
  LIMIT p_limit;
END;
$$;

-- =============================================================================
-- 5. STATISTICS FUNCTIONS
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 5.1 get_dashboard_stats
-- Retorna métricas principales para el dashboard administrativo.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_dashboard_stats(
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  metric        TEXT,
  current_value NUMERIC,
  previous_value NUMERIC,
  growth_percent NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY

  -- Ventas totales (período actual)
  SELECT
    'total_sales'::TEXT AS metric,
    COALESCE(SUM(o.total), 0) AS current_value,
    COALESCE(prev.total, 0) AS previous_value,
    CASE WHEN COALESCE(prev.total, 0) > 0
      THEN ROUND(((SUM(o.total) - prev.total) / prev.total) * 100, 1)
      ELSE 0
    END AS growth_percent
  FROM orders o
  LEFT JOIN LATERAL (
    SELECT SUM(total) AS total FROM orders
    WHERE created_at >= now() - make_interval(days => p_days * 2)
      AND created_at < now() - make_interval(days => p_days)
  ) prev ON true
  WHERE o.created_at >= now() - make_interval(days => p_days)
    AND o.status NOT IN ('cancelled')
  GROUP BY prev.total

  UNION ALL

  -- Número de pedidos
  SELECT
    'total_orders'::TEXT,
    COUNT(*)::NUMERIC,
    prev.count::NUMERIC,
    CASE WHEN prev.count > 0 THEN ROUND(((COUNT(*) - prev.count) / prev.count::NUMERIC) * 100, 1) ELSE 0 END
  FROM orders o
  LEFT JOIN LATERAL (
    SELECT COUNT(*) FROM orders
    WHERE created_at >= now() - make_interval(days => p_days * 2)
      AND created_at < now() - make_interval(days => p_days)
  ) prev ON true
  WHERE o.created_at >= now() - make_interval(days => p_days)
  GROUP BY prev.count

  UNION ALL

  -- Usuarios registrados
  SELECT
    'new_users'::TEXT,
    COUNT(*)::NUMERIC,
    prev.count::NUMERIC,
    CASE WHEN prev.count > 0 THEN ROUND(((COUNT(*) - prev.count) / prev.count::NUMERIC) * 100, 1) ELSE 0 END
  FROM profiles p
  LEFT JOIN LATERAL (
    SELECT COUNT(*) FROM profiles
    WHERE created_at >= now() - make_interval(days => p_days * 2)
      AND created_at < now() - make_interval(days => p_days)
  ) prev ON true
  WHERE p.created_at >= now() - make_interval(days => p_days)
  GROUP BY prev.count

  UNION ALL

  -- Productos vistos
  SELECT
    'product_views'::TEXT,
    COUNT(*)::NUMERIC,
    prev.count::NUMERIC,
    CASE WHEN prev.count > 0 THEN ROUND(((COUNT(*) - prev.count) / prev.count::NUMERIC) * 100, 1) ELSE 0 END
  FROM product_views pv
  LEFT JOIN LATERAL (
    SELECT COUNT(*) FROM product_views
    WHERE viewed_at >= now() - make_interval(days => p_days * 2)
      AND viewed_at < now() - make_interval(days => p_days)
  ) prev ON true
  WHERE pv.viewed_at >= now() - make_interval(days => p_days)
  GROUP BY prev.count

  UNION ALL

  -- Productos vendidos
  SELECT
    'products_sold'::TEXT,
    COALESCE(SUM(oi.quantity), 0)::NUMERIC,
    COALESCE(prev.qty, 0)::NUMERIC,
    CASE WHEN COALESCE(prev.qty, 0) > 0
      THEN ROUND(((COALESCE(SUM(oi.quantity), 0) - prev.qty) / prev.qty::NUMERIC) * 100, 1)
      ELSE 0
    END
  FROM order_items oi
  JOIN orders o ON o.id = oi.order_id
  LEFT JOIN LATERAL (
    SELECT SUM(oi2.quantity) AS qty FROM order_items oi2
    JOIN orders o2 ON o2.id = oi2.order_id
    WHERE o2.created_at >= now() - make_interval(days => p_days * 2)
      AND o2.created_at < now() - make_interval(days => p_days)
      AND o2.status NOT IN ('cancelled')
  ) prev ON true
  WHERE o.created_at >= now() - make_interval(days => p_days)
    AND o.status NOT IN ('cancelled')
  GROUP BY prev.qty

  UNION ALL

  -- Productos sin stock
  SELECT
    'out_of_stock'::TEXT,
    COUNT(*)::NUMERIC,
    0::NUMERIC,
    0::NUMERIC
  FROM products
  WHERE status = 'active'
    AND stock = 0
    AND has_variants = false;
END;
$$;

-- ---------------------------------------------------------------------------
-- 5.2 get_sales_summary
-- Retorna ventas agregadas por día para gráficos.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_sales_summary(
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  date        DATE,
  total_sales NUMERIC(12,2),
  order_count BIGINT,
  avg_order   NUMERIC(12,2)
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    o.created_at::DATE AS date,
    COALESCE(SUM(o.total), 0) AS total_sales,
    COUNT(DISTINCT o.id) AS order_count,
    COALESCE(SUM(o.total) / NULLIF(COUNT(DISTINCT o.id), 0), 0) AS avg_order
  FROM orders o
  WHERE o.created_at >= (now() - make_interval(days => p_days))::DATE
    AND o.status NOT IN ('cancelled')
  GROUP BY o.created_at::DATE
  ORDER BY date;
END;
$$;

-- ---------------------------------------------------------------------------
-- 5.3 get_top_products
-- Retorna los productos más vendidos en un período.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_top_products(
  p_days   INTEGER DEFAULT 30,
  p_limit  INTEGER DEFAULT 10
)
RETURNS TABLE (
  product_id    UUID,
  product_name  TEXT,
  total_sold    BIGINT,
  total_revenue NUMERIC(12,2)
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id AS product_id,
    p.name AS product_name,
    SUM(oi.quantity) AS total_sold,
    SUM(oi.subtotal) AS total_revenue
  FROM order_items oi
  JOIN orders o ON o.id = oi.order_id
  JOIN products p ON p.id = oi.product_id
  WHERE o.created_at >= now() - make_interval(days => p_days)
    AND o.status NOT IN ('cancelled')
  GROUP BY p.id, p.name
  ORDER BY total_sold DESC
  LIMIT p_limit;
END;
$$;

-- ---------------------------------------------------------------------------
-- 5.4 update_product_rating
-- Recalcula el rating promedio de un producto.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_product_rating(p_product_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE products SET
    avg_rating = COALESCE((SELECT ROUND(AVG(rating)::NUMERIC, 2) FROM reviews WHERE product_id = p_product_id AND is_approved = true), 0),
    reviews_count = (SELECT COUNT(*) FROM reviews WHERE product_id = p_product_id AND is_approved = true)
  WHERE id = p_product_id;
END;
$$;

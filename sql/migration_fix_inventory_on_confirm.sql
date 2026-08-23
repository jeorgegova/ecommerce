-- Fix inventario: solo descontar al confirmar, no al generar proforma (pending)
-- Ejecutar en Supabase SQL Editor

-- 1. create_order_from_cart SIN descontar stock (solo valida)
CREATE OR REPLACE FUNCTION create_order_from_cart(
  p_user_id            UUID,
  p_shipping_address_id UUID DEFAULT NULL,
  p_billing_address_id  UUID DEFAULT NULL,
  p_notes              TEXT DEFAULT NULL,
  p_coupon_id          UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Unauthorized order user';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM cart_items WHERE user_id = p_user_id) THEN
    RAISE EXCEPTION 'Cart is empty';
  END IF;
  -- Validar stock (sin descontar)
  FOR v_item IN
    SELECT ci.product_id, ci.variant_id, ci.quantity,
           p.stock AS product_stock, p.has_variants, pv.stock AS variant_stock,
           p.name AS product_name, pv.name AS variant_name
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
      RAISE EXCEPTION 'Insufficient stock for variant % of %. Available: %, requested: %', v_item.variant_name, v_item.product_name, v_item.variant_stock, v_item.quantity;
    END IF;
    IF v_item.variant_id IS NULL AND v_item.product_stock < v_item.quantity THEN
      RAISE EXCEPTION 'Insufficient stock for %. Available: %, requested: %', v_item.product_name, v_item.product_stock, v_item.quantity;
    END IF;
  END LOOP;
  v_order_number := generate_order_number();
  SELECT COALESCE(sum(
    (COALESCE(ci_items.sale_price, ci_items.base_price) + COALESCE(ci_items.price_adjustment, 0)) * ci_items.quantity
  ), 0) INTO v_subtotal
  FROM (
    SELECT ci.quantity, p.sale_price, p.base_price, pv.price_adjustment
    FROM cart_items ci
    JOIN products p ON p.id = ci.product_id
    LEFT JOIN product_variants pv ON pv.id = ci.variant_id
    WHERE ci.user_id = p_user_id
  ) ci_items;
  IF p_coupon_id IS NOT NULL THEN
    SELECT * INTO v_coupon FROM coupons WHERE id = p_coupon_id AND is_active = true AND (starts_at IS NULL OR starts_at <= now()) AND (ends_at IS NULL OR ends_at >= now());
    IF v_coupon.id IS NULL THEN RAISE EXCEPTION 'Coupon not found or expired'; END IF;
    IF v_coupon.min_order_amount IS NOT NULL AND v_subtotal < v_coupon.min_order_amount THEN RAISE EXCEPTION 'Minimum order amount of % not met', v_coupon.min_order_amount; END IF;
    IF v_coupon.max_uses IS NOT NULL THEN SELECT count(*) INTO v_used_count FROM coupon_usage WHERE coupon_id = p_coupon_id; IF v_used_count >= v_coupon.max_uses THEN RAISE EXCEPTION 'Coupon usage limit reached'; END IF; END IF;
    IF v_coupon.max_uses_per_user IS NOT NULL THEN SELECT count(*) INTO v_used_count FROM coupon_usage WHERE coupon_id = p_coupon_id AND user_id = p_user_id; IF v_used_count >= v_coupon.max_uses_per_user THEN RAISE EXCEPTION 'Coupon usage limit per user reached'; END IF; END IF;
    IF v_coupon.type = 'percentage' THEN v_discount := LEAST(v_subtotal * (v_coupon.value / 100), v_subtotal); ELSE v_discount := LEAST(v_coupon.value, v_subtotal); END IF;
  END IF;
  v_total := v_subtotal + v_shipping_cost - v_discount;
  INSERT INTO orders (user_id, order_number, status, subtotal, shipping_cost, discount, total, notes, shipping_address_id, billing_address_id, coupon_id)
  VALUES (p_user_id, v_order_number, 'pending', v_subtotal, v_shipping_cost, v_discount, v_total, p_notes, p_shipping_address_id, p_billing_address_id, p_coupon_id)
  RETURNING id INTO v_order_id;
  FOR v_item IN
    SELECT ci.product_id, ci.variant_id, ci.quantity,
           p.name AS product_name, p.sku AS product_sku, pv.name AS variant_name,
           COALESCE(p.sale_price, p.base_price) AS unit_price,
           COALESCE(pv.price_adjustment, 0) AS price_adjustment
    FROM cart_items ci
    JOIN products p ON p.id = ci.product_id
    LEFT JOIN product_variants pv ON pv.id = ci.variant_id
    WHERE ci.user_id = p_user_id
  LOOP
    INSERT INTO order_items (order_id, product_id, variant_id, product_name, product_sku, variant_name, unit_price, quantity, subtotal)
    VALUES (v_order_id, v_item.product_id, v_item.variant_id, v_item.product_name, v_item.product_sku, v_item.variant_name, v_item.unit_price + v_item.price_adjustment, v_item.quantity, (v_item.unit_price + v_item.price_adjustment) * v_item.quantity);
    -- NO descontar stock aquí; se descuenta al confirmar
  END LOOP;
  IF p_coupon_id IS NOT NULL THEN INSERT INTO coupon_usage (coupon_id, order_id, user_id) VALUES (p_coupon_id, v_order_id, p_user_id); END IF;
  DELETE FROM cart_items WHERE user_id = p_user_id;
  PERFORM log_audit(p_user_id, 'create', 'order', v_order_id::TEXT, NULL, jsonb_build_object('order_number', v_order_number, 'total', v_total));
  RETURN v_order_id;
END;
$$;

-- 2. create_order_from_cart_random SIN descontar stock
CREATE OR REPLACE FUNCTION create_order_from_cart_random(
  p_user_id uuid,
  p_shipping_address_id uuid default null,
  p_billing_address_id uuid default null,
  p_notes text default null
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id uuid;
  v_order_number text;
  v_subtotal numeric(12,2) := 0;
  v_shipping_cost numeric(12,2) := 0;
  v_discount numeric(12,2) := 0;
  v_total numeric(12,2);
  v_target integer;
  v_stored_discount integer;
  v_item record;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  IF NOT EXISTS (SELECT 1 FROM cart_items WHERE user_id = p_user_id) THEN RAISE EXCEPTION 'Cart empty'; END IF;
  FOR v_item IN
    SELECT ci.product_id, ci.variant_id, ci.quantity,
           p.stock AS product_stock, p.has_variants, pv.stock AS variant_stock,
           p.name AS product_name, pv.name AS variant_name
    FROM cart_items ci
    JOIN products p ON p.id = ci.product_id
    LEFT JOIN product_variants pv ON pv.id = ci.variant_id
    WHERE ci.user_id = p_user_id
    FOR UPDATE OF p
  LOOP
    IF v_item.has_variants AND v_item.variant_id IS NULL THEN RAISE EXCEPTION 'Product % requires variant', v_item.product_name; END IF;
    IF v_item.variant_id IS NOT NULL AND v_item.variant_stock < v_item.quantity THEN RAISE EXCEPTION 'Insufficient stock for variant %', v_item.variant_name; END IF;
    IF v_item.variant_id IS NULL AND v_item.product_stock < v_item.quantity THEN RAISE EXCEPTION 'Insufficient stock for %', v_item.product_name; END IF;
  END LOOP;
  SELECT COALESCE(SUM((CASE WHEN p.promotion_active AND p.sale_price IS NOT NULL THEN p.sale_price ELSE p.base_price END + COALESCE(pv.price_adjustment,0)) * ci.quantity),0) INTO v_subtotal
  FROM cart_items ci JOIN products p ON p.id = ci.product_id LEFT JOIN product_variants pv ON pv.id = ci.variant_id WHERE ci.user_id = p_user_id;
  SELECT target, discount INTO v_target, v_stored_discount FROM random_purchase_discounts WHERE user_id = p_user_id;
  IF v_target IS NOT NULL THEN
    IF v_subtotal < v_target THEN RAISE EXCEPTION 'Cart total (%) below requested target (%). Regenerate purchase.', v_subtotal, v_target; END IF;
    v_discount := v_subtotal - v_target;
    IF v_stored_discount IS NOT NULL AND v_stored_discount != v_discount THEN v_discount := LEAST(v_discount, v_subtotal * 0.5); END IF;
    v_discount := LEAST(v_discount, v_subtotal);
  END IF;
  v_total := v_subtotal + v_shipping_cost - v_discount;
  v_order_number := generate_order_number();
  INSERT INTO orders (user_id, order_number, status, subtotal, shipping_cost, discount, total, notes, shipping_address_id, billing_address_id)
  VALUES (p_user_id, v_order_number, 'pending', v_subtotal, v_shipping_cost, v_discount, v_total, p_notes, p_shipping_address_id, p_billing_address_id)
  RETURNING id INTO v_order_id;
  FOR v_item IN
    SELECT ci.product_id, ci.variant_id, ci.quantity,
           p.name AS product_name, p.sku AS product_sku, pv.name AS variant_name,
           CASE WHEN p.promotion_active AND p.sale_price IS NOT NULL THEN p.sale_price ELSE p.base_price END AS unit_price,
           COALESCE(pv.price_adjustment,0) AS price_adjustment
    FROM cart_items ci JOIN products p ON p.id = ci.product_id LEFT JOIN product_variants pv ON pv.id = ci.variant_id WHERE ci.user_id = p_user_id
  LOOP
    INSERT INTO order_items (order_id, product_id, variant_id, product_name, product_sku, variant_name, unit_price, quantity, subtotal)
    VALUES (v_order_id, v_item.product_id, v_item.variant_id, v_item.product_name, v_item.product_sku, v_item.variant_name, v_item.unit_price + v_item.price_adjustment, v_item.quantity, (v_item.unit_price + v_item.price_adjustment)*v_item.quantity);
  END LOOP;
  DELETE FROM cart_items WHERE user_id = p_user_id;
  DELETE FROM random_purchase_discounts WHERE user_id = p_user_id;
  PERFORM log_audit(p_user_id, 'create', 'order', v_order_id::TEXT, NULL, jsonb_build_object('order_number', v_order_number, 'total', v_total, 'random_target', v_target));
  RETURN v_order_id;
END;
$$;

-- 3. update_order_status: descontar al confirmar, restaurar solo si ya descontado
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
  SELECT status, order_number INTO v_old_status, v_order_number FROM orders WHERE id = p_order_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Order not found: %', p_order_id; END IF;
  IF v_old_status = 'cancelled' OR v_old_status = 'delivered' THEN RAISE EXCEPTION 'Cannot change status of a % order', v_old_status; END IF;
  IF p_new_status = 'cancelled' AND v_old_status IN ('shipped', 'delivered') THEN RAISE EXCEPTION 'Cannot cancel an order that has been shipped or delivered'; END IF;
  -- Validar que no se confirme dos veces
  IF p_new_status = 'confirmed' AND v_old_status != 'pending' THEN RAISE EXCEPTION 'Only pending orders can be confirmed, current %', v_old_status; END IF;

  UPDATE orders SET status = p_new_status,
    cancelled_at = CASE WHEN p_new_status = 'cancelled' THEN now() ELSE cancelled_at END,
    cancellation_reason = CASE WHEN p_new_status = 'cancelled' THEN p_cancel_reason ELSE cancellation_reason END
  WHERE id = p_order_id;

  -- Al confirmar (pending -> confirmed) descontar inventario
  IF p_new_status = 'confirmed' AND v_old_status = 'pending' THEN
    DECLARE
      v_oi RECORD;
    BEGIN
      FOR v_oi IN SELECT product_id, variant_id, quantity FROM order_items WHERE order_id = p_order_id LOOP
        PERFORM record_movement(
          p_product_id => v_oi.product_id,
          p_variant_id => v_oi.variant_id,
          p_user_id => p_user_id,
          p_movement_type => 'sale',
          p_quantity => -v_oi.quantity,
          p_reference_type => 'order',
          p_reference_id => p_order_id::TEXT,
          p_notes => 'Order ' || v_order_number || ' confirmed'
        );
      END LOOP;
    END;
  END IF;

  -- Si se cancela y ya había sido confirmado/processing/shipped, restaurar stock
  IF p_new_status = 'cancelled' AND v_old_status IN ('confirmed','processing','shipped') THEN
    INSERT INTO inventory_movements (product_id, variant_id, user_id, movement_type, quantity, stock_before, stock_after, reference_type, reference_id, notes)
    SELECT oi.product_id, oi.variant_id, p_user_id, 'return', oi.quantity, COALESCE(pv.stock, p.stock), COALESCE(pv.stock, p.stock) + oi.quantity, 'order', p_order_id::TEXT, 'Cancelled order ' || v_order_number
    FROM order_items oi LEFT JOIN products p ON p.id = oi.product_id LEFT JOIN product_variants pv ON pv.id = oi.variant_id WHERE oi.order_id = p_order_id;
    UPDATE products p SET stock = p.stock + oi.quantity FROM order_items oi WHERE oi.order_id = p_order_id AND oi.variant_id IS NULL AND p.id = oi.product_id;
    UPDATE product_variants pv SET stock = pv.stock + oi.quantity FROM order_items oi WHERE oi.order_id = p_order_id AND oi.variant_id IS NOT NULL AND pv.id = oi.variant_id;
  END IF;

  PERFORM log_audit(p_user_id, 'order_status_change', 'order', p_order_id::TEXT, jsonb_build_object('status', v_old_status), jsonb_build_object('status', p_new_status, 'reason', p_cancel_reason));
  RETURN true;
END;
$$;

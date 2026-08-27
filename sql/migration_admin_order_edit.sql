-- =============================================================================
-- ADMIN ORDER EDIT: RLS + RPC
-- Permite a admin editar items y cupón de un pedido proforma (pending/confirmed)
-- =============================================================================

-- 1. RLS para order_items: admin puede gestionar todo
DROP POLICY IF EXISTS "order_items_insert_own" ON order_items;
DROP POLICY IF EXISTS "order_items_select_admin" ON order_items;
DROP POLICY IF EXISTS "order_items_select_own" ON order_items;

CREATE POLICY "order_items_select_own" ON order_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM orders WHERE id = order_id AND user_id = auth.uid()) OR is_admin()
  );

CREATE POLICY "order_items_insert_own" ON order_items
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM orders WHERE id = order_id AND user_id = auth.uid()) OR is_admin()
  );

CREATE POLICY "order_items_update_admin" ON order_items
  FOR UPDATE USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "order_items_delete_admin" ON order_items
  FOR DELETE USING (is_admin());

-- order_items_select_admin ya cubierto via SELECT own, pero mantener alias
CREATE POLICY "order_items_select_admin" ON order_items
  FOR SELECT USING (is_admin());

-- coupon_usage: admin debe poder insertar/borrar por órdenes ajenas
DROP POLICY IF EXISTS "coupon_usage_insert_own" ON coupon_usage;
CREATE POLICY "coupon_usage_insert_own" ON coupon_usage
  FOR INSERT WITH CHECK (is_owner(user_id) OR is_admin());

CREATE POLICY "coupon_usage_delete_admin" ON coupon_usage
  FOR DELETE USING (is_admin());

CREATE POLICY "coupon_usage_update_admin" ON coupon_usage
  FOR UPDATE USING (is_admin());

-- 2. RPC: admin_update_order
-- Reemplaza items y recalcula totales + cupón
CREATE OR REPLACE FUNCTION admin_update_order(
  p_order_id UUID,
  p_items JSONB, -- [{"product_id": uuid, "variant_id": uuid|null, "quantity": int}]
  p_coupon_code TEXT DEFAULT NULL,
  p_shipping_cost NUMERIC DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order RECORD;
  v_subtotal NUMERIC(12,2) := 0;
  v_discount NUMERIC(12,2) := 0;
  v_total NUMERIC(12,2);
  v_shipping NUMERIC(12,2);
  v_coupon RECORD;
  v_coupon_id UUID := NULL;
  v_item JSONB;
  v_product RECORD;
  v_variant RECORD;
  v_unit_price NUMERIC(12,2);
  v_line_subtotal NUMERIC(12,2);
  v_used_count INTEGER;
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin' AND is_active = true) THEN
    RAISE EXCEPTION 'Unauthorized: admin required';
  END IF;

  SELECT * INTO v_order FROM orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Order not found: %', p_order_id; END IF;

  IF v_order.status IN ('delivered', 'cancelled') THEN
    RAISE EXCEPTION 'Cannot edit order in status %', v_order.status;
  END IF;
  -- shipped también bloqueado para evitar descuadre inventario
  IF v_order.status = 'shipped' THEN
    RAISE EXCEPTION 'Cannot edit shipped order';
  END IF;

  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Order must have at least one item';
  END IF;

  -- Validar y calcular subtotal iterando items
  -- Primero borrar items existentes (se reinsertan tras validar)
  -- Pero validar antes: acumular subtotal sin borrar aún

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    IF (v_item->>'product_id') IS NULL THEN RAISE EXCEPTION 'product_id required in items'; END IF;
    IF (v_item->>'quantity') IS NULL OR (v_item->>'quantity')::INT <= 0 THEN RAISE EXCEPTION 'quantity must be >0'; END IF;

    SELECT id, name, sku, base_price, sale_price, promotion_active, stock, has_variants
      INTO v_product FROM products WHERE id = (v_item->>'product_id')::UUID;
    IF NOT FOUND THEN RAISE EXCEPTION 'Product not found: %', v_item->>'product_id'; END IF;

    IF v_item->>'variant_id' IS NOT NULL AND (v_item->>'variant_id') <> 'null' AND trim(v_item->>'variant_id') <> '' THEN
      SELECT id, name, price_adjustment, stock INTO v_variant
        FROM product_variants WHERE id = (v_item->>'variant_id')::UUID AND product_id = v_product.id;
      IF NOT FOUND THEN RAISE EXCEPTION 'Variant not found for product %', v_product.name; END IF;
      v_unit_price := COALESCE(CASE WHEN v_product.promotion_active AND v_product.sale_price IS NOT NULL THEN v_product.sale_price ELSE v_product.base_price END, 0) + COALESCE(v_variant.price_adjustment, 0);
    ELSE
      IF v_product.has_variants THEN RAISE EXCEPTION 'Product % requires variant', v_product.name; END IF;
      v_variant := NULL;
      v_unit_price := COALESCE(CASE WHEN v_product.promotion_active AND v_product.sale_price IS NOT NULL THEN v_product.sale_price ELSE v_product.base_price END, 0);
    END IF;

    v_line_subtotal := v_unit_price * (v_item->>'quantity')::INT;
    v_subtotal := v_subtotal + v_line_subtotal;
  END LOOP;

  -- Shipping
  v_shipping := COALESCE(p_shipping_cost, v_order.shipping_cost);

  -- Coupon handling
  IF p_coupon_code IS NOT NULL AND trim(p_coupon_code) <> '' THEN
    SELECT * INTO v_coupon FROM coupons WHERE code = upper(trim(p_coupon_code));
    IF v_coupon.id IS NULL THEN RAISE EXCEPTION 'Cupón no existe: %', p_coupon_code; END IF;
    IF NOT v_coupon.is_active THEN RAISE EXCEPTION 'Cupón inactivo'; END IF;
    IF v_coupon.starts_at IS NOT NULL AND v_coupon.starts_at > now() THEN RAISE EXCEPTION 'Cupón aún no vigente'; END IF;
    IF v_coupon.ends_at IS NOT NULL AND v_coupon.ends_at < now() THEN RAISE EXCEPTION 'Cupón expirado'; END IF;
    IF v_coupon.min_order_amount IS NOT NULL AND v_subtotal < v_coupon.min_order_amount THEN
      RAISE EXCEPTION 'Monto mínimo % no alcanzado para cupón', v_coupon.min_order_amount;
    END IF;
    -- max_uses: excluir la propia orden del conteo
    IF v_coupon.max_uses IS NOT NULL THEN
      SELECT count(*) INTO v_used_count FROM coupon_usage WHERE coupon_id = v_coupon.id AND order_id <> p_order_id;
      IF v_used_count >= v_coupon.max_uses THEN RAISE EXCEPTION 'Límite global de usos alcanzado'; END IF;
    END IF;
    IF v_coupon.max_uses_per_user IS NOT NULL THEN
      SELECT count(*) INTO v_used_count FROM coupon_usage WHERE coupon_id = v_coupon.id AND user_id = v_order.user_id AND order_id <> p_order_id;
      IF v_used_count >= v_coupon.max_uses_per_user THEN RAISE EXCEPTION 'Límite por usuario alcanzado'; END IF;
    END IF;
    IF v_coupon.type = 'percentage' THEN
      v_discount := LEAST(v_subtotal * (v_coupon.value / 100), v_subtotal);
    ELSE
      v_discount := LEAST(v_coupon.value, v_subtotal);
    END IF;
    v_coupon_id := v_coupon.id;
  ELSE
    v_coupon_id := NULL;
    v_discount := 0;
  END IF;

  v_total := v_subtotal + v_shipping - v_discount;
  IF v_total < 0 THEN v_total := 0; END IF;

  -- Aplicar cambios: borrar items y reinsertar
  DELETE FROM order_items WHERE order_id = p_order_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    SELECT id, name, sku, base_price, sale_price, promotion_active INTO v_product FROM products WHERE id = (v_item->>'product_id')::UUID;
    IF (v_item->>'variant_id') IS NOT NULL AND (v_item->>'variant_id') <> 'null' AND trim(v_item->>'variant_id') <> '' THEN
      SELECT id, name, price_adjustment INTO v_variant FROM product_variants WHERE id = (v_item->>'variant_id')::UUID;
      v_unit_price := COALESCE(CASE WHEN v_product.promotion_active AND v_product.sale_price IS NOT NULL THEN v_product.sale_price ELSE v_product.base_price END, 0) + COALESCE(v_variant.price_adjustment, 0);
      INSERT INTO order_items (order_id, product_id, variant_id, product_name, product_sku, variant_name, unit_price, quantity, subtotal)
      VALUES (p_order_id, v_product.id, v_variant.id, v_product.name, v_product.sku, v_variant.name, v_unit_price, (v_item->>'quantity')::INT, v_unit_price * (v_item->>'quantity')::INT);
    ELSE
      v_unit_price := COALESCE(CASE WHEN v_product.promotion_active AND v_product.sale_price IS NOT NULL THEN v_product.sale_price ELSE v_product.base_price END, 0);
      INSERT INTO order_items (order_id, product_id, variant_id, product_name, product_sku, variant_name, unit_price, quantity, subtotal)
      VALUES (p_order_id, v_product.id, NULL, v_product.name, v_product.sku, NULL, v_unit_price, (v_item->>'quantity')::INT, v_unit_price * (v_item->>'quantity')::INT);
    END IF;
  END LOOP;

  -- coupon_usage: reemplazar
  DELETE FROM coupon_usage WHERE order_id = p_order_id;
  IF v_coupon_id IS NOT NULL THEN
    INSERT INTO coupon_usage (coupon_id, order_id, user_id) VALUES (v_coupon_id, p_order_id, v_order.user_id);
  END IF;

  UPDATE orders SET subtotal = v_subtotal, discount = v_discount, total = v_total, coupon_id = v_coupon_id, shipping_cost = v_shipping, updated_at = now() WHERE id = p_order_id;

  PERFORM log_audit(auth.uid(), 'update', 'order', p_order_id::TEXT, jsonb_build_object('order_number', v_order.order_number), jsonb_build_object('subtotal', v_subtotal, 'discount', v_discount, 'total', v_total, 'coupon_id', v_coupon_id));

  RETURN p_order_id;
END;
$$;

GRANT EXECUTE ON FUNCTION admin_update_order(UUID, JSONB, TEXT, NUMERIC) TO authenticated;

-- Necesario para que admin pueda leer coupon aunque is_active filter via RLS ya permite si is_admin

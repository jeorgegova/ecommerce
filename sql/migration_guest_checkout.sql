-- Guest checkout: stores an order snapshot without creating an auth user/profile.
-- Apply after database_schema_Fase1.sql and database_functions_fase2.sql.

ALTER TABLE public.orders
  ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS guest_name TEXT,
  ADD COLUMN IF NOT EXISTS guest_email TEXT,
  ADD COLUMN IF NOT EXISTS guest_phone TEXT,
  ADD COLUMN IF NOT EXISTS guest_access_token UUID;

CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_guest_access_token
  ON public.orders (guest_access_token)
  WHERE guest_access_token IS NOT NULL;

ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_customer_required;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_customer_required
  CHECK (user_id IS NOT NULL OR (guest_name IS NOT NULL AND guest_email IS NOT NULL));

ALTER TABLE public.coupon_usage
  ALTER COLUMN user_id DROP NOT NULL;

DROP FUNCTION IF EXISTS public.create_guest_order(JSONB, TEXT, TEXT, TEXT, JSONB);

CREATE OR REPLACE FUNCTION public.create_guest_order(
  p_items             JSONB,
  p_guest_name        TEXT,
  p_guest_email       TEXT,
  p_guest_phone       TEXT,
  p_shipping_address  JSONB,
  p_coupon_id         UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id UUID;
  v_access_token UUID := gen_random_uuid();
  v_order_number TEXT := generate_order_number();
  v_subtotal NUMERIC(12,2) := 0;
  v_item JSONB;
  v_product RECORD;
  v_coupon RECORD;
  v_discount NUMERIC(12,2) := 0;
  v_used_count INTEGER;
  v_variant_stock INTEGER;
  v_variant_name TEXT;
  v_variant_price_adjustment NUMERIC(12,2);
  v_unit_price NUMERIC(12,2);
BEGIN
  IF auth.uid() IS NOT NULL THEN
    RAISE EXCEPTION 'Use the authenticated checkout for signed-in users';
  END IF;

  IF NULLIF(trim(p_guest_name), '') IS NULL OR NULLIF(trim(p_guest_email), '') IS NULL
     OR position('@' IN p_guest_email) = 0 THEN
    RAISE EXCEPTION 'Guest name and a valid email are required';
  END IF;

  IF jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Cart is empty';
  END IF;

  IF p_shipping_address IS NULL OR NULLIF(trim(p_shipping_address->>'address_line_1'), '') IS NULL
     OR NULLIF(trim(p_shipping_address->>'city'), '') IS NULL THEN
    RAISE EXCEPTION 'Shipping address is required';
  END IF;

  IF p_coupon_id IS NOT NULL THEN
    SELECT * INTO v_coupon
      FROM coupons
     WHERE id = p_coupon_id
       AND is_active = true
       AND (starts_at IS NULL OR starts_at <= now())
       AND (ends_at IS NULL OR ends_at >= now());
    IF NOT FOUND THEN RAISE EXCEPTION 'Coupon not found or expired'; END IF;
    IF v_coupon.max_uses IS NOT NULL THEN
      SELECT count(*) INTO v_used_count FROM coupon_usage WHERE coupon_id = p_coupon_id;
      IF v_used_count >= v_coupon.max_uses THEN RAISE EXCEPTION 'Coupon usage limit reached'; END IF;
    END IF;
  END IF;

  INSERT INTO orders (
    user_id, order_number, status, subtotal, shipping_cost, discount, total,
    guest_name, guest_email, guest_phone, guest_access_token, shipping_address
  ) VALUES (
    NULL, v_order_number, 'pending', 0, 0, 0, 0,
    trim(p_guest_name), lower(trim(p_guest_email)), NULLIF(trim(p_guest_phone), ''),
    v_access_token, p_shipping_address
  ) RETURNING id INTO v_order_id;

  FOR v_item IN SELECT value FROM jsonb_array_elements(p_items)
  LOOP
    SELECT p.*, (p.sale_price IS NOT NULL AND p.promotion_active) AS has_sale
      INTO v_product
      FROM products p
     WHERE p.id = (v_item->>'product_id')::UUID
     FOR UPDATE;

    IF NOT FOUND THEN RAISE EXCEPTION 'Product not found'; END IF;
    IF (v_item->>'quantity')::INTEGER < 1 THEN RAISE EXCEPTION 'Invalid quantity'; END IF;

    v_unit_price := CASE WHEN v_product.has_sale THEN v_product.sale_price ELSE v_product.base_price END;
    v_variant_stock := NULL;
    v_variant_name := NULL;
    v_variant_price_adjustment := NULL;

    IF v_item->>'variant_id' IS NOT NULL AND v_item->>'variant_id' <> '' THEN
      SELECT stock, name, price_adjustment
        INTO v_variant_stock, v_variant_name, v_variant_price_adjustment
        FROM product_variants
       WHERE id = (v_item->>'variant_id')::UUID AND product_id = v_product.id
       FOR UPDATE;
      IF NOT FOUND THEN RAISE EXCEPTION 'Product variant not found'; END IF;
      IF v_variant_stock < (v_item->>'quantity')::INTEGER THEN RAISE EXCEPTION 'Insufficient stock for %', v_product.name; END IF;
      v_unit_price := v_unit_price + COALESCE(v_variant_price_adjustment, 0);
    ELSE
      IF v_product.has_variants THEN RAISE EXCEPTION 'A variant is required for %', v_product.name; END IF;
      IF v_product.stock < (v_item->>'quantity')::INTEGER THEN RAISE EXCEPTION 'Insufficient stock for %', v_product.name; END IF;
    END IF;

    INSERT INTO order_items (order_id, product_id, variant_id, product_name, product_sku, variant_name, unit_price, quantity, subtotal)
    VALUES (
      v_order_id, v_product.id, NULLIF(v_item->>'variant_id', '')::UUID, v_product.name, v_product.sku,
      v_variant_name, v_unit_price, (v_item->>'quantity')::INTEGER, v_unit_price * (v_item->>'quantity')::INTEGER
    );
    v_subtotal := v_subtotal + v_unit_price * (v_item->>'quantity')::INTEGER;
  END LOOP;

  IF p_coupon_id IS NOT NULL THEN
    IF v_coupon.min_order_amount IS NOT NULL AND v_subtotal < v_coupon.min_order_amount THEN
      RAISE EXCEPTION 'Minimum order amount not met';
    END IF;
    IF v_coupon.type = 'percentage' THEN
      v_discount := LEAST(v_subtotal * (v_coupon.value / 100), v_subtotal);
    ELSE
      v_discount := LEAST(v_coupon.value, v_subtotal);
    END IF;
  END IF;

  UPDATE orders SET subtotal = v_subtotal, discount = v_discount, total = v_subtotal - v_discount, coupon_id = p_coupon_id WHERE id = v_order_id;

  IF p_coupon_id IS NOT NULL THEN
    INSERT INTO coupon_usage (coupon_id, order_id, user_id) VALUES (p_coupon_id, v_order_id, NULL);
  END IF;

  RETURN jsonb_build_object(
    'order_id', v_order_id, 'order_number', v_order_number, 'access_token', v_access_token,
    'created_at', now(), 'status', 'pending', 'subtotal', v_subtotal, 'shipping_cost', 0,
    'discount', v_discount, 'total', v_subtotal - v_discount,
    'guest_name', trim(p_guest_name), 'guest_email', lower(trim(p_guest_email)), 'guest_phone', p_guest_phone,
    'shipping_address', p_shipping_address,
    'items', COALESCE((SELECT jsonb_agg(jsonb_build_object(
      'product_name', product_name, 'product_sku', product_sku, 'variant_name', variant_name,
      'quantity', quantity, 'unit_price', unit_price, 'subtotal', subtotal
    ) ORDER BY created_at) FROM order_items WHERE order_id = v_order_id), '[]'::jsonb)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.create_guest_order(JSONB, TEXT, TEXT, TEXT, JSONB, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_guest_order(JSONB, TEXT, TEXT, TEXT, JSONB, UUID) TO anon, authenticated;

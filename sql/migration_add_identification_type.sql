-- Tipo de documento de identidad + snapshot en la orden.
--
-- ---------------------------------------------------------------------------
-- POR QUE
-- ---------------------------------------------------------------------------
-- profiles.identification era un texto libre de 3 a 32 caracteres: no distinguia
-- una cedula de un NIT ni de un pasaporte. Ademas la proforma lo leia del perfil
-- al imprimirse, asi que editar el perfil despues cambiaba proformas ya
-- emitidas.
--
-- 1) profiles.identification_type  -> que documento es (cc | nit | ce | passport)
-- 2) orders.identification{,_type} -> copia congelada en el momento de la venta
--
-- Los valores validos son los de IDENTIFICATION_TYPE_VALUES en
-- src/lib/identification.ts. Si agregas uno, actualiza los dos CHECK de abajo.
--
-- Los usuarios que ya tienen `identification` guardado quedan con
-- `identification_type = NULL` a proposito: no se adivina (9 digitos puede ser
-- CC o CE) y la interfaz se los pregunta una sola vez.
--
-- Aplicar DESPUES de migration_add_profile_identification.sql.

-- ---------------------------------------------------------------------------
-- 1. profiles: tipo de documento
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS identification_type TEXT;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_identification_type_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_identification_type_check
  CHECK (identification_type IS NULL OR identification_type IN ('cc', 'nit', 'ce', 'passport'));

-- ---------------------------------------------------------------------------
-- 2. orders: snapshot
-- ---------------------------------------------------------------------------
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS identification TEXT;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS identification_type TEXT;

ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_identification_type_check;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_identification_type_check
  CHECK (identification_type IS NULL OR identification_type IN ('cc', 'nit', 'ce', 'passport'));

COMMENT ON COLUMN public.profiles.identification_type IS
  'Tipo de documento: cc, nit, ce, passport. NULL = aun no confirmado por el usuario.';

COMMENT ON COLUMN public.orders.identification IS
  'Snapshot de profiles.identification al crear la orden. No se actualiza si el cliente edita su perfil.';

-- ---------------------------------------------------------------------------
-- 3. create_order_from_cart: copiar la identificacion a la orden
-- ---------------------------------------------------------------------------
-- Se redeclara la funcion completa (mismo cuerpo que database_functions_fase2.sql)
-- unicamente para agregar el snapshot. CREATE OR REPLACE conserva la firma y
-- los atributos SECURITY DEFINER / SET search_path que fijo
-- migration_order_security_and_statuses.sql.
--
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
  v_identification      TEXT;
  v_identification_type TEXT;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Unauthorized order creation';
  END IF;

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
  -- Snapshot de la identificacion del cliente. La proforma es un documento
  -- comercial: debe reflejar los datos que tenia al momento de la venta, no
  -- los que tenga el perfil despues de que el cliente los edite.
  SELECT p.identification, p.identification_type
  INTO v_identification, v_identification_type
  FROM public.profiles p
  WHERE p.id = p_user_id;

  INSERT INTO orders (
    user_id, order_number, status, subtotal, shipping_cost, discount, total,
    notes, shipping_address_id, billing_address_id, coupon_id,
    identification, identification_type
  ) VALUES (
    p_user_id, v_order_number, 'pending', v_subtotal, v_shipping_cost, v_discount, v_total,
    p_notes, p_shipping_address_id, p_billing_address_id, p_coupon_id,
    v_identification, v_identification_type
  ) RETURNING id INTO v_order_id;

  -- Crear order_items. El inventario se descuenta al confirmar la orden.
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
-- 4. Verificacion
-- ---------------------------------------------------------------------------
--
--   -- a) columnas y CHECK instalada
--   SELECT column_name, data_type FROM information_schema.columns
--   WHERE table_name IN ('profiles', 'orders')
--     AND column_name LIKE 'identification%' ORDER BY table_name;
--
--   -- b) sobre usuarios con numero guardado pero sin tipo: son los que habra
--   --    que volver a preguntar (no se adivina)
--   SELECT count(*) FROM profiles
--   WHERE identification IS NOT NULL AND identification_type IS NULL;
--
--   -- c) despues de una venta, la orden debe tener su propia copia
--   SELECT order_number, identification, identification_type
--   FROM orders ORDER BY created_at DESC LIMIT 5;

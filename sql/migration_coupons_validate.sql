-- =============================================================================
-- COUPON VALIDATION helpers
-- =============================================================================

-- Valida cupón por código y retorna detalle + errores. Usado desde checkout y admin.
CREATE OR REPLACE FUNCTION validate_coupon(
  p_code TEXT,
  p_user_id UUID DEFAULT NULL,
  p_subtotal NUMERIC DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  code TEXT,
  type TEXT,
  value NUMERIC,
  min_order_amount NUMERIC,
  max_uses INTEGER,
  max_uses_per_user INTEGER,
  is_active BOOLEAN,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  is_valid BOOLEAN,
  error_message TEXT,
  uses_count BIGINT,
  user_uses_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_coupon RECORD;
  v_total_uses BIGINT := 0;
  v_user_uses BIGINT := 0;
  v_is_valid BOOLEAN := true;
  v_error TEXT := NULL;
  v_code TEXT := upper(trim(p_code));
BEGIN
  IF v_code IS NULL OR v_code = '' THEN
    RETURN QUERY SELECT
      NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::NUMERIC, NULL::NUMERIC,
      NULL::INTEGER, NULL::INTEGER, NULL::BOOLEAN, NULL::TIMESTAMPTZ, NULL::TIMESTAMPTZ,
      false, 'Código vacío'::TEXT, 0::BIGINT, 0::BIGINT;
    RETURN;
  END IF;

  SELECT * INTO v_coupon FROM coupons WHERE coupons.code = v_code;

  IF v_coupon.id IS NULL THEN
    RETURN QUERY SELECT
      NULL::UUID, v_code, NULL::TEXT, NULL::NUMERIC, NULL::NUMERIC,
      NULL::INTEGER, NULL::INTEGER, NULL::BOOLEAN, NULL::TIMESTAMPTZ, NULL::TIMESTAMPTZ,
      false, 'Cupón no existe'::TEXT, 0::BIGINT, 0::BIGINT;
    RETURN;
  END IF;

  SELECT count(*) INTO v_total_uses FROM coupon_usage WHERE coupon_id = v_coupon.id;
  IF p_user_id IS NOT NULL THEN
    SELECT count(*) INTO v_user_uses FROM coupon_usage WHERE coupon_id = v_coupon.id AND user_id = p_user_id;
  END IF;

  IF NOT v_coupon.is_active THEN
    v_is_valid := false; v_error := 'Cupón inactivo';
  ELSIF v_coupon.starts_at IS NOT NULL AND v_coupon.starts_at > now() THEN
    v_is_valid := false; v_error := 'Cupón aún no vigente';
  ELSIF v_coupon.ends_at IS NOT NULL AND v_coupon.ends_at < now() THEN
    v_is_valid := false; v_error := 'Cupón expirado';
  ELSIF p_subtotal IS NOT NULL AND v_coupon.min_order_amount IS NOT NULL AND p_subtotal < v_coupon.min_order_amount THEN
    v_is_valid := false; v_error := format('Monto mínimo %s no alcanzado', v_coupon.min_order_amount);
  ELSIF v_coupon.max_uses IS NOT NULL AND v_total_uses >= v_coupon.max_uses THEN
    v_is_valid := false; v_error := 'Límite global de usos alcanzado';
  ELSIF p_user_id IS NOT NULL AND v_coupon.max_uses_per_user IS NOT NULL AND v_user_uses >= v_coupon.max_uses_per_user THEN
    v_is_valid := false; v_error := 'Límite por usuario alcanzado';
  END IF;

  RETURN QUERY SELECT
    v_coupon.id, v_coupon.code, v_coupon.type, v_coupon.value,
    v_coupon.min_order_amount, v_coupon.max_uses, v_coupon.max_uses_per_user,
    v_coupon.is_active, v_coupon.starts_at, v_coupon.ends_at,
    v_is_valid, v_error, v_total_uses, v_user_uses;
END;
$$;

-- Wrapper simple para validar solo por código (sin usuario/subtotal) — usado para preview admin
CREATE OR REPLACE FUNCTION get_coupon_by_code(p_code TEXT)
RETURNS SETOF coupons
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM coupons WHERE code = upper(trim(p_code)) AND is_active = true
    AND (starts_at IS NULL OR starts_at <= now())
    AND (ends_at IS NULL OR ends_at >= now())
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION validate_coupon(TEXT, UUID, NUMERIC) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_coupon_by_code(TEXT) TO authenticated, anon;

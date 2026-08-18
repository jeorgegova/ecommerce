-- Apply after database_functions_fase2.sql.
-- Source function now validates auth.uid(), uses SECURITY DEFINER and public search_path.

ALTER FUNCTION public.create_order_from_cart(uuid, uuid, uuid, text, uuid)
  SECURITY DEFINER
  SET search_path = public;

REVOKE ALL ON FUNCTION public.record_movement(uuid, uuid, uuid, text, integer, text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.record_movement(uuid, uuid, uuid, text, integer, text, text, text) FROM authenticated;

INSERT INTO public.order_statuses (code, name, description, color, sort_order, is_active) VALUES
  ('pending', 'Pendiente', NULL, '#F59E0B', 1, true),
  ('confirmed', 'Confirmado', NULL, '#3B82F6', 2, true),
  ('processing', 'En preparación', NULL, '#8B5CF6', 3, true),
  ('shipped', 'Enviado', NULL, '#06B6D4', 4, true),
  ('delivered', 'Entregado', NULL, '#10B981', 5, true),
  ('cancelled', 'Cancelado', NULL, '#EF4444', 6, true)
ON CONFLICT (code) DO NOTHING;

-- Re-run create_order_from_cart section from database_functions_fase2.sql to install auth.uid() validation.

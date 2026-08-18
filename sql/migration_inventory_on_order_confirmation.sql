-- Inventory policy:
--   create_order_from_cart creates the proforma/order and validates requested stock.
--   update_order_status('confirmed') performs the sale movement and stock decrement.
--
-- Apply the updated sections 3.2 and 3.3 from database_functions_fase2.sql.
-- The ALTER below also protects status changes when the RPC is called from the client.

ALTER FUNCTION public.update_order_status(uuid, text, uuid, text)
  SECURITY DEFINER
  SET search_path = public;

-- Do not grant record_movement to clients. Admin UI should use update_order_status
-- for approval; record_movement remains an internal inventory primitive.
REVOKE ALL ON FUNCTION public.record_movement(uuid, uuid, uuid, text, integer, text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.record_movement(uuid, uuid, uuid, text, integer, text, text, text) FROM authenticated;

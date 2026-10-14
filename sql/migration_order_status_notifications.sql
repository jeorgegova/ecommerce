-- =============================================================================
-- MIGRATION: Notificaciones de Cambio de Estado de Pedidos
-- Ejecutar en Supabase SQL Editor
-- =============================================================================

-- 1. Asegurar columnas necesarias en la tabla notifications
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS message TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS reference_type TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS reference_id UUID;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS action_url TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'normal';

-- 2. Asegurar que el constraint de tipos incluya todos los tipos de pedidos
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check CHECK (
  type = ANY (ARRAY[
    'order_confirmed', 'order_shipped', 'order_delivered', 'order_cancelled',
    'question_answered', 'question_created',
    'review_reply', 'price_drop', 'back_in_stock',
    'admin_alert', 'order_updated', 'system'
  ])
);

-- 3. Crear índices para optimizar lecturas
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- 4. Función trigger para notificar cambios de estado en pedidos
CREATE OR REPLACE FUNCTION notify_order_status_changed()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_title TEXT;
  v_message TEXT;
  v_type TEXT;
  v_status_name TEXT;
BEGIN
  -- Solo actuar si el estado cambió en una actualización o si es un nuevo pedido
  IF TG_OP = 'UPDATE' AND OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  -- Si es un nuevo pedido (INSERT)
  IF TG_OP = 'INSERT' THEN
    v_type := 'order_updated';
    v_title := 'Pedido recibido';
    v_message := 'Tu pedido #' || NEW.order_number || ' ha sido registrado y está en revisión.';
  ELSE
    -- Obtener nombre legible del estado si existe en order_statuses
    SELECT name INTO v_status_name FROM order_statuses WHERE code = NEW.status;
    IF v_status_name IS NULL THEN
      v_status_name := NEW.status;
    END IF;

    -- Definir tipo, título y mensaje amigable según el nuevo estado
    CASE NEW.status
      WHEN 'confirmed' THEN
        v_type := 'order_confirmed';
        v_title := 'Pedido confirmado';
        v_message := 'Tu pedido #' || NEW.order_number || ' ha sido confirmado y está listo para ser preparado.';
      WHEN 'processing' THEN
        v_type := 'order_updated';
        v_title := 'Pedido en preparación';
        v_message := 'Tu pedido #' || NEW.order_number || ' está siendo preparado para su envío.';
      WHEN 'shipped' THEN
        v_type := 'order_shipped';
        v_title := 'Pedido enviado';
        v_message := '¡Tu pedido #' || NEW.order_number || ' va en camino!';
      WHEN 'delivered' THEN
        v_type := 'order_delivered';
        v_title := 'Pedido entregado';
        v_message := 'Tu pedido #' || NEW.order_number || ' ha sido entregado con éxito. ¡Gracias por tu compra!';
      WHEN 'cancelled' THEN
        v_type := 'order_cancelled';
        v_title := 'Pedido cancelado';
        v_message := 'Tu pedido #' || NEW.order_number || ' ha sido cancelado.' ||
                     CASE WHEN NEW.cancellation_reason IS NOT NULL AND TRIM(NEW.cancellation_reason) <> ''
                          THEN ' Motivo: ' || TRIM(NEW.cancellation_reason)
                          ELSE ''
                     END;
      ELSE
        v_type := 'order_updated';
        v_title := 'Actualización de pedido';
        v_message := 'Tu pedido #' || NEW.order_number || ' ha cambiado a estado: ' || v_status_name || '.';
    END CASE;
  END IF;

  -- Insertar notificación para el usuario dueño del pedido
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    body,
    reference_type,
    reference_id,
    action_url,
    priority
  ) VALUES (
    NEW.user_id,
    v_type,
    v_title,
    v_message,
    v_message,
    'order',
    NEW.id,
    '/account/orders/' || NEW.id,
    'high'
  );

  RETURN NEW;
END;
$$;

-- 5. Crear el trigger en la tabla orders (para INSERT y UPDATE de status)
DROP TRIGGER IF EXISTS trg_notify_order_status_changed ON orders;
CREATE TRIGGER trg_notify_order_status_changed
  AFTER INSERT OR UPDATE OF status ON orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_order_status_changed();

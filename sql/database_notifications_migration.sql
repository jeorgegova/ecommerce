-- =============================================================================
-- NOTIFICATIONS MIGRATION — Agrega columnas y triggers a tabla existente
-- Ejecutar en Supabase SQL Editor
-- =============================================================================

-- 1. Agregar columnas faltantes (sin borrar nada)
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS message TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS reference_type TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS reference_id UUID;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS action_url TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'normal';

-- Eliminar constraint viejo y recrear con todos los tipos necesarios
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check CHECK (
  type = ANY (ARRAY[
    'order_confirmed', 'order_shipped', 'order_delivered', 'order_cancelled',
    'question_answered', 'question_created',
    'review_reply', 'price_drop', 'back_in_stock',
    'admin_alert', 'order_updated', 'system'
  ])
);

-- 2. Copiar body → message si body existe
UPDATE notifications SET message = body WHERE message IS NULL AND body IS NOT NULL;

-- 3. Crear índices (IF NOT EXISTS para evitar error)
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- 4. Helper: obtener IDs de admins
CREATE OR REPLACE FUNCTION get_admin_ids()
RETURNS SETOF UUID
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT id FROM profiles WHERE role = 'admin' AND is_active = true;
$$;

-- 5. Trigger: notificar a admins cuando se crea una pregunta
CREATE OR REPLACE FUNCTION notify_question_created()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  product_name TEXT;
  customer_name TEXT;
  admin_id UUID;
BEGIN
  SELECT name INTO product_name FROM products WHERE id = NEW.product_id;
  SELECT full_name INTO customer_name FROM profiles WHERE id = NEW.user_id;

  FOR admin_id IN SELECT * FROM get_admin_ids() LOOP
    INSERT INTO notifications (user_id, type, title, message, reference_type, reference_id, action_url, priority)
    VALUES (
      admin_id,
      'admin_alert',
      'Nueva pregunta',
      customer_name || ' preguntó sobre ' || product_name,
      'question',
      NEW.id,
      '/admin/questions',
      'high'
    );
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_question_created ON questions;
CREATE TRIGGER trg_notify_question_created
  AFTER INSERT ON questions
  FOR EACH ROW
  EXECUTE FUNCTION notify_question_created();

-- 6. Trigger: notificar al comprador cuando responden su pregunta
CREATE OR REPLACE FUNCTION notify_question_answered()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  product_name TEXT;
BEGIN
  IF NEW.answer IS NOT NULL AND (OLD.answer IS NULL OR OLD.answer <> NEW.answer) THEN
    SELECT name INTO product_name FROM products WHERE id = NEW.product_id;

    INSERT INTO notifications (user_id, type, title, message, reference_type, reference_id, action_url, priority)
    VALUES (
      NEW.user_id,
      'question_answered',
      'Respuesta recibida',
      'Respondieron tu pregunta sobre ' || product_name,
      'question',
      NEW.id,
      '/products/' || (SELECT slug FROM products WHERE id = NEW.product_id),
      'high'
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_question_answered ON questions;
CREATE TRIGGER trg_notify_question_answered
  AFTER UPDATE OF answer ON questions
  FOR EACH ROW
  EXECUTE FUNCTION notify_question_answered();

-- 6b. Trigger: notificar al comprador cuando cambia el estado de su pedido
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
  IF TG_OP = 'UPDATE' AND OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    v_type := 'order_updated';
    v_title := 'Pedido recibido';
    v_message := 'Tu pedido #' || NEW.order_number || ' ha sido registrado y está en revisión.';
  ELSE
    SELECT name INTO v_status_name FROM order_statuses WHERE code = NEW.status;
    IF v_status_name IS NULL THEN
      v_status_name := NEW.status;
    END IF;

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

DROP TRIGGER IF EXISTS trg_notify_order_status_changed ON orders;
CREATE TRIGGER trg_notify_order_status_changed
  AFTER INSERT OR UPDATE OF status ON orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_order_status_changed();

-- 7. RLS: admin ve todo
DROP POLICY IF EXISTS "notifications_manage_admin" ON notifications;
CREATE POLICY "notifications_manage_admin" ON notifications
  FOR ALL USING (is_admin());

-- 8. Funciones RPC para la UI
CREATE OR REPLACE FUNCTION mark_all_notifications_read(p_user_id UUID)
RETURNS void
LANGUAGE sql SECURITY DEFINER
AS $$
  UPDATE notifications SET is_read = true, read_at = now()
  WHERE user_id = p_user_id AND is_read = false;
$$;

CREATE OR REPLACE FUNCTION delete_read_notifications(p_user_id UUID)
RETURNS void
LANGUAGE sql SECURITY DEFINER
AS $$
  DELETE FROM notifications WHERE user_id = p_user_id AND is_read = true;
$$;

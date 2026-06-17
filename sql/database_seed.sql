-- =============================================================================
-- SEED DATA
-- Ecommerce Platform — PostgreSQL + Supabase
-- =============================================================================
-- Ejecutar DESPUÉS de todos los demás scripts SQL.
-- =============================================================================

-- =============================================================================
-- 1. ORDER STATUSES
-- =============================================================================

INSERT INTO order_statuses (code, name, description, color, sort_order, is_active) VALUES
  ('pending',    'Pendiente',    'Pedido recibido, esperando confirmación de pago',  '#F59E0B', 1, true),
  ('confirmed',  'Confirmado',   'Pago confirmado, preparando pedido',               '#3B82F6', 2, true),
  ('processing', 'En proceso',   'Pedido siendo preparado para envío',               '#8B5CF6', 3, true),
  ('shipped',    'Enviado',      'Pedido despachado, en tránsito',                     '#06B6D4', 4, true),
  ('delivered',  'Entregado',    'Pedido entregado al cliente',                       '#10B981', 5, true),
  ('cancelled',  'Cancelado',    'Pedido cancelado',                                  '#EF4444', 6, true)
ON CONFLICT (code) DO NOTHING;

-- =============================================================================
-- 2. SETTINGS
-- =============================================================================

INSERT INTO settings (key, value, description) VALUES
  ('store_name',         '"GoGi"',                                       'Nombre de la tienda'),
  ('store_description',  '"Tu tienda de confianza"',                     'Descripción corta de la tienda'),
  ('store_email',        '"hola@gogi.co"',                               'Correo principal de la tienda'),
  ('store_phone',        '"+57 300 000 0000"',                           'Teléfono de contacto'),
  ('store_currency',     '"COP"',                                        'Moneda por defecto'),
  ('store_locale',       '"es-CO"',                                      'Locale por defecto'),
  ('store_timezone',     '"America/Bogota"',                             'Zona horaria'),
  ('store_logo_url',     '""',                                           'URL del logo'),
  ('store_favicon_url',  '""',                                           'URL del favicon'),
  ('social_instagram',   '""',                                           'Usuario de Instagram'),
  ('social_facebook',    '""',                                           'Página de Facebook'),
  ('social_whatsapp',    '""',                                           'Número de WhatsApp'),
  ('shipping_cost',      '0',                                            'Costo de envío por defecto'),
  ('shipping_free_min',  '150000',                                       'Monto mínimo para envío gratis'),
  ('tax_rate',           '19',                                           'Porcentaje de impuesto (IVA)'),
  ('low_stock_threshold','5',                                            'Stock mínimo para alerta'),
  ('max_view_history',   '100',                                          'Máximo de productos en historial'),
  ('pagination_size',    '20',                                           'Productos por página'),
  ('maintenance_mode',   'false',                                        'Modo mantenimiento'),
  ('order_auto_confirm', 'true',                                         'Confirmar pedidos automáticamente'),
  ('google_analytics_id','""',                                           'ID de Google Analytics'),
  ('gtm_id',             '""',                                           'ID de Google Tag Manager'),
  ('meta_og_image',      '""',                                           'Imagen OG por defecto'),
  ('meta_og_locale',     '"es_CO"',                                      'Locale OG')
ON CONFLICT (key) DO NOTHING;

-- =============================================================================
-- 3. SAMPLE ATTRIBUTES
-- =============================================================================

INSERT INTO attributes (name, slug, type, is_filterable, is_visible_on_product) VALUES
  ('Marca',     'marca',     'select',  true,  true),
  ('Modelo',    'modelo',    'select',  true,  true),
  ('Capacidad', 'capacidad', 'text',    true,  true),
  ('Voltaje',   'voltaje',   'text',    true,  true),
  ('Potencia',  'potencia',  'text',    true,  true),
  ('Tamaño',    'tamano',    'select',  true,  true),
  ('Color',     'color',     'select',  true,  true),
  ('Material',  'material',  'select',  true,  true),
  ('Peso',      'peso',      'text',    false, true),
  ('Garantía',  'garantia',  'text',    false, true)
ON CONFLICT (slug) DO NOTHING;

-- Sample attribute values para Marca
INSERT INTO attribute_values (attribute_id, value, slug, sort_order)
SELECT id, 'Bianchi', 'bianchi', 1 FROM attributes WHERE slug = 'marca'
UNION ALL
SELECT id, 'Necta', 'necta', 2 FROM attributes WHERE slug = 'marca'
UNION ALL
SELECT id, 'AquaPure', 'aquapure', 3 FROM attributes WHERE slug = 'marca'
WHERE NOT EXISTS (SELECT 1 FROM attribute_values WHERE attribute_id = (SELECT id FROM attributes WHERE slug = 'marca') AND slug = 'bianchi');

INSERT INTO attribute_values (attribute_id, value, slug, sort_order)
SELECT id, 'Bianchi', 'bianchi', 1 FROM attributes WHERE slug = 'marca'
UNION ALL
SELECT id, 'Necta', 'necta', 2 FROM attributes WHERE slug = 'marca'
UNION ALL
SELECT id, 'AquaPure', 'aquapure', 3 FROM attributes WHERE slug = 'marca'
ON CONFLICT (attribute_id, slug) DO NOTHING;

INSERT INTO attribute_values (attribute_id, value, slug, sort_order)
SELECT id, 'Lei400', 'lei400', 1 FROM attributes WHERE slug = 'modelo'
UNION ALL
SELECT id, 'Lei300', 'lei300', 2 FROM attributes WHERE slug = 'modelo'
UNION ALL
SELECT id, 'Lei200', 'lei200', 3 FROM attributes WHERE slug = 'modelo'
ON CONFLICT (attribute_id, slug) DO NOTHING;

INSERT INTO attribute_values (attribute_id, value, slug, sort_order)
SELECT id, '20L', '20l', 1 FROM attributes WHERE slug = 'capacidad'
UNION ALL
SELECT id, '50L', '50l', 2 FROM attributes WHERE slug = 'capacidad'
UNION ALL
SELECT id, '100L', '100l', 3 FROM attributes WHERE slug = 'capacidad'
ON CONFLICT (attribute_id, slug) DO NOTHING;

INSERT INTO attribute_values (attribute_id, value, slug, sort_order)
SELECT id, '110V', '110v', 1 FROM attributes WHERE slug = 'voltaje'
UNION ALL
SELECT id, '220V', '220v', 2 FROM attributes WHERE slug = 'voltaje'
ON CONFLICT (attribute_id, slug) DO NOTHING;

INSERT INTO attribute_values (attribute_id, value, slug, sort_order)
SELECT id, 'Pequeño', 'pequeno', 1 FROM attributes WHERE slug = 'tamano'
UNION ALL
SELECT id, 'Mediano', 'mediano', 2 FROM attributes WHERE slug = 'tamano'
UNION ALL
SELECT id, 'Grande', 'grande', 3 FROM attributes WHERE slug = 'tamano'
ON CONFLICT (attribute_id, slug) DO NOTHING;

INSERT INTO attribute_values (attribute_id, value, slug, sort_order)
SELECT id, 'Rojo', 'rojo', 1 FROM attributes WHERE slug = 'color'
UNION ALL
SELECT id, 'Azul', 'azul', 2 FROM attributes WHERE slug = 'color'
UNION ALL
SELECT id, 'Negro', 'negro', 3 FROM attributes WHERE slug = 'color'
UNION ALL
SELECT id, 'Blanco', 'blanco', 4 FROM attributes WHERE slug = 'color'
UNION ALL
SELECT id, 'Gris', 'gris', 5 FROM attributes WHERE slug = 'color'
ON CONFLICT (attribute_id, slug) DO NOTHING;

INSERT INTO attribute_values (attribute_id, value, slug, sort_order)
SELECT id, 'Acero Inoxidable', 'acero-inoxidable', 1 FROM attributes WHERE slug = 'material'
UNION ALL
SELECT id, 'Plástico ABS', 'plastico-abs', 2 FROM attributes WHERE slug = 'material'
UNION ALL
SELECT id, 'Aluminio', 'aluminio', 3 FROM attributes WHERE slug = 'material'
UNION ALL
SELECT id, 'Vidrio', 'vidrio', 4 FROM attributes WHERE slug = 'material'
ON CONFLICT (attribute_id, slug) DO NOTHING;

-- =============================================================================
-- 4. SAMPLE CATEGORIES
-- =============================================================================

-- Categorías raíz
INSERT INTO categories (name, slug, description, level, sort_order, is_active) VALUES
  ('Filtros de Agua', 'filtros-de-agua', 'Filtros y sistemas de purificación de agua', 0, 1, true),
  ('Accesorios',      'accesorios',      'Accesorios y repuestos',                     0, 2, true),
  ('Ofertas',         'ofertas',         'Productos en oferta y promociones',          0, 3, true)
ON CONFLICT (slug) DO NOTHING;

-- Subcategorías de Filtros de Agua
INSERT INTO categories (name, slug, description, parent_id, level, sort_order, is_active)
SELECT 'Filtros Básicos', 'filtros-basicos', 'Filtros de sedimentos y carbón', id, 1, 1, true
FROM categories WHERE slug = 'filtros-de-agua'
AND NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'filtros-basicos');

INSERT INTO categories (name, slug, description, parent_id, level, sort_order, is_active)
SELECT 'Ósmosis Inversa', 'osmosis-inversa', 'Sistemas de ósmosis inversa', id, 1, 2, true
FROM categories WHERE slug = 'filtros-de-agua'
AND NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'osmosis-inversa');

INSERT INTO categories (name, slug, description, parent_id, level, sort_order, is_active)
SELECT 'Repuestos', 'repuestos', 'Repuestos para sistemas de filtración', id, 1, 3, true
FROM categories WHERE slug = 'filtros-de-agua'
AND NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'repuestos');

INSERT INTO categories (name, slug, description, parent_id, level, sort_order, is_active)
SELECT 'Purificadores', 'purificadores', 'Purificadores de agua completos', id, 1, 4, true
FROM categories WHERE slug = 'filtros-de-agua'
AND NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'purificadores');

-- =============================================================================
-- 5. TRIGGERS FOR RATING AUTO-UPDATE
-- =============================================================================

CREATE OR REPLACE FUNCTION trigger_update_product_rating()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM update_product_rating(OLD.product_id);
    RETURN OLD;
  ELSE
    PERFORM update_product_rating(NEW.product_id);
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger cuando se inserta, actualiza o elimina una reseña aprobada
CREATE OR REPLACE FUNCTION trigger_review_rating()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    IF NEW.is_approved THEN
      PERFORM update_product_rating(NEW.product_id);
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM update_product_rating(OLD.product_id);
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_reviews_rating_update
  AFTER INSERT OR UPDATE OF is_approved OR DELETE
  ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION trigger_review_rating();

-- =============================================================================
-- 6. VIEW HISTORY CLEANUP TRIGGER
-- =============================================================================
-- Mantiene máximo de registros en view_history por usuario.

CREATE OR REPLACE FUNCTION cleanup_view_history()
RETURNS trigger AS $$
DECLARE
  v_max_count INTEGER;
BEGIN
  -- Obtener límite de configuración (default 100)
  SELECT COALESCE((s.value::INTEGER), 100)
  INTO v_max_count
  FROM settings s
  WHERE s.key = 'max_view_history';

  DELETE FROM view_history vh
  WHERE vh.user_id = NEW.user_id
    AND vh.id NOT IN (
      SELECT vh2.id FROM view_history vh2
      WHERE vh2.user_id = NEW.user_id
      ORDER BY vh2.viewed_at DESC
      LIMIT v_max_count
    );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_view_history_cleanup
  AFTER INSERT ON view_history
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_view_history();

-- =============================================================================
-- 7. AUTO-CONFIRM ORDER TRIGGER
-- =============================================================================
-- Si la configuración order_auto_confirm está activa,
-- confirma automáticamente los pedidos nuevos.

CREATE OR REPLACE FUNCTION auto_confirm_order()
RETURNS trigger AS $$
DECLARE
  v_auto_confirm BOOLEAN;
BEGIN
  SELECT COALESCE((s.value::BOOLEAN), true) INTO v_auto_confirm
  FROM settings s
  WHERE s.key = 'order_auto_confirm';

  IF v_auto_confirm AND NEW.status = 'pending' THEN
    NEW.status := 'confirmed';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- NOTA: Este trigger está comentado por defecto.
-- Se puede activar cuando se requiera confirmación automática.
-- CREATE TRIGGER trg_orders_auto_confirm
--   BEFORE INSERT ON orders
--   FOR EACH ROW
--   EXECUTE FUNCTION auto_confirm_order();

-- =============================================================================
-- 8. INITIAL ADMIN USER (instructivo)
-- =============================================================================
-- Para crear el primer usuario administrador, ejecutar en el SQL Editor:
--
-- 1. Crear el usuario en Auth (desde la UI de Supabase o API)
-- 2. Ejecutar:
--
-- UPDATE profiles
-- SET role = 'admin'
-- WHERE email = 'admin@gogi.co';
--
-- O insertar directamente si el trigger de auth ya creó el perfil:
--
-- INSERT INTO profiles (id, email, full_name, role)
-- SELECT id, email, raw_user_meta_data->>'full_name', 'admin'
-- FROM auth.users
-- WHERE email = 'admin@gogi.co'
-- ON CONFLICT (id) DO UPDATE SET role = 'admin';

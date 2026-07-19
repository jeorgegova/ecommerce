-- ============================================================
-- DASHBOARD FUNCTIONS
-- Advanced analytics for the ecommerce admin dashboard.
-- Execute this after database_schema_Fase1.sql and
-- database_functions_fase2.sql
-- ============================================================

-- -------------------------------------------------------
-- 1. Enhanced KPIs
-- Returns comprehensive KPIs for the dashboard grid
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION get_dashboard_kpis(p_days INTEGER DEFAULT 30)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
  today_start TIMESTAMPTZ := date_trunc('day', now());
  yesterday_start TIMESTAMPTZ := date_trunc('day', now() - interval '1 day');
  month_start TIMESTAMPTZ := date_trunc('month', now());
  last_month_start TIMESTAMPTZ := date_trunc('month', now() - interval '1 month');
  last_month_end TIMESTAMPTZ := date_trunc('month', now());
BEGIN
  SELECT jsonb_build_object(
    'ventas_hoy', jsonb_build_object(
      'value', COALESCE((SELECT SUM(total) FROM orders WHERE status NOT IN ('cancelled') AND created_at >= today_start), 0),
      'previous', COALESCE((SELECT SUM(total) FROM orders WHERE status NOT IN ('cancelled') AND created_at >= yesterday_start AND created_at < today_start), 0),
      'label', 'Ventas hoy'
    ),
    'ventas_mes', jsonb_build_object(
      'value', COALESCE((SELECT SUM(total) FROM orders WHERE status NOT IN ('cancelled') AND created_at >= month_start), 0),
      'previous', COALESCE((SELECT SUM(total) FROM orders WHERE status NOT IN ('cancelled') AND created_at >= last_month_start AND created_at < last_month_end), 0),
      'label', 'Ventas este mes'
    ),
    'pedidos_nuevos', jsonb_build_object(
      'value', COALESCE((SELECT COUNT(*) FROM orders WHERE created_at >= today_start), 0),
      'previous', COALESCE((SELECT COUNT(*) FROM orders WHERE created_at >= yesterday_start AND created_at < today_start), 0),
      'label', 'Pedidos nuevos'
    ),
    'pedidos_pendientes', jsonb_build_object(
      'value', COALESCE((SELECT COUNT(*) FROM orders WHERE status = 'pending'), 0),
      'previous', 0,
      'label', 'Pedidos pendientes'
    ),
    'clientes_nuevos', jsonb_build_object(
      'value', COALESCE((SELECT COUNT(*) FROM profiles WHERE created_at >= month_start), 0),
      'previous', COALESCE((SELECT COUNT(*) FROM profiles WHERE created_at >= last_month_start AND created_at < last_month_end), 0),
      'label', 'Clientes nuevos'
    ),
    'productos_vendidos', jsonb_build_object(
      'value', COALESCE((SELECT SUM(oi.quantity) FROM order_items oi JOIN orders o ON o.id = oi.order_id WHERE o.status NOT IN ('cancelled') AND o.created_at >= month_start), 0),
      'previous', COALESCE((SELECT SUM(oi.quantity) FROM order_items oi JOIN orders o ON o.id = oi.order_id WHERE o.status NOT IN ('cancelled') AND o.created_at >= last_month_start AND o.created_at < last_month_end), 0),
      'label', 'Productos vendidos'
    ),
    'ingresos', jsonb_build_object(
      'value', COALESCE((SELECT SUM(total) FROM orders WHERE status NOT IN ('cancelled') AND created_at >= month_start), 0),
      'previous', COALESCE((SELECT SUM(total) FROM orders WHERE status NOT IN ('cancelled') AND created_at >= last_month_start AND created_at < last_month_end), 0),
      'label', 'Ingresos'
    ),
    'ganancias', jsonb_build_object(
      'value', COALESCE((SELECT SUM(oi.quantity * (oi.unit_price - p.cost_price)) FROM order_items oi JOIN orders o ON o.id = oi.order_id JOIN products p ON p.id = oi.product_id WHERE o.status NOT IN ('cancelled') AND o.created_at >= month_start), 0),
      'previous', COALESCE((SELECT SUM(oi.quantity * (oi.unit_price - p.cost_price)) FROM order_items oi JOIN orders o ON o.id = oi.order_id JOIN products p ON p.id = oi.product_id WHERE o.status NOT IN ('cancelled') AND o.created_at >= last_month_start AND o.created_at < last_month_end), 0),
      'label', 'Ganancias'
    )
  ) INTO result;
  RETURN result;
END;
$$;

-- -------------------------------------------------------
-- 2. Chart data (sales over time)
-- Supports different periods: 7d, 30d, 90d, 180d, 365d
-- Returns daily aggregates for sales, orders, revenue, profit
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION get_dashboard_chart_data(p_period TEXT DEFAULT '30d')
RETURNS TABLE (
  date DATE,
  total_sales NUMERIC(12,2),
  order_count BIGINT,
  total_revenue NUMERIC(12,2),
  total_profit NUMERIC(12,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  days INTEGER;
  since_date DATE;
BEGIN
  days := CASE p_period
    WHEN '7d' THEN 7
    WHEN '30d' THEN 30
    WHEN '90d' THEN 90
    WHEN '180d' THEN 180
    WHEN '365d' OR '1y' THEN 365
    ELSE 30
  END;
  since_date := date_trunc('day', now())::DATE - (days - 1);

  RETURN QUERY
  SELECT
    d::DATE AS date,
    COALESCE(SUM(o.total) FILTER (WHERE o.status NOT IN ('cancelled')), 0) AS total_sales,
    COUNT(o.id) FILTER (WHERE o.id IS NOT NULL) AS order_count,
    COALESCE(SUM(o.total) FILTER (WHERE o.status NOT IN ('cancelled') AND o.total > 0), 0) AS total_revenue,
    COALESCE(SUM(oi.quantity * (oi.unit_price - p.cost_price)) FILTER (WHERE o.status NOT IN ('cancelled')), 0) AS total_profit
  FROM generate_series(since_date, date_trunc('day', now())::DATE, '1 day'::interval) d
  LEFT JOIN orders o ON date_trunc('day', o.created_at)::DATE = d::DATE
  LEFT JOIN order_items oi ON oi.order_id = o.id
  LEFT JOIN products p ON p.id = oi.product_id
  GROUP BY d::DATE
  ORDER BY d::DATE;
END;
$$;

-- -------------------------------------------------------
-- 3. Quick summary (order counts by status, payment summary)
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION get_dashboard_quick_summary()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'pedidos_pendientes', (SELECT COUNT(*) FROM orders WHERE status = 'pending'),
    'pedidos_preparacion', (SELECT COUNT(*) FROM orders WHERE status IN ('confirmed', 'processing')),
    'pedidos_enviados', (SELECT COUNT(*) FROM orders WHERE status = 'shipped'),
    'pedidos_entregados', (SELECT COUNT(*) FROM orders WHERE status = 'delivered'),
    'pedidos_cancelados', (SELECT COUNT(*) FROM orders WHERE status = 'cancelled'),
    'pagos_pendientes', (SELECT COUNT(*) FROM orders WHERE paid_at IS NULL AND status NOT IN ('cancelled')),
    'pagos_completados', (SELECT COUNT(*) FROM orders WHERE paid_at IS NOT NULL AND status NOT IN ('cancelled')),
    'devoluciones', (SELECT COUNT(*) FROM order_items oi WHERE oi.quantity < 0)
  ) INTO result;
  RETURN result;
END;
$$;

-- -------------------------------------------------------
-- 4. Top products (enhanced version with category + stock + image)
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION get_dashboard_top_products(
  p_days INTEGER DEFAULT 30,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  product_id UUID,
  product_name TEXT,
  category_name TEXT,
  total_sold BIGINT,
  stock INTEGER,
  total_revenue NUMERIC(12,2),
  main_image TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id AS product_id,
    p.name AS product_name,
    c.name AS category_name,
    COALESCE(SUM(oi.quantity), 0) AS total_sold,
    p.stock,
    COALESCE(SUM(oi.quantity * oi.unit_price), 0) AS total_revenue,
    (SELECT url FROM product_images WHERE product_id = p.id AND is_main = true LIMIT 1) AS main_image
  FROM products p
  LEFT JOIN categories c ON c.id = p.category_id
  LEFT JOIN order_items oi ON oi.product_id = p.id
  LEFT JOIN orders o ON o.id = oi.order_id
    AND o.created_at >= date_trunc('day', now()) - (p_days || ' days')::interval
    AND o.status NOT IN ('cancelled')
  WHERE p.status = 'active'
  GROUP BY p.id, p.name, c.name, p.stock
  ORDER BY total_sold DESC
  LIMIT p_limit;
END;
$$;

-- -------------------------------------------------------
-- 5. Low stock products with severity levels
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION get_dashboard_low_stock()
RETURNS TABLE (
  product_id UUID,
  product_name TEXT,
  sku TEXT,
  stock INTEGER,
  low_stock_threshold INTEGER,
  status TEXT,
  severity TEXT,
  main_image TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id AS product_id,
    p.name AS product_name,
    p.sku,
    p.stock,
    p.low_stock_threshold,
    p.status,
    CASE
      WHEN p.stock = 0 THEN 'critico'
      WHEN p.stock <= p.low_stock_threshold THEN 'bajo'
      ELSE 'normal'
    END AS severity,
    (SELECT url FROM product_images WHERE product_id = p.id AND is_main = true LIMIT 1) AS main_image
  FROM products p
  WHERE p.status = 'active'
    AND p.stock <= p.low_stock_threshold
    AND p.has_variants = false
  ORDER BY p.stock ASC;
END;
$$;

-- -------------------------------------------------------
-- 6. Recent orders for dashboard
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION get_dashboard_recent_orders(p_limit INTEGER DEFAULT 8)
RETURNS TABLE (
  order_id UUID,
  order_number TEXT,
  customer_name TEXT,
  customer_email TEXT,
  total NUMERIC(12,2),
  status TEXT,
  status_name TEXT,
  status_color TEXT,
  created_at TIMESTAMPTZ,
  item_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    o.id AS order_id,
    o.order_number,
    pr.full_name AS customer_name,
    pr.email AS customer_email,
    o.total,
    o.status,
    os.name AS status_name,
    os.color AS status_color,
    o.created_at,
    (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) AS item_count
  FROM orders o
  LEFT JOIN profiles pr ON pr.id = o.user_id
  LEFT JOIN order_statuses os ON os.code = o.status
  ORDER BY o.created_at DESC
  LIMIT p_limit;
END;
$$;

-- -------------------------------------------------------
-- 7. Top customers by total spent
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION get_dashboard_top_customers(p_limit INTEGER DEFAULT 5)
RETURNS TABLE (
  user_id UUID,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  total_orders BIGINT,
  total_spent NUMERIC(12,2),
  last_order_date TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pr.id AS user_id,
    pr.full_name,
    pr.email,
    pr.avatar_url,
    COUNT(o.id) AS total_orders,
    COALESCE(SUM(o.total), 0) AS total_spent,
    MAX(o.created_at) AS last_order_date
  FROM profiles pr
  JOIN orders o ON o.user_id = pr.id
  WHERE o.status NOT IN ('cancelled')
  GROUP BY pr.id, pr.full_name, pr.email, pr.avatar_url
  ORDER BY total_spent DESC
  LIMIT p_limit;
END;
$$;

-- -------------------------------------------------------
-- 8. Recent activity timeline
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION get_dashboard_recent_activity(p_limit INTEGER DEFAULT 15)
RETURNS TABLE (
  activity_id UUID,
  activity_type TEXT,
  description TEXT,
  entity_type TEXT,
  entity_id TEXT,
  created_at TIMESTAMPTZ,
  icon TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM (
    -- Recent orders
    SELECT
      o.id AS activity_id,
      'order_created' AS activity_type,
      format('Pedido %s creado por %s', o.order_number, pr.full_name) AS description,
      'order' AS entity_type,
      o.id::TEXT AS entity_id,
      o.created_at,
      'shopping-bag' AS icon
    FROM orders o
    LEFT JOIN profiles pr ON pr.id = o.user_id
    WHERE o.created_at >= now() - interval '7 days'

    UNION ALL

    -- Low stock alerts
    SELECT
      p.id AS activity_id,
      'low_stock' AS activity_type,
      format('Stock bajo: %s (%d unidades)', p.name, p.stock) AS description,
      'product' AS entity_type,
      p.id::TEXT AS entity_id,
      p.updated_at,
      'alert-triangle' AS icon
    FROM products p
    WHERE p.status = 'active'
      AND p.stock > 0
      AND p.stock <= p.low_stock_threshold
      AND p.has_variants = false

    UNION ALL

    -- New registrations
    SELECT
      pr.id AS activity_id,
      'new_user' AS activity_type,
      format('Nuevo cliente registrado: %s', pr.full_name) AS description,
      'user' AS entity_type,
      pr.id::TEXT AS entity_id,
      pr.created_at,
      'user-plus' AS icon
    FROM profiles pr
    WHERE pr.created_at >= now() - interval '7 days'
      AND pr.role = 'buyer'

    UNION ALL

    -- Out of stock alerts
    SELECT
      p.id AS activity_id,
      'out_of_stock' AS activity_type,
      format('Producto agotado: %s', p.name) AS description,
      'product' AS entity_type,
      p.id::TEXT AS entity_id,
      p.updated_at,
      'package-x' AS icon
    FROM products p
    WHERE p.status = 'active'
      AND p.stock = 0
      AND p.has_variants = false
  ) sub
  ORDER BY created_at DESC
  LIMIT p_limit;
END;
$$;

-- -------------------------------------------------------
-- 9. Smart notifications
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION get_dashboard_notifications()
RETURNS TABLE (
  notification_id TEXT,
  notification_type TEXT,
  message TEXT,
  severity TEXT,
  action_url TEXT,
  action_label TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  -- Pending orders count
  SELECT
    'pending_orders' AS notification_id,
    'warning' AS notification_type,
    format('Hay %s pedidos pendientes por revisar.', COUNT(*)::TEXT) AS message,
    'warning' AS severity,
    '/admin/orders?status=pending'::TEXT AS action_url,
    'Ver pedidos' AS action_label
  FROM orders WHERE status = 'pending'
  HAVING COUNT(*) > 0

  UNION ALL

  -- Low stock products count
  SELECT
    'low_stock' AS notification_id,
    'alert' AS notification_type,
    format('%s productos tienen stock crítico o bajo.', COUNT(*)::TEXT) AS message,
    'critical' AS severity,
    '/admin/inventory'::TEXT AS action_url,
    'Revisar inventario' AS action_label
  FROM products
  WHERE status = 'active'
    AND stock <= low_stock_threshold
    AND has_variants = false
  HAVING COUNT(*) > 0

  UNION ALL

  -- New customers today
  SELECT
    'new_customers' AS notification_id,
    'info' AS notification_type,
    format('Hoy se registraron %s nuevos clientes.', COUNT(*)::TEXT) AS message,
    'info' AS severity,
    '/admin/customers'::TEXT AS action_url,
    'Ver clientes' AS action_label
  FROM profiles
  WHERE created_at >= date_trunc('day', now())
    AND role = 'buyer'
  HAVING COUNT(*) > 0

  UNION ALL

  -- Unpaid orders
  SELECT
    'pending_payments' AS notification_id,
    'warning' AS notification_type,
    format('Hay %s pedidos con pago pendiente.', COUNT(*)::TEXT) AS message,
    'warning' AS severity,
    '/admin/orders?status=pending'::TEXT AS action_url,
    'Ver pedidos' AS action_label
  FROM orders
  WHERE paid_at IS NULL
    AND status NOT IN ('cancelled')
  HAVING COUNT(*) > 0

  UNION ALL

  -- Products without images
  SELECT
    'no_images' AS notification_id,
    'info' AS notification_type,
    format('%s productos activos no tienen imagen principal.', COUNT(*)::TEXT) AS message,
    'warning' AS severity,
    '/admin/products'::TEXT AS action_url,
    'Gestionar productos' AS action_label
  FROM products p
  WHERE p.status = 'active'
    AND NOT EXISTS (SELECT 1 FROM product_images WHERE product_id = p.id AND is_main = true)
  HAVING COUNT(*) > 0

  UNION ALL

  -- Products without stock
  SELECT
    'out_of_stock' AS notification_id,
    'alert' AS notification_type,
    format('%s productos activos están agotados.', COUNT(*)::TEXT) AS message,
    'critical' AS severity,
    '/admin/inventory'::TEXT AS action_url,
    'Revisar inventario' AS action_label
  FROM products
  WHERE status = 'active'
    AND stock = 0
    AND has_variants = false
  HAVING COUNT(*) > 0

  UNION ALL

  -- Shipped orders (awaiting delivery)
  SELECT
    'shipped_orders' AS notification_id,
    'info' AS notification_type,
    format('%s pedidos están en tránsito.', COUNT(*)::TEXT) AS message,
    'info' AS severity,
    '/admin/orders?status=shipped'::TEXT AS action_url,
    'Ver envíos' AS action_label
  FROM orders
  WHERE status = 'shipped'
  HAVING COUNT(*) > 0;
END;
$$;

-- -------------------------------------------------------
-- 10. Business metrics
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION get_dashboard_business_metrics()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
  total_orders BIGINT;
  total_revenue NUMERIC(12,2);
  total_customers BIGINT;
  active_products BIGINT;
  out_of_stock_count BIGINT;
  products_without_sales BIGINT;
  recurring_customers BIGINT;
  days_range INTEGER := 30;
BEGIN
  SELECT
    COUNT(*) FILTER (WHERE status NOT IN ('cancelled')),
    COALESCE(SUM(total) FILTER (WHERE status NOT IN ('cancelled')), 0),
    COUNT(DISTINCT user_id) FILTER (WHERE status NOT IN ('cancelled'))
  INTO total_orders, total_revenue, total_customers
  FROM orders
  WHERE created_at >= date_trunc('day', now()) - (days_range || ' days')::interval;

  SELECT COUNT(*) INTO active_products
  FROM products WHERE status = 'active';

  SELECT COUNT(*) INTO out_of_stock_count
  FROM products WHERE status = 'active' AND stock = 0 AND has_variants = false;

  SELECT COUNT(*) INTO products_without_sales
  FROM products p
  WHERE p.status = 'active'
    AND NOT EXISTS (
      SELECT 1 FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE oi.product_id = p.id AND o.status NOT IN ('cancelled')
    );

  SELECT COUNT(*) INTO recurring_customers
  FROM (
    SELECT user_id
    FROM orders
    WHERE status NOT IN ('cancelled')
      AND created_at >= date_trunc('day', now()) - (days_range || ' days')::interval
    GROUP BY user_id
    HAVING COUNT(*) > 1
  ) sub;

  SELECT jsonb_build_object(
    'ticket_promedio', CASE WHEN total_orders > 0 THEN total_revenue / total_orders ELSE 0 END,
    'conversion', 0,
    'productos_activos', active_products,
    'productos_agotados', out_of_stock_count,
    'ventas_promedio_dia', CASE WHEN days_range > 0 THEN total_revenue / days_range ELSE 0 END,
    'clientes_recurrentes', recurring_customers,
    'valor_promedio_pedido', CASE WHEN total_orders > 0 THEN total_revenue / total_orders ELSE 0 END,
    'productos_sin_ventas', products_without_sales
  ) INTO result;
  RETURN result;
END;
$$;

-- -------------------------------------------------------
-- 11. Get dashboard KPI sparkline data
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION get_dashboard_kpi_sparklines(p_days INTEGER DEFAULT 30)
RETURNS TABLE (
  metric TEXT,
  data_points NUMERIC[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    'ventas' AS metric,
    ARRAY(
      SELECT COALESCE(SUM(o.total), 0)
      FROM generate_series(0, p_days - 1) day_offset
      LEFT JOIN orders o ON date_trunc('day', o.created_at)::DATE = date_trunc('day', now())::DATE - day_offset
        AND o.status NOT IN ('cancelled')
      GROUP BY day_offset
      ORDER BY day_offset DESC
    ) AS data_points
  UNION ALL
  SELECT
    'pedidos' AS metric,
    ARRAY(
      SELECT COUNT(o.id)
      FROM generate_series(0, p_days - 1) day_offset
      LEFT JOIN orders o ON date_trunc('day', o.created_at)::DATE = date_trunc('day', now())::DATE - day_offset
      GROUP BY day_offset
      ORDER BY day_offset DESC
    ) AS data_points;
END;
$$;

-- Migración: Agregar columnas de programación de promociones a products
ALTER TABLE products ADD COLUMN IF NOT EXISTS promotion_starts_at TIMESTAMPTZ;
ALTER TABLE products ADD COLUMN IF NOT EXISTS promotion_ends_at TIMESTAMPTZ;

-- Vista actualizada: current_price debe considerar las fechas programadas
DROP VIEW IF EXISTS product_listing;
CREATE VIEW product_listing AS
SELECT
  p.id, p.category_id, c.name AS category_name, c.slug AS category_slug,
  p.name, p.slug, p.sku, p.short_description,
  p.base_price, p.sale_price,
  COALESCE(p.sale_price, p.base_price) AS current_price_raw,
  CASE WHEN p.sale_price IS NOT NULL
       AND (p.promotion_active = true
            OR (p.promotion_starts_at IS NOT NULL AND p.promotion_starts_at <= now()
                AND (p.promotion_ends_at IS NULL OR p.promotion_ends_at >= now())))
       THEN p.sale_price ELSE p.base_price END AS current_price,
  p.stock, p.has_variants, p.status, p.is_featured, p.promotion_active,
  p.sales_count, p.views_count, p.avg_rating, p.reviews_count,
  p.published_at, p.created_at,
  (SELECT url FROM product_images WHERE product_id = p.id AND is_main = true LIMIT 1) AS main_image
FROM products p
LEFT JOIN categories c ON c.id = p.category_id
WHERE p.status = 'active';

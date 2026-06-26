-- =============================================================================
-- FULL-TEXT SEARCH
-- Ecommerce Platform — PostgreSQL + Supabase
-- =============================================================================
-- Ejecutar DESPUÉS de database_schema.sql.
-- =============================================================================

-- =============================================================================
-- 1. EXTENSION: pg_trgm
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- =============================================================================
-- 2. FULL-TEXT SEARCH INDEXES
-- =============================================================================

-- GIN index para full-text search sobre search_vector
CREATE INDEX IF NOT EXISTS idx_products_search_vector
  ON products
  USING GIN (search_vector);

-- GIN indexes con pg_trgm para autocomplete y búsqueda aproximada
CREATE INDEX IF NOT EXISTS idx_products_name_trgm
  ON products
  USING GIN (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_products_sku_trgm
  ON products
  USING GIN (sku gin_trgm_ops);

-- Índice trgm para nombres de categorías
CREATE INDEX IF NOT EXISTS idx_categories_name_trgm
  ON categories
  USING GIN (name gin_trgm_ops);

-- =============================================================================
-- 3. SEARCH VECTOR TRIGGER FUNCTION
-- =============================================================================

CREATE OR REPLACE FUNCTION products_search_vector_update()
RETURNS trigger AS $$
DECLARE
  category_name TEXT;
BEGIN
  -- Obtener nombre de la categoría para incluirlo en la búsqueda
  SELECT c.name INTO category_name
  FROM categories c
  WHERE c.id = NEW.category_id;

  NEW.search_vector :=
    setweight(to_tsvector('spanish', coalesce(NEW.name, '')), 'A') ||
    setweight(to_tsvector('spanish', coalesce(NEW.sku, '')), 'B') ||
    setweight(to_tsvector('spanish', coalesce(NEW.short_description, '')), 'C') ||
    setweight(to_tsvector('spanish', coalesce(category_name, '')), 'C');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para mantener search_vector actualizado
CREATE TRIGGER trg_products_search_vector
  BEFORE INSERT OR UPDATE OF name, short_description, sku, category_id
  ON products
  FOR EACH ROW
  EXECUTE FUNCTION products_search_vector_update();

-- =============================================================================
-- 4. SEARCH FUNCTIONS
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 4.1 search_products
-- Busca productos con full-text search, filtros y ordenamiento.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION search_products(
  p_query        TEXT DEFAULT '',
  p_category_id  UUID DEFAULT NULL,
  p_price_min    NUMERIC(12,2) DEFAULT NULL,
  p_price_max    NUMERIC(12,2) DEFAULT NULL,
  p_in_stock     BOOLEAN DEFAULT NULL,
  p_on_sale      BOOLEAN DEFAULT NULL,
  p_attributes   JSONB DEFAULT '{}',
  p_sort_by      TEXT DEFAULT 'relevance',
  p_page         INTEGER DEFAULT 1,
  p_page_size    INTEGER DEFAULT 20
)
RETURNS TABLE (
  id              UUID,
  name            TEXT,
  slug            TEXT,
  sku             TEXT,
  short_description TEXT,
  base_price      NUMERIC(12,2),
  sale_price      NUMERIC(12,2),
  current_price   NUMERIC(12,2),
  stock           INTEGER,
  has_variants    BOOLEAN,
  promotion_active BOOLEAN,
  main_image      TEXT,
  avg_rating      NUMERIC(3,2),
  reviews_count   INTEGER,
  sales_count     INTEGER,
  total_count     BIGINT
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_offset        INTEGER;
  v_tsquery       TSQUERY;
  v_has_text      BOOLEAN;
  v_total         BIGINT;
  v_text_filter   TEXT;
  v_attr_filter   TEXT;
BEGIN
  v_offset    := (p_page - 1) * p_page_size;
  v_has_text  := p_query IS NOT NULL AND p_query != '';

  -- Convertir texto a tsquery si hay búsqueda
  IF v_has_text THEN
    v_tsquery := plainto_tsquery('spanish', p_query);
  END IF;

  -- Calcular total de resultados (sin paginación)
  -- Usa full-text search + ILIKE fallback (search_vector puede ser NULL en productos antiguos)
  SELECT count(*) INTO v_total
  FROM products p
  WHERE p.status = 'active'
    AND (p_category_id IS NULL OR p.category_id = p_category_id)
    AND (p_price_min IS NULL OR COALESCE(
      CASE WHEN p.promotion_active THEN p.sale_price ELSE NULL END,
      p.base_price
    ) >= p_price_min)
    AND (p_price_max IS NULL OR COALESCE(
      CASE WHEN p.promotion_active THEN p.sale_price ELSE NULL END,
      p.base_price
    ) <= p_price_max)
    AND (p_in_stock IS NULL OR (p_in_stock = true AND p.stock > 0) OR (p_in_stock = false AND p.stock = 0))
    AND (p_on_sale IS NULL OR (p_on_sale = true AND p.sale_price IS NOT NULL AND p.promotion_active = true))
    AND (p_attributes IS NULL OR p_attributes = '{}'::jsonb OR p.id IN (
      SELECT pav.product_id
      FROM product_attribute_values pav
      INNER JOIN attributes a ON a.id = pav.attribute_id
      WHERE (a.slug, pav.value) IN (SELECT key, value FROM jsonb_each_text(p_attributes))
      GROUP BY pav.product_id
      HAVING count(*) = (SELECT count(*) FROM jsonb_each_text(p_attributes))
    ))
    AND (NOT v_has_text
         OR p.search_vector @@ v_tsquery
         OR p.name ILIKE '%' || replace(p_query, '''', '''''') || '%'
         OR p.sku ILIKE '%' || replace(p_query, '''', '''''') || '%');

  -- Construir condicion de busqueda de texto para el query principal
  IF v_has_text THEN
    v_text_filter := format(
      'AND (p.search_vector @@ %L OR p.name ILIKE %L OR p.sku ILIKE %L)',
      v_tsquery,
      '%' || p_query || '%',
      '%' || p_query || '%'
    );
  ELSE
    v_text_filter := '';
  END IF;

  -- Construir filtro de atributos
  IF p_attributes IS NOT NULL AND p_attributes <> '{}'::jsonb THEN
    v_attr_filter := format(
      'AND p.id IN (SELECT pav.product_id FROM product_attribute_values pav INNER JOIN attributes a ON a.id = pav.attribute_id WHERE (a.slug, pav.value) IN (SELECT key, value FROM jsonb_each_text(%L)) GROUP BY pav.product_id HAVING count(*) = %s)',
      p_attributes,
      (SELECT count(*) FROM jsonb_each_text(p_attributes))::text
    );
  ELSE
    v_attr_filter := '';
  END IF;

  -- Retornar resultados paginados
  RETURN QUERY EXECUTE
    format(
      'SELECT
        p.id,
        p.name,
        p.slug,
        p.sku,
        p.short_description,
        p.base_price,
        p.sale_price,
        CASE WHEN p.promotion_active AND p.sale_price IS NOT NULL THEN p.sale_price ELSE p.base_price END AS current_price,
        p.stock,
        p.has_variants,
        p.promotion_active,
        (SELECT url FROM product_images WHERE product_id = p.id AND is_main = true LIMIT 1) AS main_image,
        p.avg_rating,
        p.reviews_count,
        p.sales_count,
        %s AS total_count
      FROM products p
      WHERE p.status = ''active''
        %s
        %s
        %s
        %s
        %s
        %s
        %s
      ORDER BY %s
      LIMIT %s OFFSET %s',
      v_total,
      CASE WHEN p_category_id IS NOT NULL THEN 'AND p.category_id = ' || quote_literal(p_category_id) ELSE '' END,
      CASE WHEN p_price_min IS NOT NULL THEN 'AND COALESCE(CASE WHEN p.promotion_active THEN p.sale_price ELSE NULL END, p.base_price) >= ' || p_price_min ELSE '' END,
      CASE WHEN p_price_max IS NOT NULL THEN 'AND COALESCE(CASE WHEN p.promotion_active THEN p.sale_price ELSE NULL END, p.base_price) <= ' || p_price_max ELSE '' END,
      CASE WHEN p_in_stock = true THEN 'AND p.stock > 0'
           WHEN p_in_stock = false THEN 'AND p.stock = 0' ELSE '' END,
      CASE WHEN p_on_sale = true THEN 'AND p.sale_price IS NOT NULL AND p.promotion_active = true' ELSE '' END,
      v_attr_filter,
      v_text_filter,
      CASE
        WHEN v_has_text THEN 'ts_rank(p.search_vector, ' || quote_literal(v_tsquery) || ') DESC, p.sales_count DESC'
        WHEN p_sort_by = 'price_asc'  THEN 'current_price ASC NULLS LAST'
        WHEN p_sort_by = 'price_desc' THEN 'current_price DESC NULLS LAST'
        WHEN p_sort_by = 'sales'      THEN 'p.sales_count DESC'
        WHEN p_sort_by = 'views'      THEN 'p.views_count DESC'
        WHEN p_sort_by = 'rating'     THEN 'p.avg_rating DESC NULLS LAST, p.reviews_count DESC'
        WHEN p_sort_by = 'newest'     THEN 'p.published_at DESC NULLS LAST'
        ELSE 'p.sales_count DESC, p.avg_rating DESC'
      END,
      p_page_size,
      v_offset
    );

END;
$$;

-- ---------------------------------------------------------------------------
-- 4.2 autocomplete_products
-- Retorna sugerencias para el autocomplete del buscador.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION autocomplete_products(
  p_query TEXT DEFAULT ''
)
RETURNS TABLE (
  suggestion_type TEXT,
  suggestion_text TEXT,
  slug TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  -- Productos
  (
  SELECT
    'product'::TEXT AS suggestion_type,
    p.name::TEXT AS suggestion_text,
    p.slug::TEXT AS slug
  FROM products p
  WHERE p.status = 'active'
    AND p.name ILIKE '%' || p_query || '%'
  LIMIT 5
  )

  UNION ALL

(
  -- Categorías
  SELECT
    'category'::TEXT,
    c.name::TEXT,
    c.slug::TEXT
  FROM categories c
  WHERE c.is_active = true
    AND c.name ILIKE '%' || p_query || '%'
  LIMIT 3
  )

  ORDER BY suggestion_type, suggestion_text
  LIMIT 8;
END;
$$;

-- ---------------------------------------------------------------------------
-- 4.3 get_product_filters
-- Retorna los filtros dinámicos disponibles para una búsqueda/categoría
-- con los conteos actualizados.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_product_filters(
  p_query       TEXT DEFAULT '',
  p_category_id UUID DEFAULT NULL,
  p_price_min   NUMERIC(12,2) DEFAULT NULL,
  p_price_max   NUMERIC(12,2) DEFAULT NULL,
  p_in_stock    BOOLEAN DEFAULT NULL,
  p_on_sale     BOOLEAN DEFAULT NULL,
  p_attributes  JSONB DEFAULT '{}'
)
RETURNS TABLE (
  attribute_id   UUID,
  attribute_name TEXT,
  attribute_slug TEXT,
  filter_type    TEXT,
  value          TEXT,
  value_slug     TEXT,
  product_count  BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH filtered_products AS (
    SELECT p.id
    FROM products p
    WHERE p.status = 'active'
      AND (p_category_id IS NULL OR p.category_id = p_category_id)
      AND (p_price_min IS NULL OR COALESCE(
        CASE WHEN p.promotion_active THEN p.sale_price ELSE NULL END,
        p.base_price
      ) >= p_price_min)
      AND (p_price_max IS NULL OR COALESCE(
        CASE WHEN p.promotion_active THEN p.sale_price ELSE NULL END,
        p.base_price
      ) <= p_price_max)
      AND (p_in_stock IS NULL OR (p_in_stock = true AND p.stock > 0) OR (p_in_stock = false AND p.stock = 0))
      AND (p_on_sale IS NULL OR (p_on_sale = true AND p.sale_price IS NOT NULL AND p.promotion_active = true))
      AND (p_attributes IS NULL OR p_attributes = '{}'::jsonb OR p.id IN (
        SELECT pav.product_id
        FROM product_attribute_values pav
        INNER JOIN attributes a ON a.id = pav.attribute_id
        WHERE (a.slug, pav.value) IN (SELECT key, value FROM jsonb_each_text(p_attributes))
        GROUP BY pav.product_id
        HAVING count(*) = (SELECT count(*) FROM jsonb_each_text(p_attributes))
      ))
      AND (
        p_query IS NULL OR p_query = ''
        OR p.search_vector @@ plainto_tsquery('spanish', p_query)
      )
  )
  SELECT
    a.id         AS attribute_id,
    a.name       AS attribute_name,
    a.slug       AS attribute_slug,
    a.type       AS filter_type,
    pav.value    AS value,
    LOWER(REGEXP_REPLACE(pav.value, '[^a-zA-Z0-9áéíóúüñ ]', '', 'g')) AS value_slug,
    count(DISTINCT fp.id) AS product_count
  FROM filtered_products fp
  INNER JOIN product_attribute_values pav ON pav.product_id = fp.id
  INNER JOIN attributes a ON a.id = pav.attribute_id
  INNER JOIN category_attributes ca ON ca.category_id = COALESCE(p_category_id, (SELECT category_id FROM products WHERE id = fp.id LIMIT 1))
    AND ca.attribute_id = a.id
  WHERE a.is_filterable = true
    AND ca.is_filterable = true
  GROUP BY a.id, a.name, a.slug, a.type, pav.value
  HAVING count(DISTINCT fp.id) > 0
  ORDER BY a.sort_order, a.name, value;
END;
$$;

-- ---------------------------------------------------------------------------
-- 4.4 reindex_search_vector
-- Función de mantenimiento: reconstruye todos los search_vectors.
-- Útil después de una importación masiva.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION reindex_search_vectors()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE products p SET
    search_vector =
      setweight(to_tsvector('spanish', coalesce(p.name, '')), 'A') ||
      setweight(to_tsvector('spanish', coalesce(p.sku, '')), 'B') ||
      setweight(to_tsvector('spanish', coalesce(p.short_description, '')), 'C') ||
      setweight(to_tsvector('spanish', coalesce((SELECT c.name FROM categories c WHERE c.id = p.category_id), '')), 'C')
  WHERE p.status = 'active';

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;


CREATE UNIQUE INDEX idx_view_history_user_product ON view_history(user_id, product_id);
CREATE UNIQUE INDEX idx_product_views_user_product ON product_views(product_id, user_id) WHERE user_id IS NOT NULL;
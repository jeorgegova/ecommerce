-- =============================================================================
-- DATABASE SCHEMA
-- Ecommerce Platform — PostgreSQL + Supabase
-- Versión final — Fase 1
-- =============================================================================
-- Ejecutar manualmente desde el SQL Editor de Supabase.
-- =============================================================================

-- =============================================================================
-- 1. TRIGGER FUNCTIONS (core)
-- =============================================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'buyer'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 2. TABLES
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 2.1 profiles (extiende auth.users)
-- ---------------------------------------------------------------------------
CREATE TABLE profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email           TEXT NOT NULL UNIQUE,
  full_name       TEXT NOT NULL,
  phone           TEXT,
  avatar_url      TEXT,
  role            TEXT NOT NULL DEFAULT 'buyer' CHECK (role IN ('buyer', 'admin')),
  is_active       BOOLEAN NOT NULL DEFAULT true,
  last_login_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ---------------------------------------------------------------------------
-- 2.2 addresses
-- ---------------------------------------------------------------------------
CREATE TABLE addresses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  full_name       TEXT NOT NULL,
  phone           TEXT,
  address_line_1  TEXT NOT NULL,
  address_line_2  TEXT,
  city            TEXT NOT NULL,
  state           TEXT NOT NULL,
  postal_code     TEXT NOT NULL,
  country         TEXT NOT NULL DEFAULT 'CO',
  is_default      BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_addresses_updated_at
  BEFORE UPDATE ON addresses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ---------------------------------------------------------------------------
-- 2.3 settings (configuración clave-valor)
-- ---------------------------------------------------------------------------
CREATE TABLE settings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key             TEXT NOT NULL UNIQUE,
  value           JSONB NOT NULL DEFAULT '{}',
  description     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ---------------------------------------------------------------------------
-- 2.4 order_statuses (catálogo configurable de estados de pedido)
-- ---------------------------------------------------------------------------
CREATE TABLE order_statuses (
  code            TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  description     TEXT,
  color           TEXT,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  is_active       BOOLEAN NOT NULL DEFAULT true
);

-- ---------------------------------------------------------------------------
-- 2.5 categories (jerarquía ilimitada vía parent_id)
-- ---------------------------------------------------------------------------
CREATE TABLE categories (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  slug            TEXT NOT NULL UNIQUE,
  description     TEXT,
  parent_id       UUID REFERENCES categories(id) ON DELETE SET NULL,
  level           INTEGER NOT NULL DEFAULT 0,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Mantiene level automáticamente al insertar o cambiar parent_id.
CREATE OR REPLACE FUNCTION categories_set_level()
RETURNS trigger AS $$
BEGIN
  IF NEW.parent_id IS NULL THEN
    NEW.level = 0;
  ELSE
    SELECT COALESCE(level + 1, 1) INTO NEW.level
    FROM categories WHERE id = NEW.parent_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_categories_set_level
  BEFORE INSERT OR UPDATE OF parent_id ON categories
  FOR EACH ROW
  EXECUTE FUNCTION categories_set_level();

-- ---------------------------------------------------------------------------
-- 2.6 attributes (catálogo de atributos dinámicos)
-- ---------------------------------------------------------------------------
CREATE TABLE attributes (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  TEXT NOT NULL,
  slug                  TEXT NOT NULL UNIQUE,
  type                  TEXT NOT NULL CHECK (type IN ('text', 'number', 'select', 'boolean')),
  is_filterable         BOOLEAN NOT NULL DEFAULT true,
  is_visible_on_product BOOLEAN NOT NULL DEFAULT true,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_attributes_updated_at
  BEFORE UPDATE ON attributes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ---------------------------------------------------------------------------
-- 2.7 attribute_values (valores predefinidos para atributos tipo 'select')
-- ---------------------------------------------------------------------------
CREATE TABLE attribute_values (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attribute_id    UUID NOT NULL REFERENCES attributes(id) ON DELETE CASCADE,
  value           TEXT NOT NULL,
  slug            TEXT NOT NULL,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (attribute_id, slug)
);

-- ---------------------------------------------------------------------------
-- 2.8 category_attributes (atributos asignados a categorías)
-- ---------------------------------------------------------------------------
CREATE TABLE category_attributes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id     UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  attribute_id    UUID NOT NULL REFERENCES attributes(id) ON DELETE CASCADE,
  is_required     BOOLEAN NOT NULL DEFAULT false,
  is_filterable   BOOLEAN NOT NULL DEFAULT true,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (category_id, attribute_id)
);

-- ---------------------------------------------------------------------------
-- 2.9 products
-- ---------------------------------------------------------------------------
CREATE TABLE products (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id       UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  name              TEXT NOT NULL,
  slug              TEXT NOT NULL UNIQUE,
  sku               TEXT NOT NULL UNIQUE,
  internal_code     TEXT,
  short_description TEXT,
  long_description  TEXT,
  technical_specs   TEXT,
  base_price        NUMERIC(12,2) NOT NULL CHECK (base_price >= 0),
  sale_price        NUMERIC(12,2) CHECK (sale_price >= 0 AND sale_price <= base_price),
  cost_price        NUMERIC(12,2) CHECK (cost_price >= 0),
  stock             INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  has_variants      BOOLEAN NOT NULL DEFAULT false,
  status            TEXT NOT NULL DEFAULT 'draft'
                      CHECK (status IN ('draft', 'active', 'inactive', 'discontinued')),
  is_featured       BOOLEAN NOT NULL DEFAULT false,
  published_at      TIMESTAMPTZ,
  search_vector     TSVECTOR,
  sales_count       INTEGER NOT NULL DEFAULT 0,
  views_count       INTEGER NOT NULL DEFAULT 0,
  avg_rating        NUMERIC(3,2) DEFAULT 0,
  reviews_count     INTEGER NOT NULL DEFAULT 0,
  weight            NUMERIC(10,2),
  width             NUMERIC(10,2),
  height            NUMERIC(10,2),
  length            NUMERIC(10,2),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- published_at se setea automáticamente al activar el producto.
CREATE OR REPLACE FUNCTION products_set_published_at()
RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'active' AND (OLD.status IS NULL OR OLD.status != 'active') THEN
    NEW.published_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_products_published_at
  BEFORE INSERT OR UPDATE OF status ON products
  FOR EACH ROW
  EXECUTE FUNCTION products_set_published_at();

-- ---------------------------------------------------------------------------
-- 2.10 product_images
-- ---------------------------------------------------------------------------
CREATE TABLE product_images (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id      UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url             TEXT NOT NULL,
  alt             TEXT,
  width           INTEGER,
  height          INTEGER,
  file_size       INTEGER,
  is_main         BOOLEAN NOT NULL DEFAULT false,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 2.11 product_variants
-- ---------------------------------------------------------------------------
CREATE TABLE product_variants (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id        UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku               TEXT NOT NULL,
  name              TEXT NOT NULL,
  price_adjustment  NUMERIC(12,2) NOT NULL DEFAULT 0,
  stock             INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  is_active         BOOLEAN NOT NULL DEFAULT true,
  sort_order        INTEGER NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (product_id, sku)
);

CREATE TRIGGER trg_product_variants_updated_at
  BEFORE UPDATE ON product_variants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ---------------------------------------------------------------------------
-- 2.12 product_attribute_values (atributos dinámicos por producto)
-- ---------------------------------------------------------------------------
CREATE TABLE product_attribute_values (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id          UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  attribute_id        UUID NOT NULL REFERENCES attributes(id) ON DELETE CASCADE,
  attribute_value_id  UUID REFERENCES attribute_values(id) ON DELETE SET NULL,
  value               TEXT NOT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (product_id, attribute_id)
);

-- ---------------------------------------------------------------------------
-- 2.13 variant_attribute_values (atributos dinámicos por variante)
-- ---------------------------------------------------------------------------
CREATE TABLE variant_attribute_values (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id          UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  attribute_id        UUID NOT NULL REFERENCES attributes(id) ON DELETE CASCADE,
  attribute_value_id  UUID REFERENCES attribute_values(id) ON DELETE SET NULL,
  value               TEXT NOT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (variant_id, attribute_id)
);

-- ---------------------------------------------------------------------------
-- 2.14 product_seo (metadata SEO independiente del producto)
-- ---------------------------------------------------------------------------
CREATE TABLE product_seo (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id        UUID NOT NULL UNIQUE REFERENCES products(id) ON DELETE CASCADE,
  meta_title        TEXT,
  meta_description  TEXT,
  canonical_url     TEXT,
  og_title          TEXT,
  og_description    TEXT,
  og_image          TEXT,
  schema_markup     JSONB,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_product_seo_updated_at
  BEFORE UPDATE ON product_seo
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ---------------------------------------------------------------------------
-- 2.15 product_files (PDFs, fichas técnicas, manuales)
-- ---------------------------------------------------------------------------
CREATE TABLE product_files (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id      UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  description     TEXT,
  url             TEXT NOT NULL,
  file_size       INTEGER,
  mime_type       TEXT,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 2.16 cart_items
-- ---------------------------------------------------------------------------
CREATE TABLE cart_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id      UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id      UUID REFERENCES product_variants(id) ON DELETE CASCADE,
  quantity        INTEGER NOT NULL CHECK (quantity > 0),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_cart_items_updated_at
  BEFORE UPDATE ON cart_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ---------------------------------------------------------------------------
-- 2.17 favorites
-- ---------------------------------------------------------------------------
CREATE TABLE favorites (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id      UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)
);

-- ---------------------------------------------------------------------------
-- 2.18 wishlists
-- ---------------------------------------------------------------------------
CREATE TABLE wishlists (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  slug            TEXT NOT NULL,
  description     TEXT,
  is_public       BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, slug)
);

CREATE TRIGGER trg_wishlists_updated_at
  BEFORE UPDATE ON wishlists
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ---------------------------------------------------------------------------
-- 2.19 wishlist_items
-- ---------------------------------------------------------------------------
CREATE TABLE wishlist_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wishlist_id     UUID NOT NULL REFERENCES wishlists(id) ON DELETE CASCADE,
  product_id      UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (wishlist_id, product_id)
);

-- ---------------------------------------------------------------------------
-- 2.20 view_history (historial por usuario, limitado a 100 registros)
-- ---------------------------------------------------------------------------
CREATE TABLE view_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id      UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  viewed_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 2.21 product_views (estadísticas reales de visualización, anónimas + auth)
-- ---------------------------------------------------------------------------
CREATE TABLE product_views (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id      UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES profiles(id) ON DELETE CASCADE,
  session_id      TEXT,
  ip_hash         TEXT,
  user_agent      TEXT,
  viewed_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 2.22 coupons (deshabilitados inicialmente, estructura lista)
-- ---------------------------------------------------------------------------
CREATE TABLE coupons (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code                TEXT NOT NULL UNIQUE,
  type                TEXT NOT NULL CHECK (type IN ('percentage', 'fixed')),
  value               NUMERIC(12,2) NOT NULL CHECK (value > 0),
  min_order_amount     NUMERIC(12,2) CHECK (min_order_amount >= 0),
  max_uses             INTEGER CHECK (max_uses > 0),
  max_uses_per_user    INTEGER CHECK (max_uses_per_user > 0),
  is_active           BOOLEAN NOT NULL DEFAULT false,
  starts_at           TIMESTAMPTZ,
  ends_at             TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_coupons_updated_at
  BEFORE UPDATE ON coupons
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ---------------------------------------------------------------------------
-- 2.23 coupon_usage
-- ---------------------------------------------------------------------------
CREATE TABLE coupon_usage (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id       UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  order_id        UUID NOT NULL,
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  used_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (coupon_id, order_id)
);

-- ---------------------------------------------------------------------------
-- 2.24 orders
-- ---------------------------------------------------------------------------
CREATE TABLE orders (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  order_number          TEXT NOT NULL UNIQUE,
  status                TEXT NOT NULL DEFAULT 'pending'
                          REFERENCES order_statuses(code),
  subtotal              NUMERIC(12,2) NOT NULL CHECK (subtotal >= 0),
  shipping_cost         NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (shipping_cost >= 0),
  discount              NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (discount >= 0),
  total                 NUMERIC(12,2) NOT NULL CHECK (total >= 0),
  notes                 TEXT,
  shipping_address_id   UUID REFERENCES addresses(id) ON DELETE SET NULL,
  shipping_address      JSONB,
  billing_address_id    UUID REFERENCES addresses(id) ON DELETE SET NULL,
  billing_address       JSONB,
  coupon_id             UUID REFERENCES coupons(id) ON DELETE SET NULL,
  paid_at               TIMESTAMPTZ,
  cancelled_at          TIMESTAMPTZ,
  cancellation_reason   TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (total = subtotal + shipping_cost - discount)
);

CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- FK diferido para coupon_usage.order_id
ALTER TABLE coupon_usage
  ADD CONSTRAINT fk_coupon_usage_order
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;

-- ---------------------------------------------------------------------------
-- 2.25 order_items (snapshot de producto al momento de la compra)
-- ---------------------------------------------------------------------------
CREATE TABLE order_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id      UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  variant_id      UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  product_name    TEXT NOT NULL,
  product_sku     TEXT NOT NULL,
  variant_name    TEXT,
  unit_price      NUMERIC(12,2) NOT NULL CHECK (unit_price >= 0),
  quantity        INTEGER NOT NULL CHECK (quantity > 0),
  subtotal        NUMERIC(12,2) NOT NULL CHECK (subtotal >= 0),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 2.26 shipments
-- ---------------------------------------------------------------------------
CREATE TABLE shipments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id          UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  carrier           TEXT,
  carrier_code      TEXT,
  tracking_number   TEXT,
  status            TEXT NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending', 'labeled', 'picked_up', 'in_transit',
                                       'out_for_delivery', 'delivered', 'failed')),
  estimated_delivery DATE,
  shipped_at        TIMESTAMPTZ,
  delivered_at      TIMESTAMPTZ,
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_shipments_updated_at
  BEFORE UPDATE ON shipments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ---------------------------------------------------------------------------
-- 2.27 inventory_movements (auditoría completa de inventario)
-- ---------------------------------------------------------------------------
CREATE TABLE inventory_movements (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id      UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  variant_id      UUID REFERENCES product_variants(id) ON DELETE RESTRICT,
  user_id         UUID REFERENCES profiles(id) ON DELETE SET NULL,
  movement_type   TEXT NOT NULL CHECK (movement_type IN ('sale', 'adjustment', 'return', 'import')),
  quantity        INTEGER NOT NULL CHECK (quantity != 0),
  stock_before    INTEGER NOT NULL CHECK (stock_before >= 0),
  stock_after     INTEGER NOT NULL CHECK (stock_after >= 0),
  reference_type  TEXT,
  reference_id    TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (stock_after = stock_before + quantity)
);

-- ---------------------------------------------------------------------------
-- 2.28 reviews
-- ---------------------------------------------------------------------------
CREATE TABLE reviews (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id        UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating            INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title             TEXT,
  comment           TEXT,
  is_approved       BOOLEAN NOT NULL DEFAULT false,
  verified_purchase BOOLEAN NOT NULL DEFAULT false,
  moderated_by      UUID REFERENCES profiles(id) ON DELETE SET NULL,
  moderated_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (product_id, user_id)
);

CREATE TRIGGER trg_reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ---------------------------------------------------------------------------
-- 2.29 questions
-- ---------------------------------------------------------------------------
CREATE TABLE questions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id      UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  question        TEXT NOT NULL,
  answer          TEXT,
  answered_by     UUID REFERENCES profiles(id) ON DELETE SET NULL,
  answered_at     TIMESTAMPTZ,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'answered', 'hidden')),
  is_public       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_questions_updated_at
  BEFORE UPDATE ON questions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ---------------------------------------------------------------------------
-- 2.30 notifications
-- ---------------------------------------------------------------------------
CREATE TABLE notifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type            TEXT NOT NULL
                    CHECK (type IN ('order_confirmed', 'order_shipped', 'order_delivered',
                                   'question_answered', 'review_reply', 'price_drop',
                                   'back_in_stock', 'admin_alert')),
  title           TEXT NOT NULL,
  body            TEXT,
  data            JSONB,
  is_read         BOOLEAN NOT NULL DEFAULT false,
  read_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 2.31 banners
-- ---------------------------------------------------------------------------
CREATE TABLE banners (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title             TEXT,
  subtitle          TEXT,
  image_url         TEXT NOT NULL,
  mobile_image_url  TEXT,
  link_url          TEXT,
  link_text         TEXT,
  is_active         BOOLEAN NOT NULL DEFAULT true,
  sort_order        INTEGER NOT NULL DEFAULT 0,
  starts_at         TIMESTAMPTZ,
  ends_at           TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_banners_updated_at
  BEFORE UPDATE ON banners
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ---------------------------------------------------------------------------
-- 2.32 search_logs (registro de búsquedas para analytics)
-- ---------------------------------------------------------------------------
CREATE TABLE search_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES profiles(id) ON DELETE SET NULL,
  query           TEXT NOT NULL,
  filters         JSONB,
  results_count   INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 2.33 imports (auditoría de importaciones CSV/Excel)
-- ---------------------------------------------------------------------------
CREATE TABLE imports (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  file_name       TEXT NOT NULL,
  file_type       TEXT NOT NULL CHECK (file_type IN ('csv', 'xlsx', 'xls')),
  total_rows      INTEGER NOT NULL DEFAULT 0,
  success_count   INTEGER NOT NULL DEFAULT 0,
  error_count     INTEGER NOT NULL DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_file_url  TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at    TIMESTAMPTZ
);

-- ---------------------------------------------------------------------------
-- 2.34 import_errors
-- ---------------------------------------------------------------------------
CREATE TABLE import_errors (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  import_id       UUID NOT NULL REFERENCES imports(id) ON DELETE CASCADE,
  row_number      INTEGER NOT NULL,
  column_name     TEXT,
  error_message   TEXT NOT NULL,
  raw_data        JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 2.35 email_logs (auditoría de correos vía Resend)
-- ---------------------------------------------------------------------------
CREATE TABLE email_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES profiles(id) ON DELETE SET NULL,
  to_email        TEXT NOT NULL,
  subject         TEXT NOT NULL,
  body_preview    TEXT,
  email_type      TEXT NOT NULL
                    CHECK (email_type IN ('order_confirmation', 'order_shipped', 'order_delivered',
                                         'password_reset', 'welcome', 'question_answered',
                                         'admin_notification', 'newsletter')),
  status          TEXT NOT NULL CHECK (status IN ('sent', 'failed', 'bounced')),
  error_message   TEXT,
  sent_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 2.36 audit_logs (eventos del sistema, ip_hash por privacidad)
-- ---------------------------------------------------------------------------
CREATE TABLE audit_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action          TEXT NOT NULL
                    CHECK (action IN ('create', 'update', 'delete', 'login', 'logout',
                                     'price_change', 'stock_change', 'order_status_change',
                                     'user_status_change', 'bulk_import', 'email_sent')),
  entity_type     TEXT NOT NULL,
  entity_id       TEXT,
  old_values      JSONB,
  new_values      JSONB,
  ip_hash         TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- 3. INDEXES
-- =============================================================================

-- 3.1 Profiles
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_is_active ON profiles(is_active);

-- 3.2 Addresses
CREATE INDEX idx_addresses_user_id ON addresses(user_id);
CREATE UNIQUE INDEX idx_addresses_default_one_per_user ON addresses(user_id) WHERE is_default = true;

-- 3.3 Settings
CREATE INDEX idx_settings_key ON settings(key);

-- 3.4 Categories
CREATE INDEX idx_categories_parent_id ON categories(parent_id);
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_sort_order ON categories(sort_order);
CREATE INDEX idx_categories_level ON categories(level);
CREATE INDEX idx_categories_active ON categories(is_active) WHERE is_active = true;

-- 3.5 Attributes
CREATE INDEX idx_attributes_slug ON attributes(slug);
CREATE INDEX idx_attributes_is_filterable ON attributes(is_filterable) WHERE is_filterable = true;

-- 3.6 Attribute Values
CREATE INDEX idx_attribute_values_attribute_id ON attribute_values(attribute_id);

-- 3.7 Category Attributes
CREATE INDEX idx_category_attributes_category_id ON category_attributes(category_id);
CREATE INDEX idx_category_attributes_attribute_id ON category_attributes(attribute_id);

-- 3.8 Products
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_is_featured ON products(is_featured) WHERE is_featured = true;
CREATE INDEX idx_products_sales_count ON products(sales_count DESC);
CREATE INDEX idx_products_views_count ON products(views_count DESC);
CREATE INDEX idx_products_avg_rating ON products(avg_rating DESC NULLS LAST);
CREATE INDEX idx_products_base_price_asc ON products(base_price ASC);
CREATE INDEX idx_products_base_price_desc ON products(base_price DESC);
CREATE INDEX idx_products_created_at ON products(created_at DESC);
CREATE INDEX idx_products_published_at ON products(published_at DESC NULLS LAST);
CREATE INDEX idx_products_active ON products(id, base_price, sale_price, stock, slug)
  WHERE status = 'active';

-- 3.9 Product Images
CREATE INDEX idx_product_images_product_id ON product_images(product_id);
CREATE INDEX idx_product_images_main ON product_images(product_id) WHERE is_main = true;

-- 3.10 Product Variants
CREATE INDEX idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX idx_product_variants_active ON product_variants(product_id) WHERE is_active = true;

-- 3.11 Product Attribute Values
CREATE INDEX idx_product_attribute_values_product_id ON product_attribute_values(product_id);
CREATE INDEX idx_product_attribute_values_attribute_id ON product_attribute_values(attribute_id);

-- 3.12 Variant Attribute Values
CREATE INDEX idx_variant_attribute_values_variant_id ON variant_attribute_values(variant_id);
CREATE INDEX idx_variant_attribute_values_attribute_id ON variant_attribute_values(attribute_id);

-- 3.13 Product SEO
CREATE INDEX idx_product_seo_product_id ON product_seo(product_id);

-- 3.14 Product Files
CREATE INDEX idx_product_files_product_id ON product_files(product_id);

-- 3.15 Cart Items
CREATE INDEX idx_cart_items_user_id ON cart_items(user_id);
CREATE UNIQUE INDEX idx_cart_items_no_variant ON cart_items(user_id, product_id) WHERE variant_id IS NULL;
CREATE UNIQUE INDEX idx_cart_items_with_variant ON cart_items(user_id, product_id, variant_id) WHERE variant_id IS NOT NULL;

-- 3.16 Favorites
CREATE INDEX idx_favorites_user_id ON favorites(user_id);
CREATE INDEX idx_favorites_product_id ON favorites(product_id);

-- 3.17 Wishlists
CREATE INDEX idx_wishlists_user_id ON wishlists(user_id);

-- 3.18 Wishlist Items
CREATE INDEX idx_wishlist_items_wishlist_id ON wishlist_items(wishlist_id);
CREATE INDEX idx_wishlist_items_product_id ON wishlist_items(product_id);

-- 3.19 View History
CREATE INDEX idx_view_history_user_id ON view_history(user_id);
CREATE INDEX idx_view_history_product_id ON view_history(product_id);
CREATE INDEX idx_view_history_user_viewed ON view_history(user_id, viewed_at DESC);

-- 3.20 Product Views (analytics)
CREATE INDEX idx_product_views_product_id ON product_views(product_id);
CREATE INDEX idx_product_views_viewed_at ON product_views(viewed_at DESC);
CREATE INDEX idx_product_views_date ON product_views(date_trunc('day', viewed_at));

-- 3.21 Coupons
CREATE INDEX idx_coupons_code ON coupons(code);
CREATE INDEX idx_coupons_active ON coupons(is_active) WHERE is_active = true;

-- 3.22 Coupon Usage
CREATE INDEX idx_coupon_usage_coupon_id ON coupon_usage(coupon_id);
CREATE INDEX idx_coupon_usage_order_id ON coupon_usage(order_id);
CREATE INDEX idx_coupon_usage_user_id ON coupon_usage(user_id);

-- 3.23 Orders
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_user_status ON orders(user_id, status);

-- 3.24 Order Items
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);

-- 3.25 Shipments
CREATE INDEX idx_shipments_order_id ON shipments(order_id);
CREATE INDEX idx_shipments_status ON shipments(status);
CREATE INDEX idx_shipments_tracking ON shipments(tracking_number) WHERE tracking_number IS NOT NULL;

-- 3.26 Inventory Movements
CREATE INDEX idx_inventory_movements_product_id ON inventory_movements(product_id);
CREATE INDEX idx_inventory_movements_variant_id ON inventory_movements(variant_id);
CREATE INDEX idx_inventory_movements_created_at ON inventory_movements(created_at DESC);
CREATE INDEX idx_inventory_movements_type ON inventory_movements(movement_type);

-- 3.27 Reviews
CREATE INDEX idx_reviews_product_id ON reviews(product_id);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
CREATE INDEX idx_reviews_approved ON reviews(product_id) WHERE is_approved = true;
CREATE INDEX idx_reviews_rating ON reviews(product_id, rating);

-- 3.28 Questions
CREATE INDEX idx_questions_product_id ON questions(product_id);
CREATE INDEX idx_questions_status ON questions(status);
CREATE INDEX idx_questions_public ON questions(product_id) WHERE is_public = true;

-- 3.29 Notifications
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id) WHERE is_read = false;
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- 3.30 Banners
CREATE INDEX idx_banners_active ON banners(is_active, sort_order) WHERE is_active = true;
CREATE INDEX idx_banners_dates ON banners(starts_at, ends_at) WHERE is_active = true;

-- 3.31 Search Logs
CREATE INDEX idx_search_logs_created_at ON search_logs(created_at DESC);
CREATE INDEX idx_search_logs_query ON search_logs(query);

-- 3.32 Imports
CREATE INDEX idx_imports_user_id ON imports(user_id);
CREATE INDEX idx_imports_status ON imports(status);

-- 3.33 Import Errors
CREATE INDEX idx_import_errors_import_id ON import_errors(import_id);

-- 3.34 Email Logs
CREATE INDEX idx_email_logs_user_id ON email_logs(user_id);
CREATE INDEX idx_email_logs_status ON email_logs(status);
CREATE INDEX idx_email_logs_sent_at ON email_logs(sent_at DESC);
CREATE INDEX idx_email_logs_type ON email_logs(email_type);

-- 3.35 Audit Logs
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- =============================================================================
-- 4. VIEWS
-- =============================================================================

-- 4.1 active_banners
CREATE VIEW active_banners AS
SELECT *
FROM banners
WHERE is_active = true
  AND (starts_at IS NULL OR starts_at <= now())
  AND (ends_at IS NULL OR ends_at >= now())
ORDER BY sort_order ASC, created_at DESC;

-- 4.2 product_listing
CREATE VIEW product_listing AS
SELECT
  p.id,
  p.category_id,
  c.name AS category_name,
  c.slug AS category_slug,
  p.name,
  p.slug,
  p.sku,
  p.short_description,
  p.base_price,
  p.sale_price,
  COALESCE(p.sale_price, p.base_price) AS current_price,
  p.stock,
  p.has_variants,
  p.status,
  p.is_featured,
  p.sales_count,
  p.views_count,
  p.avg_rating,
  p.reviews_count,
  p.published_at,
  p.created_at,
  (SELECT url FROM product_images WHERE product_id = p.id AND is_main = true LIMIT 1) AS main_image
FROM products p
LEFT JOIN categories c ON c.id = p.category_id
WHERE p.status = 'active';

-- 4.3 category_tree (árbol recursivo)
CREATE VIEW category_tree AS
WITH RECURSIVE tree AS (
  SELECT
    id,
    parent_id,
    name,
    slug,
    level,
    sort_order,
    0 AS depth,
    ARRAY[name] AS path,
    ARRAY[slug] AS slug_path
  FROM categories
  WHERE parent_id IS NULL AND is_active = true

  UNION ALL

  SELECT
    c.id,
    c.parent_id,
    c.name,
    c.slug,
    c.level,
    c.sort_order,
    t.depth + 1,
    t.path || c.name,
    t.slug_path || c.slug
  FROM categories c
  INNER JOIN tree t ON t.id = c.parent_id
  WHERE c.is_active = true
)
SELECT * FROM tree
ORDER BY path;

-- 4.4 low_stock_products
CREATE VIEW low_stock_products AS
SELECT
  p.id,
  p.name,
  p.sku,
  p.stock,
  p.status,
  c.name AS category_name
FROM products p
LEFT JOIN categories c ON c.id = p.category_id
WHERE p.status = 'active'
  AND p.stock > 0
  AND p.stock <= 5
  AND p.has_variants = false
ORDER BY p.stock ASC;

-- =============================================================================
-- 5. TRIGGER: auto_create_profile
-- =============================================================================

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

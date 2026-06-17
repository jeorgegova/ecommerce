-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- Ecommerce Platform — PostgreSQL + Supabase
-- =============================================================================
-- Ejecutar DESPUÉS de database_schema.sql.
-- =============================================================================

-- =============================================================================
-- 1. HELPER FUNCTIONS
-- =============================================================================

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND role = 'admin'
      AND is_active = true
  );
END;
$$;

CREATE OR REPLACE FUNCTION is_owner(user_id UUID)
RETURNS boolean
LANGUAGE plpgsql STABLE
AS $$
BEGIN
  RETURN auth.uid() = user_id;
END;
$$;

-- =============================================================================
-- 2. ENABLE RLS
-- =============================================================================

ALTER TABLE profiles               ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses              ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings               ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_statuses         ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories             ENABLE ROW LEVEL SECURITY;
ALTER TABLE attributes             ENABLE ROW LEVEL SECURITY;
ALTER TABLE attribute_values       ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_attributes    ENABLE ROW LEVEL SECURITY;
ALTER TABLE products               ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images         ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants       ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_attribute_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE variant_attribute_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_seo            ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_files          ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items             ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites              ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlists              ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist_items         ENABLE ROW LEVEL SECURITY;
ALTER TABLE view_history           ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_views          ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons                ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_usage           ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items            ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments              ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements    ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews                ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions              ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications          ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners                ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_logs            ENABLE ROW LEVEL SECURITY;
ALTER TABLE imports                ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_errors          ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs             ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs             ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 3. POLICIES
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 3.1 profiles
-- ---------------------------------------------------------------------------
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (is_owner(id));

CREATE POLICY "profiles_select_admin" ON profiles
  FOR SELECT USING (is_admin());

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (is_owner(id))
  WITH CHECK (is_owner(id) AND role = (SELECT role FROM profiles WHERE id = id));

CREATE POLICY "profiles_insert_admin" ON profiles
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "profiles_delete_admin" ON profiles
  FOR DELETE USING (is_admin());

-- ---------------------------------------------------------------------------
-- 3.2 addresses
-- ---------------------------------------------------------------------------
CREATE POLICY "addresses_select_own" ON addresses
  FOR SELECT USING (is_owner(user_id));

CREATE POLICY "addresses_select_admin" ON addresses
  FOR SELECT USING (is_admin());

CREATE POLICY "addresses_insert_own" ON addresses
  FOR INSERT WITH CHECK (is_owner(user_id));

CREATE POLICY "addresses_update_own" ON addresses
  FOR UPDATE USING (is_owner(user_id));

CREATE POLICY "addresses_delete_own" ON addresses
  FOR DELETE USING (is_owner(user_id));

CREATE POLICY "addresses_manage_admin" ON addresses
  FOR ALL USING (is_admin());

-- ---------------------------------------------------------------------------
-- 3.3 settings
-- ---------------------------------------------------------------------------
CREATE POLICY "settings_select_public" ON settings
  FOR SELECT USING (true);

CREATE POLICY "settings_manage_admin" ON settings
  FOR ALL USING (is_admin());

-- ---------------------------------------------------------------------------
-- 3.4 order_statuses
-- ---------------------------------------------------------------------------
CREATE POLICY "order_statuses_select_public" ON order_statuses
  FOR SELECT USING (true);

CREATE POLICY "order_statuses_manage_admin" ON order_statuses
  FOR ALL USING (is_admin());

-- ---------------------------------------------------------------------------
-- 3.5 categories
-- ---------------------------------------------------------------------------
CREATE POLICY "categories_select_active" ON categories
  FOR SELECT USING (is_active = true OR is_admin());

CREATE POLICY "categories_manage_admin" ON categories
  FOR ALL USING (is_admin());

-- ---------------------------------------------------------------------------
-- 3.6 attributes
-- ---------------------------------------------------------------------------
CREATE POLICY "attributes_select_public" ON attributes
  FOR SELECT USING (true);

CREATE POLICY "attributes_manage_admin" ON attributes
  FOR ALL USING (is_admin());

-- ---------------------------------------------------------------------------
-- 3.7 attribute_values
-- ---------------------------------------------------------------------------
CREATE POLICY "attribute_values_select_public" ON attribute_values
  FOR SELECT USING (true);

CREATE POLICY "attribute_values_manage_admin" ON attribute_values
  FOR ALL USING (is_admin());

-- ---------------------------------------------------------------------------
-- 3.8 category_attributes
-- ---------------------------------------------------------------------------
CREATE POLICY "category_attributes_select_public" ON category_attributes
  FOR SELECT USING (true);

CREATE POLICY "category_attributes_manage_admin" ON category_attributes
  FOR ALL USING (is_admin());

-- ---------------------------------------------------------------------------
-- 3.9 products
-- ---------------------------------------------------------------------------
CREATE POLICY "products_select_active" ON products
  FOR SELECT USING (status = 'active' OR is_admin());

CREATE POLICY "products_manage_admin" ON products
  FOR ALL USING (is_admin());

-- ---------------------------------------------------------------------------
-- 3.10 product_images
-- ---------------------------------------------------------------------------
CREATE POLICY "product_images_select_public" ON product_images
  FOR SELECT USING (true);

CREATE POLICY "product_images_manage_admin" ON product_images
  FOR ALL USING (is_admin());

-- ---------------------------------------------------------------------------
-- 3.11 product_variants
-- ---------------------------------------------------------------------------
CREATE POLICY "product_variants_select_public" ON product_variants
  FOR SELECT USING (true);

CREATE POLICY "product_variants_manage_admin" ON product_variants
  FOR ALL USING (is_admin());

-- ---------------------------------------------------------------------------
-- 3.12 product_attribute_values
-- ---------------------------------------------------------------------------
CREATE POLICY "product_attribute_values_select_public" ON product_attribute_values
  FOR SELECT USING (true);

CREATE POLICY "product_attribute_values_manage_admin" ON product_attribute_values
  FOR ALL USING (is_admin());

-- ---------------------------------------------------------------------------
-- 3.13 variant_attribute_values
-- ---------------------------------------------------------------------------
CREATE POLICY "variant_attribute_values_select_public" ON variant_attribute_values
  FOR SELECT USING (true);

CREATE POLICY "variant_attribute_values_manage_admin" ON variant_attribute_values
  FOR ALL USING (is_admin());

-- ---------------------------------------------------------------------------
-- 3.14 product_seo
-- ---------------------------------------------------------------------------
CREATE POLICY "product_seo_select_public" ON product_seo
  FOR SELECT USING (true);

CREATE POLICY "product_seo_manage_admin" ON product_seo
  FOR ALL USING (is_admin());

-- ---------------------------------------------------------------------------
-- 3.15 product_files
-- ---------------------------------------------------------------------------
CREATE POLICY "product_files_select_public" ON product_files
  FOR SELECT USING (true);

CREATE POLICY "product_files_manage_admin" ON product_files
  FOR ALL USING (is_admin());

-- ---------------------------------------------------------------------------
-- 3.16 cart_items
-- ---------------------------------------------------------------------------
CREATE POLICY "cart_items_select_own" ON cart_items
  FOR SELECT USING (is_owner(user_id));

CREATE POLICY "cart_items_select_admin" ON cart_items
  FOR SELECT USING (is_admin());

CREATE POLICY "cart_items_insert_own" ON cart_items
  FOR INSERT WITH CHECK (is_owner(user_id));

CREATE POLICY "cart_items_update_own" ON cart_items
  FOR UPDATE USING (is_owner(user_id));

CREATE POLICY "cart_items_delete_own" ON cart_items
  FOR DELETE USING (is_owner(user_id));

-- ---------------------------------------------------------------------------
-- 3.17 favorites
-- ---------------------------------------------------------------------------
CREATE POLICY "favorites_select_own" ON favorites
  FOR SELECT USING (is_owner(user_id));

CREATE POLICY "favorites_insert_own" ON favorites
  FOR INSERT WITH CHECK (is_owner(user_id));

CREATE POLICY "favorites_delete_own" ON favorites
  FOR DELETE USING (is_owner(user_id));

CREATE POLICY "favorites_select_admin" ON favorites
  FOR SELECT USING (is_admin());

-- ---------------------------------------------------------------------------
-- 3.18 wishlists
-- ---------------------------------------------------------------------------
CREATE POLICY "wishlists_select_own" ON wishlists
  FOR SELECT USING (is_owner(user_id));

CREATE POLICY "wishlists_select_public" ON wishlists
  FOR SELECT USING (is_public = true);

CREATE POLICY "wishlists_select_admin" ON wishlists
  FOR SELECT USING (is_admin());

CREATE POLICY "wishlists_insert_own" ON wishlists
  FOR INSERT WITH CHECK (is_owner(user_id));

CREATE POLICY "wishlists_update_own" ON wishlists
  FOR UPDATE USING (is_owner(user_id));

CREATE POLICY "wishlists_delete_own" ON wishlists
  FOR DELETE USING (is_owner(user_id));

-- ---------------------------------------------------------------------------
-- 3.19 wishlist_items
-- ---------------------------------------------------------------------------
CREATE POLICY "wishlist_items_select_own" ON wishlist_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM wishlists WHERE id = wishlist_id AND user_id = auth.uid())
    OR
    EXISTS (SELECT 1 FROM wishlists WHERE id = wishlist_id AND is_public = true)
  );

CREATE POLICY "wishlist_items_select_admin" ON wishlist_items
  FOR SELECT USING (is_admin());

CREATE POLICY "wishlist_items_insert_own" ON wishlist_items
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM wishlists WHERE id = wishlist_id AND user_id = auth.uid())
  );

CREATE POLICY "wishlist_items_delete_own" ON wishlist_items
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM wishlists WHERE id = wishlist_id AND user_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- 3.20 view_history
-- ---------------------------------------------------------------------------
CREATE POLICY "view_history_select_own" ON view_history
  FOR SELECT USING (is_owner(user_id));

CREATE POLICY "view_history_insert_own" ON view_history
  FOR INSERT WITH CHECK (is_owner(user_id));

CREATE POLICY "view_history_select_admin" ON view_history
  FOR SELECT USING (is_admin());

-- ---------------------------------------------------------------------------
-- 3.21 product_views
-- ---------------------------------------------------------------------------
CREATE POLICY "product_views_insert_anon" ON product_views
  FOR INSERT WITH CHECK (true);

CREATE POLICY "product_views_select_admin" ON product_views
  FOR SELECT USING (is_admin());

-- ---------------------------------------------------------------------------
-- 3.22 coupons
-- ---------------------------------------------------------------------------
CREATE POLICY "coupons_select_active" ON coupons
  FOR SELECT USING (is_active = true OR is_admin());

CREATE POLICY "coupons_manage_admin" ON coupons
  FOR ALL USING (is_admin());

-- ---------------------------------------------------------------------------
-- 3.23 coupon_usage
-- ---------------------------------------------------------------------------
CREATE POLICY "coupon_usage_select_own" ON coupon_usage
  FOR SELECT USING (is_owner(user_id));

CREATE POLICY "coupon_usage_select_admin" ON coupon_usage
  FOR SELECT USING (is_admin());

CREATE POLICY "coupon_usage_insert_own" ON coupon_usage
  FOR INSERT WITH CHECK (is_owner(user_id));

-- ---------------------------------------------------------------------------
-- 3.24 orders
-- ---------------------------------------------------------------------------
CREATE POLICY "orders_select_own" ON orders
  FOR SELECT USING (is_owner(user_id));

CREATE POLICY "orders_select_admin" ON orders
  FOR SELECT USING (is_admin());

CREATE POLICY "orders_insert_own" ON orders
  FOR INSERT WITH CHECK (is_owner(user_id));

CREATE POLICY "orders_update_admin" ON orders
  FOR UPDATE USING (is_admin());

-- ---------------------------------------------------------------------------
-- 3.25 order_items
-- ---------------------------------------------------------------------------
CREATE POLICY "order_items_select_own" ON order_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM orders WHERE id = order_id AND user_id = auth.uid())
  );

CREATE POLICY "order_items_select_admin" ON order_items
  FOR SELECT USING (is_admin());

CREATE POLICY "order_items_insert_own" ON order_items
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM orders WHERE id = order_id AND user_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- 3.26 shipments
-- ---------------------------------------------------------------------------
CREATE POLICY "shipments_select_own" ON shipments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM orders WHERE id = order_id AND user_id = auth.uid())
  );

CREATE POLICY "shipments_select_admin" ON shipments
  FOR SELECT USING (is_admin());

CREATE POLICY "shipments_manage_admin" ON shipments
  FOR ALL USING (is_admin());

-- ---------------------------------------------------------------------------
-- 3.27 inventory_movements
-- ---------------------------------------------------------------------------
CREATE POLICY "inventory_movements_select_admin" ON inventory_movements
  FOR SELECT USING (is_admin());

CREATE POLICY "inventory_movements_insert_admin" ON inventory_movements
  FOR INSERT WITH CHECK (is_admin());

-- ---------------------------------------------------------------------------
-- 3.28 reviews
-- ---------------------------------------------------------------------------
CREATE POLICY "reviews_select_approved" ON reviews
  FOR SELECT USING (is_approved = true OR is_owner(user_id) OR is_admin());

CREATE POLICY "reviews_insert_own" ON reviews
  FOR INSERT WITH CHECK (is_owner(user_id));

CREATE POLICY "reviews_update_own" ON reviews
  FOR UPDATE USING (is_owner(user_id));

CREATE POLICY "reviews_manage_admin" ON reviews
  FOR ALL USING (is_admin());

-- ---------------------------------------------------------------------------
-- 3.29 questions
-- ---------------------------------------------------------------------------
CREATE POLICY "questions_select_public" ON questions
  FOR SELECT USING (
    (status = 'answered' AND is_public = true) OR is_owner(user_id) OR is_admin()
  );

CREATE POLICY "questions_insert_own" ON questions
  FOR INSERT WITH CHECK (is_owner(user_id));

CREATE POLICY "questions_manage_admin" ON questions
  FOR ALL USING (is_admin());

-- ---------------------------------------------------------------------------
-- 3.30 notifications
-- ---------------------------------------------------------------------------
CREATE POLICY "notifications_select_own" ON notifications
  FOR SELECT USING (is_owner(user_id));

CREATE POLICY "notifications_update_own" ON notifications
  FOR UPDATE USING (is_owner(user_id));

CREATE POLICY "notifications_insert_admin" ON notifications
  FOR INSERT WITH CHECK (is_admin());

-- ---------------------------------------------------------------------------
-- 3.31 banners
-- ---------------------------------------------------------------------------
CREATE POLICY "banners_select_active" ON banners
  FOR SELECT USING (is_active = true OR is_admin());

CREATE POLICY "banners_manage_admin" ON banners
  FOR ALL USING (is_admin());

-- ---------------------------------------------------------------------------
-- 3.32 search_logs
-- ---------------------------------------------------------------------------
CREATE POLICY "search_logs_insert_anon" ON search_logs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "search_logs_select_admin" ON search_logs
  FOR SELECT USING (is_admin());

-- ---------------------------------------------------------------------------
-- 3.33 imports
-- ---------------------------------------------------------------------------
CREATE POLICY "imports_manage_admin" ON imports
  FOR ALL USING (is_admin());

-- ---------------------------------------------------------------------------
-- 3.34 import_errors
-- ---------------------------------------------------------------------------
CREATE POLICY "import_errors_select_admin" ON import_errors
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM imports WHERE id = import_id AND user_id = auth.uid())
    OR is_admin()
  );

CREATE POLICY "import_errors_manage_admin" ON import_errors
  FOR ALL USING (is_admin());

-- ---------------------------------------------------------------------------
-- 3.35 email_logs
-- ---------------------------------------------------------------------------
CREATE POLICY "email_logs_select_admin" ON email_logs
  FOR SELECT USING (is_admin());

-- ---------------------------------------------------------------------------
-- 3.36 audit_logs
-- ---------------------------------------------------------------------------
CREATE POLICY "audit_logs_select_admin" ON audit_logs
  FOR SELECT USING (is_admin());

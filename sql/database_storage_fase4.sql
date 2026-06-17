-- =============================================================================
-- STORAGE BUCKETS & POLICIES
-- Ecommerce Platform — PostgreSQL + Supabase
-- =============================================================================
-- Ejecutar DESPUÉS de database_schema.sql y database_rls.sql.
-- =============================================================================

-- =============================================================================
-- 1. CREATE BUCKETS
-- =============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('products', 'products', true, 5242880, ARRAY['image/webp', 'image/jpeg', 'image/png', 'image/avif']),
  ('banners',  'banners',  true, 10485760, ARRAY['image/webp', 'image/jpeg', 'image/png', 'image/avif']),
  ('avatars',  'avatars',  true, 2097152,  ARRAY['image/webp', 'image/jpeg', 'image/png'])
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 2. STORAGE POLICIES
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 2.1 Bucket: products
-- ---------------------------------------------------------------------------

CREATE POLICY "products_select_public" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'products');

CREATE POLICY "products_insert_admin" ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'products' AND is_admin());

CREATE POLICY "products_update_admin" ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'products' AND is_admin());

CREATE POLICY "products_delete_admin" ON storage.objects
  FOR DELETE
  USING (bucket_id = 'products' AND is_admin());

-- ---------------------------------------------------------------------------
-- 2.2 Bucket: banners
-- ---------------------------------------------------------------------------

CREATE POLICY "banners_select_public" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'banners');

CREATE POLICY "banners_insert_admin" ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'banners' AND is_admin());

CREATE POLICY "banners_update_admin" ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'banners' AND is_admin());

CREATE POLICY "banners_delete_admin" ON storage.objects
  FOR DELETE
  USING (bucket_id = 'banners' AND is_admin());

-- ---------------------------------------------------------------------------
-- 2.3 Bucket: avatars
-- ---------------------------------------------------------------------------

CREATE POLICY "avatars_select_public" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "avatars_insert_own" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "avatars_update_own" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "avatars_delete_own" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "avatars_manage_admin" ON storage.objects
  FOR ALL
  USING (bucket_id = 'avatars' AND is_admin());

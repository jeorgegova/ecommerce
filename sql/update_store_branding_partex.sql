-- Actualización de marca oficial: PARTEX y lema 'Professional parts & components'
-- Inserción / actualización en la tabla settings

INSERT INTO public.settings (key, value, description)
VALUES 
  ('store_name', '"PARTEX"'::jsonb, 'Nombre comercial oficial de la tienda'),
  ('store_slogan', '"Professional parts & components"'::jsonb, 'Lema oficial que acompaña el logo y cabeceras'),
  ('store_description', '"PARTEX - Professional parts & components. Repuestos y componentes para máquinas vending e industriales."'::jsonb, 'Descripción corta para metadatos SEO y pie de página')
ON CONFLICT (key) DO UPDATE
SET 
  value = EXCLUDED.value,
  description = EXCLUDED.description,
  updated_at = now();

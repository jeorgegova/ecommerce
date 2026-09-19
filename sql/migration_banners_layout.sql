-- Migración: posición del texto en el carrusel
-- Ejecutar en el SQL Editor de Supabase
ALTER TABLE banners
  ADD COLUMN IF NOT EXISTS layout TEXT NOT NULL DEFAULT 'center'
  CHECK (layout IN ('center', 'right'));

COMMENT ON COLUMN banners.layout IS 'Posición del texto del carrusel: center (grande centrado) o right (compacto a la derecha)';

-- Agregar columnas de umbrales de inventario por producto
-- Ejecutar si el schema ya existía antes de agregar estas columnas

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER NOT NULL DEFAULT 5 CHECK (low_stock_threshold >= 0);

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS stock_bar_max INTEGER NOT NULL DEFAULT 20 CHECK (stock_bar_max >= 1);

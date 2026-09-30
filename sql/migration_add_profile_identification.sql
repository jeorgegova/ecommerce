-- Agregar identificación (cédula / documento) al perfil del cliente
-- Necesaria para generar la proforma en el checkout

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS identification TEXT;

-- Normalizar: cadenas vacías o solo espacios se consideran "sin dato"
UPDATE profiles
SET identification = NULL
WHERE identification IS NOT NULL AND btrim(identification) = '';
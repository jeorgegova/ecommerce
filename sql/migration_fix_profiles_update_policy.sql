-- Corrige el error 500 "more than one row returned by a subquery used as an
-- expression" al hacer PATCH /profiles?id=eq.<uuid> (guardar cedula / telefono
-- para la proforma, o editar el perfil).
--
-- ---------------------------------------------------------------------------
-- CAUSA
-- ---------------------------------------------------------------------------
-- La politica "profiles_update_own" comparaba el rol contra un subquery escrito
-- asi:
--
--   WITH CHECK (is_owner(id) AND role = (SELECT role FROM profiles WHERE id = id))
--
-- El `id` de la politica es la fila NUEVA, pero dentro del subquery el `id`
-- interno se resuelve a la columna profiles.id. El predicado queda
-- `profiles.id = profiles.id`, que coincide con TODAS las filas, y un
-- `SELECT role` (subquery escalar) lanza "more than one row returned by a
-- subquery used as an expression" en cuanto profiles tiene 2 o mas filas.
-- Al fallar la evaluacion de la politica, PostgREST responde 500.
--
-- ---------------------------------------------------------------------------
-- SOLUCION
-- ---------------------------------------------------------------------------
-- La politica queda simple (solo verificar que la fila es del usuario) y el
-- control anti-ascenso a 'admin' pasa a un trigger BEFORE UPDATE, que es el
-- unico sitio donde OLD y NEW estan disponibles de forma explicita.
--
-- Por que no un subquery dentro de WITH CHECK: WITH CHECK solo ve la fila
-- nueva, asi que para comparar contra el rol anterior hay que rely en el
-- snapshot del UPDATE (correcto, pero fragil e invisible al leer el codigo).
-- El trigger ademas falla cerrado: si NEW.role <> OLD.role y el autor no es
-- admin, lanza excepcion en vez de dejar pasar el cambio.

-- ---------------------------------------------------------------------------
-- 1. Politica: el usuario puede actualizar su propia fila
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE
  USING (is_owner(profiles.id))
  WITH CHECK (is_owner(profiles.id));

-- ---------------------------------------------------------------------------
-- 2. Trigger: nadie se auto-asigna 'admin' (salvo un admin existente)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION guard_profile_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role AND NOT is_admin() THEN
    RAISE EXCEPTION 'No se puede modificar el rol del perfil'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION guard_profile_role() IS
  'Bloquea el cambio de profiles.role para quien no sea admin. Compara OLD vs NEW de forma explicita.';

DROP TRIGGER IF EXISTS trg_profiles_guard_role ON public.profiles;

CREATE TRIGGER trg_profiles_guard_role
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION guard_profile_role();

-- ---------------------------------------------------------------------------
-- 3. Verificacion (ejecutar en el SQL Editor con la sesion conectada)
-- ---------------------------------------------------------------------------
--
--   -- a) la politica quedo recreada
--   SELECT policyname, cmd, qual, with_check
--   FROM pg_policies
--   WHERE tablename = 'profiles' AND policyname = 'profiles_update_own';
--   -- esperado: qual = "is_owner((profiles.id)::uuid)"
--
--   -- b) la columna de identificacion existe
--   SELECT column_name FROM information_schema.columns
--   WHERE table_name = 'profiles' AND column_name IN ('identification', 'phone');
--
--   -- c) DEBE FUNCIONAR: actualizar datos propios
--   UPDATE profiles SET phone = '0999999999' WHERE id = auth.uid();
--
--   -- d) DEBE FALLAR con "No se puede modificar el rol del perfil"
--   UPDATE profiles SET role = 'admin' WHERE id = auth.uid();
--
--   -- e) confirmar que el trigger quedo instalado
--   SELECT tgname FROM pg_trigger WHERE tgrelid = 'profiles'::regclass AND NOT tgisinternal;

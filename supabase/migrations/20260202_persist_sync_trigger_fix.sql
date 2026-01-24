-- Migration: persist_sync_trigger_fix
-- Goal: Garantir que os enums necessários existam e substituir a função
-- `sync_auth_user_to_profile()` por uma versão segura (casts explícitos,
-- tratamento de exceções que registra em public.sync_auth_user_errors).
-- Idempotente: usa blocos DO/BEGIN com checagens de existência.

BEGIN;

-- 1) Garantir enums existentes
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE public.user_role AS ENUM ('user', 'admin', 'coordinator');
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'semester_type') THEN
    CREATE TYPE public.semester_type AS ENUM ('1','2');
  END IF;
END$$;

-- 2) Substituir função trigger por versão robusta
CREATE OR REPLACE FUNCTION public.sync_auth_user_to_profile()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $$
BEGIN
  BEGIN
    IF TG_OP = 'INSERT' THEN
      INSERT INTO public.profiles (id, saram, full_name, rank, role, semester, created_at, updated_at)
      VALUES (
        NEW.id,
        COALESCE((to_jsonb(NEW)->'raw_user_meta_data') ->> 'saram', (to_jsonb(NEW)->'user_metadata') ->> 'saram', NEW.id::text),
        COALESCE((to_jsonb(NEW)->'raw_user_meta_data') ->> 'full_name', (to_jsonb(NEW)->'user_metadata') ->> 'full_name', ''),
        COALESCE((to_jsonb(NEW)->'raw_user_meta_data') ->> 'rank', (to_jsonb(NEW)->'user_metadata') ->> 'rank', ''),
        COALESCE((to_jsonb(NEW)->'raw_user_meta_data') ->> 'role', (to_jsonb(NEW)->'user_metadata') ->> 'role', 'user')::public.user_role,
        COALESCE((to_jsonb(NEW)->'raw_user_meta_data') ->> 'semester', (to_jsonb(NEW)->'user_metadata') ->> 'semester', '1')::public.semester_type,
        NOW(), NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        saram = EXCLUDED.saram,
        full_name = EXCLUDED.full_name,
        rank = EXCLUDED.rank,
        semester = EXCLUDED.semester,
        updated_at = NOW();
      RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
      UPDATE public.profiles
      SET
        saram = COALESCE((to_jsonb(NEW)->'raw_user_meta_data') ->> 'saram', (to_jsonb(NEW)->'user_metadata') ->> 'saram', saram),
        full_name = COALESCE((to_jsonb(NEW)->'raw_user_meta_data') ->> 'full_name', (to_jsonb(NEW)->'user_metadata') ->> 'full_name', full_name),
        rank = COALESCE((to_jsonb(NEW)->'raw_user_meta_data') ->> 'rank', (to_jsonb(NEW)->'user_metadata') ->> 'rank', rank),
        semester = COALESCE((to_jsonb(NEW)->'raw_user_meta_data') ->> 'semester', (to_jsonb(NEW)->'user_metadata') ->> 'semester', semester)::public.semester_type,
        updated_at = NOW()
      WHERE id = NEW.id;
      RETURN NEW;
    END IF;
    RETURN NULL;
  EXCEPTION WHEN OTHERS THEN
    -- Registra o erro e continua para evitar que a criação do usuário falhe
    INSERT INTO public.sync_auth_user_errors (error_text, new_payload) VALUES (SQLERRM, to_jsonb(NEW));
    RETURN NEW;
  END;
END;
$$;

-- 3) Garantir owner/perm (ajuste se necessário no ambiente alvo)
-- Nota: 'postgres' é usualmente owner em ambientes administrados; ajuste conforme necessário.
ALTER FUNCTION public.sync_auth_user_to_profile() OWNER TO postgres;

COMMIT;

-- Rollback: veja arquivo de rollback separado (idempotente)

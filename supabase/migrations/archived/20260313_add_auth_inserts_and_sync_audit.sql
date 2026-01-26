-- Migration: Add auth_inserts and sync_auth_user_audit tables and logging triggers/policies
BEGIN;

-- 1) auth_inserts: log attempts to insert into auth.users
CREATE TABLE IF NOT EXISTS public.auth_inserts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  email TEXT,
  user_id UUID,
  payload JSONB
);

-- index on email (lower) for fast lookup
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class WHERE relname = 'idx_auth_inserts_email_lower' AND relkind = 'i'
  ) THEN
    CREATE INDEX idx_auth_inserts_email_lower ON public.auth_inserts (lower(email));
  END IF;
END$$;

-- 2) log function and trigger to capture auth.users inserts into auth_inserts
CREATE OR REPLACE FUNCTION public.log_auth_user_insert_to_table()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.auth_inserts(email, user_id, payload)
    VALUES (NEW.email::text, NEW.id::uuid, to_jsonb(NEW));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER FUNCTION public.log_auth_user_insert_to_table() OWNER TO postgres;

DROP TRIGGER IF EXISTS log_auth_user_insert_to_table ON auth.users;
CREATE TRIGGER log_auth_user_insert_to_table
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.log_auth_user_insert_to_table();

-- 3) sync_auth_user_audit: record successful syncs/updates between auth and profiles
CREATE TABLE IF NOT EXISTS public.sync_auth_user_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  auth_user_id UUID,
  profile_id UUID,
  action TEXT,
  old_payload JSONB,
  new_payload JSONB
);

-- index for queries by auth_user_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class WHERE relname = 'idx_sync_auth_user_audit_auth_user' AND relkind = 'i'
  ) THEN
    CREATE INDEX idx_sync_auth_user_audit_auth_user ON public.sync_auth_user_audit (auth_user_id);
  END IF;
END$$;

-- 4) audit trigger function on profiles (logs inserts/updates)
CREATE OR REPLACE FUNCTION public.log_profile_audit()
RETURNS trigger AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO public.sync_auth_user_audit(auth_user_id, profile_id, action, old_payload, new_payload)
      VALUES (NULL, NEW.id, 'INSERT', NULL, to_jsonb(NEW));
    RETURN NEW;
  ELSIF (TG_OP = 'UPDATE') THEN
    -- Only log if something changed
    INSERT INTO public.sync_auth_user_audit(auth_user_id, profile_id, action, old_payload, new_payload)
      VALUES (NULL, NEW.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER FUNCTION public.log_profile_audit() OWNER TO postgres;

DROP TRIGGER IF EXISTS log_profile_audit ON public.profiles;
CREATE TRIGGER log_profile_audit
  AFTER INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.log_profile_audit();

-- 5) RLS policies: restrict to admin role
-- auth_inserts
ALTER TABLE IF EXISTS public.auth_inserts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS auth_inserts_select ON public.auth_inserts;
CREATE POLICY auth_inserts_select ON public.auth_inserts
  FOR SELECT USING ((SELECT auth.role() AS role) = 'admin'::text);
DROP POLICY IF EXISTS auth_inserts_insert ON public.auth_inserts;
CREATE POLICY auth_inserts_insert ON public.auth_inserts
  FOR INSERT WITH CHECK ((SELECT auth.role() AS role) = 'admin'::text);

-- sync_auth_user_audit
ALTER TABLE IF EXISTS public.sync_auth_user_audit ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS sync_auth_user_audit_select ON public.sync_auth_user_audit;
CREATE POLICY sync_auth_user_audit_select ON public.sync_auth_user_audit
  FOR SELECT USING ((SELECT auth.role() AS role) = 'admin'::text);
DROP POLICY IF EXISTS sync_auth_user_audit_insert ON public.sync_auth_user_audit;
CREATE POLICY sync_auth_user_audit_insert ON public.sync_auth_user_audit
  FOR INSERT WITH CHECK ((SELECT auth.role() AS role) = 'admin'::text);

COMMIT;

-- Migration: Log incoming auth.users inserts to help debug signup failures
CREATE OR REPLACE FUNCTION public.log_auth_user_insert()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.sync_auth_user_errors(error_text, new_payload)
    VALUES ('pre-insert', to_jsonb(NEW));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER FUNCTION public.log_auth_user_insert() OWNER TO postgres;

DROP TRIGGER IF EXISTS log_auth_user_insert ON auth.users;
CREATE TRIGGER log_auth_user_insert
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.log_auth_user_insert();

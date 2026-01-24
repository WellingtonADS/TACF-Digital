require("dotenv").config();
const { Client } = require("pg");
(async () => {
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  const sql = `CREATE OR REPLACE FUNCTION public.sync_auth_user_to_profile()
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
        'user'::user_role,
        COALESCE((to_jsonb(NEW)->'raw_user_meta_data') ->> 'semester', (to_jsonb(NEW)->'user_metadata') ->> 'semester', '1')::semester_type,
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
        semester = COALESCE((to_jsonb(NEW)->'raw_user_meta_data') ->> 'semester', (to_jsonb(NEW)->'user_metadata') ->> 'semester', semester)::semester_type,
        updated_at = NOW()
      WHERE id = NEW.id;
      RETURN NEW;
    END IF;
    RETURN NULL;
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO public.sync_auth_user_errors (error_text, new_payload) VALUES (SQLERRM, to_jsonb(NEW));
    RETURN NEW;
  END;
END;
$$;`;
  try {
    await c.query(sql);
    console.log("function replaced OK");
  } catch (e) {
    console.error("replace failed", e);
  } finally {
    await c.end();
  }
})();

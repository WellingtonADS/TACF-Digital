# Supabase Security Recommendations 🔒

This file summarizes remediations for linter warnings found in the Supabase project and how to apply them.

## 1) Function search_path mutable (linter id: 0011) ✅

- Problem: Some PostgreSQL functions had a mutable `search_path` which is a potential attack vector.
- Fix applied: Added a migration `supabase/migrations/archived/20260126_set_functions_search_path_additional.sql` that runs `ALTER FUNCTION ... SET search_path = public, pg_catalog;` for all affected functions. This is idempotent and safe to run on existing databases.

What to review in PR/Deployment:

- Confirm migration is deployed to the target DB (via `supabase db push` / migrations workflow).
- Verify functions now show `search_path = public, pg_catalog` (via `\df+ public.*` or Supabase SQL editor).

## 2) Leaked Password Protection Disabled (auth_leaked_password_protection) ⚠️

- Problem: Supabase Auth has leaked password protection disabled; this prevents checks against HaveIBeenPwned for compromised passwords.
- Remediation steps (manual, requires Supabase project access):
  1. Open your Supabase project dashboard.
  2. Go to **Authentication → Settings → Password**.
  3. Enable **Leaked password protection** (checks passwords against HaveIBeenPwned). Optionally enforce a block or warn.
  4. Save settings and consider communicating policy changes to users.

Reference: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

---

If you want, I can also open a PR that:

- Adds the migration (already added in this branch).
- Adds a short test or check in CI to ensure future migrations include `SET search_path` for new functions.

# Archived Migrations

This directory stores migrations that were moved from `supabase/migrations` during a sanitize operation.

Why archive instead of delete:

- Preserves audit trail and ability to re-apply or review changes later.
- Avoids accidental removal of migrations that may have already been applied to production or test databases.

If a migration was archived by mistake, restore it to `supabase/migrations` and run the standard apply process.

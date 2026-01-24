-- Cleanup migration: remove old entries from public.sync_auth_user_errors
-- Use with caution in production; adjust retention period as needed.

BEGIN;

-- Delete entries older than 30 days
DELETE FROM public.sync_auth_user_errors
WHERE created_at < NOW() - INTERVAL '30 days';

COMMIT;

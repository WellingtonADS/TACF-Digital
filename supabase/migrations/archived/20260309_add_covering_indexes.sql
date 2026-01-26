-- Migration: add covering indexes for foreign keys flagged by advisor
BEGIN;

CREATE INDEX IF NOT EXISTS idx_sessions_coordinator_id ON public.sessions (coordinator_id);
CREATE INDEX IF NOT EXISTS idx_swap_requests_new_session_id ON public.swap_requests (new_session_id);
CREATE INDEX IF NOT EXISTS idx_swap_requests_processed_by ON public.swap_requests (processed_by);

COMMIT;

-- Migration: Drop duplicate and invalid check constraints on public.sessions
-- Reason: Remove duplicate `sessions_max_capacity_check` and an invalid `sessions_scopes_length` referencing a non-existent column.

ALTER TABLE public.sessions DROP CONSTRAINT IF EXISTS sessions_max_capacity_check;
ALTER TABLE public.sessions DROP CONSTRAINT IF EXISTS sessions_scopes_length;

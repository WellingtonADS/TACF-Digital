-- Migration: Add CHECK constraint to enforce sessions.max_capacity BETWEEN 8 AND 21

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE c.conname = 'sessions_capacity_check'
  ) THEN
    ALTER TABLE public.sessions
      ADD CONSTRAINT sessions_capacity_check CHECK (max_capacity >= 8 AND max_capacity <= 21);
  END IF;
END $$;

-- Optionally, validate existing rows and raise if invalid
-- UPDATE public.sessions SET max_capacity = 8 WHERE max_capacity < 8;
-- UPDATE public.sessions SET max_capacity = 21 WHERE max_capacity > 21;

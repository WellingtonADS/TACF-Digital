-- Migration: Add semester to bookings and enforce one booking per user per semester

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS semester semester_type;

-- Populate existing bookings with the user's current semester (best-effort)
UPDATE public.bookings b
SET semester = p.semester
FROM public.profiles p
WHERE b.user_id = p.id AND b.semester IS NULL;

-- Add unique constraint to enforce one booking per user per semester
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE c.conname = 'unique_user_semester'
  ) THEN
    ALTER TABLE public.bookings
      ADD CONSTRAINT unique_user_semester UNIQUE (user_id, semester);
  END IF;
END $$;

-- Add index
CREATE INDEX IF NOT EXISTS idx_bookings_user_semester ON public.bookings(user_id, semester);

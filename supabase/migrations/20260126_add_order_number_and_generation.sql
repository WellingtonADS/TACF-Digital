-- Migration: Add order_number to bookings and generator table/function
-- Adds: bookings.order_number (TEXT UNIQUE), order_numbers table and fn_next_order_number

BEGIN;

-- Add column to bookings
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS order_number TEXT;

-- Ensure uniqueness
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class WHERE relname = 'idx_bookings_order_number' AND relkind = 'i'
  ) THEN
    CREATE UNIQUE INDEX idx_bookings_order_number ON public.bookings(order_number);
  END IF;
END$$;

-- Table to track last number per year/semester
CREATE TABLE IF NOT EXISTS public.order_numbers (
  year INTEGER NOT NULL,
  semester TEXT NOT NULL,
  last INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (year, semester)
);

-- Function to fetch next order number safely with row locking
CREATE OR REPLACE FUNCTION public.fn_next_order_number(p_year INTEGER, p_semester TEXT)
RETURNS TEXT AS $$
DECLARE
  v_last INTEGER;
  v_new INTEGER;
  v_final TEXT;
BEGIN
  -- Try to get existing row, locking it
  SELECT last INTO v_last FROM public.order_numbers WHERE year = p_year AND semester = p_semester FOR UPDATE;

  IF NOT FOUND THEN
    v_new := 1;
    INSERT INTO public.order_numbers(year, semester, last) VALUES (p_year, p_semester, v_new);
  ELSE
    v_new := v_last + 1;
    UPDATE public.order_numbers SET last = v_new WHERE year = p_year AND semester = p_semester;
  END IF;

  v_final := format('%s-%s-%s', p_year::text, p_semester, lpad(v_new::text, 4, '0'));
  RETURN v_final;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;

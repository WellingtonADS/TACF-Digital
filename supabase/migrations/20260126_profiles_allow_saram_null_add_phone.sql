-- Migration: Allow saram to be NULL and add phone_number to profiles
BEGIN;

ALTER TABLE public.profiles ALTER COLUMN saram DROP NOT NULL;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);

COMMIT;
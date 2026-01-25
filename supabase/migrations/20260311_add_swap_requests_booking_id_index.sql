-- Migration: add covering index for swap_requests.booking_id
BEGIN;

CREATE INDEX IF NOT EXISTS idx_swap_requests_booking_id ON public.swap_requests (booking_id);

COMMIT;

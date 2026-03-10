-- Data export for public.bookings
SET search_path = "public", public;

INSERT INTO "public"."bookings" ("id", "user_id", "session_id", "semester", "swap_reason", "created_at", "updated_at", "order_number", "attendance_confirmed", "metadata", "score", "result_details", "test_date", "status") VALUES ('94ff8577-958c-49cf-bad0-248dac454b47', 'a3c39e60-b4d9-4b2f-9555-85b436ebcf57', 'd9bf7dfb-2c26-46a0-994b-6b4b16b8ca4f', '1', NULL, '2026-03-05T11:11:55.079Z', '2026-03-09T15:20:33.716Z', '2026-1-0012', FALSE, '{}', NULL, '{}', NULL, 'agendado');

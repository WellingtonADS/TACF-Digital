-- Data export for public.system_settings
SET search_path = "public", public;

INSERT INTO "public"."system_settings" ("id", "is_global", "system_name", "organization_name", "min_capacity", "max_capacity", "default_periods", "allow_swaps", "require_quorum", "created_at", "updated_at") VALUES ('26eb5ee9-bdd2-4293-b054-ba922e31839b', TRUE, 'TACF Digital', 'Forca Aerea Brasileira', 8, 21, '{morning,afternoon}', TRUE, TRUE, '2026-02-15T15:54:20.151Z', '2026-03-07T11:29:09.663Z');

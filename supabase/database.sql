-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.access_profile_permissions (
  access_profile_id uuid NOT NULL,
  permission_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT access_profile_permissions_pkey PRIMARY KEY (access_profile_id, permission_id),
  CONSTRAINT access_profile_permissions_access_profile_id_fkey FOREIGN KEY (access_profile_id) REFERENCES public.access_profiles(id),
  CONSTRAINT access_profile_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.permissions(id)
);
CREATE TABLE public.access_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  role USER-DEFINED NOT NULL,
  icon text NOT NULL DEFAULT 'shield'::text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT access_profiles_pkey PRIMARY KEY (id)
);
CREATE TABLE public.audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  action text,
  entity text,
  user_id uuid,
  user_name text,
  details text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT audit_logs_pkey PRIMARY KEY (id),
  CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.auth_inserts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  email text,
  user_id uuid,
  payload jsonb,
  CONSTRAINT auth_inserts_pkey PRIMARY KEY (id)
);
CREATE TABLE public.bookings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  session_id uuid NOT NULL,
  status USER-DEFINED NOT NULL DEFAULT 'confirmed'::booking_status,
  semester USER-DEFINED NOT NULL,
  swap_reason text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  order_number text,
  attendance_confirmed boolean NOT NULL DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb,
  score text,
  result_details jsonb DEFAULT '{}'::jsonb,
  test_date date,
  CONSTRAINT bookings_pkey PRIMARY KEY (id),
  CONSTRAINT bookings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT bookings_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.sessions(id)
);
CREATE TABLE public.location_schedules (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL,
  day_of_week smallint NOT NULL CHECK (day_of_week >= 1 AND day_of_week <= 5),
  period text NOT NULL CHECK (period = ANY (ARRAY['morning'::text, 'afternoon'::text])),
  start_time time without time zone NOT NULL DEFAULT '07:00:00'::time without time zone,
  end_time time without time zone,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT location_schedules_pkey PRIMARY KEY (id),
  CONSTRAINT location_schedules_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id)
);
CREATE TABLE public.locations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text NOT NULL,
  max_capacity integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active'::text,
  facilities ARRAY DEFAULT ARRAY[]::text[],
  metadata jsonb,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT locations_pkey PRIMARY KEY (id),
  CONSTRAINT locations_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.order_numbers (
  year integer NOT NULL,
  semester text NOT NULL,
  last integer NOT NULL DEFAULT 0,
  CONSTRAINT order_numbers_pkey PRIMARY KEY (year, semester)
);
CREATE TABLE public.permissions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT permissions_pkey PRIMARY KEY (id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  saram character varying UNIQUE,
  full_name character varying,
  rank character varying,
  role USER-DEFINED NOT NULL DEFAULT 'user'::user_role CHECK (role = ANY (ARRAY['user'::user_role, 'admin'::user_role, 'coordinator'::user_role])),
  semester USER-DEFINED DEFAULT '1'::semester_type,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  phone_number character varying,
  email text,
  active boolean NOT NULL DEFAULT true,
  war_name text,
  sector text,
  metadata jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  date date NOT NULL,
  period USER-DEFINED NOT NULL,
  max_capacity integer NOT NULL DEFAULT 8 CHECK (max_capacity >= 8 AND max_capacity <= 21),
  applicators ARRAY NOT NULL DEFAULT '{}'::text[],
  status USER-DEFINED NOT NULL DEFAULT 'open'::session_status,
  coordinator_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  title text,
  metadata jsonb DEFAULT '{}'::jsonb,
  capacity integer,
  summary text,
  starts_at timestamp with time zone,
  location_id uuid,
  CONSTRAINT sessions_pkey PRIMARY KEY (id),
  CONSTRAINT sessions_coordinator_id_fkey FOREIGN KEY (coordinator_id) REFERENCES public.profiles(id),
  CONSTRAINT sessions_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id)
);
CREATE TABLE public.swap_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL,
  requested_by uuid NOT NULL,
  new_session_id uuid NOT NULL,
  reason text NOT NULL,
  status USER-DEFINED NOT NULL DEFAULT 'pending'::swap_status,
  processed_by uuid,
  processed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT swap_requests_pkey PRIMARY KEY (id),
  CONSTRAINT swap_requests_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id),
  CONSTRAINT swap_requests_requested_by_fkey FOREIGN KEY (requested_by) REFERENCES public.profiles(id),
  CONSTRAINT swap_requests_new_session_id_fkey FOREIGN KEY (new_session_id) REFERENCES public.sessions(id),
  CONSTRAINT swap_requests_processed_by_fkey FOREIGN KEY (processed_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.sync_auth_user_audit (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  auth_user_id uuid,
  profile_id uuid,
  action text,
  old_payload jsonb,
  new_payload jsonb,
  CONSTRAINT sync_auth_user_audit_pkey PRIMARY KEY (id)
);
CREATE TABLE public.sync_auth_user_errors (
  id bigint NOT NULL DEFAULT nextval('sync_auth_user_errors_id_seq'::regclass),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  error_text text NOT NULL,
  new_payload jsonb,
  CONSTRAINT sync_auth_user_errors_pkey PRIMARY KEY (id)
);
CREATE TABLE public.sync_auth_user_errors_archive (
  id bigint NOT NULL,
  created_at timestamp with time zone,
  error_text text,
  new_payload jsonb,
  CONSTRAINT sync_auth_user_errors_archive_pkey PRIMARY KEY (id)
);
CREATE TABLE public.system_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  is_global boolean NOT NULL DEFAULT true UNIQUE,
  system_name text NOT NULL,
  organization_name text NOT NULL,
  min_capacity integer NOT NULL DEFAULT 8,
  max_capacity integer NOT NULL DEFAULT 21,
  default_periods ARRAY NOT NULL DEFAULT '{morning,afternoon}'::session_period[],
  allow_swaps boolean NOT NULL DEFAULT true,
  require_quorum boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT system_settings_pkey PRIMARY KEY (id)
);

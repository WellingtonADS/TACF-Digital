-- ============================================================================
-- TACF Digital - Database Schema
-- Issue: ISSUE-002
-- Description: Complete database schema with ENUMs, tables, and constraints
-- ============================================================================

-- ============================================================================
-- 1. ENUMS (Custom Types)
-- ============================================================================

-- Create enums only if they do not already exist. This makes the schema safe to re-run
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('user', 'admin', 'coordinator');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'session_period') THEN
    CREATE TYPE session_period AS ENUM ('manha', 'tarde');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'session_status') THEN
    CREATE TYPE session_status AS ENUM ('open', 'closed', 'completed');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_status') THEN
    CREATE TYPE booking_status AS ENUM ('agendado', 'cancelado', 'remarcado');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'swap_status') THEN
    CREATE TYPE swap_status AS ENUM ('solicitado', 'aprovado', 'cancelado');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'appeal_status') THEN
    CREATE TYPE appeal_status AS ENUM ('deferido','indeferido');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'semester_type') THEN
    CREATE TYPE semester_type AS ENUM ('1', '2');
  END IF;
END$$;

-- ============================================================================
-- 2. TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Profiles Table (Extends auth.users)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  saram VARCHAR(20) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  rank VARCHAR(50) NOT NULL,
  role user_role DEFAULT 'user' NOT NULL,
  semester semester_type NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for performance (created only if not present)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_profiles_saram' AND relkind = 'i') THEN
    CREATE INDEX idx_profiles_saram ON public.profiles(saram);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_profiles_role' AND relkind = 'i') THEN
    CREATE INDEX idx_profiles_role ON public.profiles(role);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_profiles_semester' AND relkind = 'i') THEN
    CREATE INDEX idx_profiles_semester ON public.profiles(semester);
  END IF;
END$$;

-- ----------------------------------------------------------------------------
-- Sessions Table (Dias e Turnos do TACF)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  starts_at TIMESTAMPTZ NOT NULL,
  -- convenience columns (populados a partir de starts_at)
  date DATE,
  period TEXT,
  max_capacity INTEGER NOT NULL CHECK (max_capacity >= 8 AND max_capacity <= 21),
  capacity INTEGER NOT NULL DEFAULT 0,
  applicators TEXT[] DEFAULT '{}' NOT NULL,
  status session_status DEFAULT 'open' NOT NULL,
  coordinator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Uma sessão por dia+turno
  UNIQUE(date, period)
);

-- Indexes for performance (created only if not present)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_sessions_starts_at' AND relkind = 'i') THEN
    CREATE INDEX idx_sessions_starts_at ON public.sessions(starts_at);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_sessions_status' AND relkind = 'i') THEN
    CREATE INDEX idx_sessions_status ON public.sessions(status);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_sessions_date_period' AND relkind = 'i') THEN
    CREATE INDEX idx_sessions_date_period ON public.sessions(date, period);
  END IF;
END$$;

-- ----------------------------------------------------------------------------
-- Bookings Table (Agendamentos)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  status booking_status DEFAULT 'agendado' NOT NULL,
  attendance_confirmed BOOLEAN NOT NULL DEFAULT false,
  swap_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Um usuário não pode agendar a mesma sessão duas vezes
  UNIQUE(user_id, session_id)
);

-- Indexes for performance (created only if not present)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_bookings_user_id' AND relkind = 'i') THEN
    CREATE INDEX idx_bookings_user_id ON public.bookings(user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_bookings_session_id' AND relkind = 'i') THEN
    CREATE INDEX idx_bookings_session_id ON public.bookings(session_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_bookings_status' AND relkind = 'i') THEN
    CREATE INDEX idx_bookings_status ON public.bookings(status);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_bookings_session_attendance' AND relkind = 'i') THEN
    CREATE INDEX idx_bookings_session_attendance ON public.bookings(session_id, attendance_confirmed);
  END IF;
END$$;

-- ----------------------------------------------------------------------------
-- Swap Requests Table (Solicitações de Troca)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.swap_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  new_session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status swap_status DEFAULT 'pending' NOT NULL,
  processed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ----------------------------------------------------------------------------
-- Locations / Military Organizations (OM)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.locations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    address text NOT NULL,
    max_capacity integer NOT NULL DEFAULT 0,
    status text NOT NULL DEFAULT 'active', -- active | maintenance | inactive
    facilities text[] DEFAULT ARRAY[]::text[],
    metadata jsonb,
    created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at timestamptz NULL DEFAULT now(),
    updated_at timestamptz NULL DEFAULT now()
);

-- Indexes for performance (created only if not present)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_swap_requests_booking_id' AND relkind = 'i') THEN
    CREATE INDEX idx_swap_requests_booking_id ON public.swap_requests(booking_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_swap_requests_status' AND relkind = 'i') THEN
    CREATE INDEX idx_swap_requests_status ON public.swap_requests(status);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_swap_requests_requested_by' AND relkind = 'i') THEN
    CREATE INDEX idx_swap_requests_requested_by ON public.swap_requests(requested_by);
  END IF;
END$$;

-- ----------------------------------------------------------------------------
-- System Settings (Singleton)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  is_global BOOLEAN NOT NULL DEFAULT true,
  system_name TEXT NOT NULL,
  organization_name TEXT NOT NULL,
  min_capacity INTEGER NOT NULL DEFAULT 8,
  max_capacity INTEGER NOT NULL DEFAULT 21,
  default_periods session_period[] NOT NULL DEFAULT '{manha,tarde}',
  allow_swaps BOOLEAN NOT NULL DEFAULT true,
  require_quorum BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  UNIQUE(is_global)
);

-- Access profiles and permissions removed by YAGNI (managed by fixed roles)

-- ----------------------------------------------------------------------------
-- Audit Logs
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT,
  entity TEXT,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  user_name TEXT,
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

DO $$
BEGIN
  -- permission tables removed intentionally
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_audit_logs_created_at' AND relkind = 'i') THEN
    CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_audit_logs_action' AND relkind = 'i') THEN
    CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_audit_logs_user_id' AND relkind = 'i') THEN
    CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
  END IF;
END$$;

-- ============================================================================
-- 3. TRIGGERS (Auto-update timestamps)
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables (guarded creation)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_profiles_updated_at') THEN
    CREATE TRIGGER update_profiles_updated_at
      BEFORE UPDATE ON public.profiles
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_sessions_updated_at') THEN
    CREATE TRIGGER update_sessions_updated_at
      BEFORE UPDATE ON public.sessions
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_bookings_updated_at') THEN
    CREATE TRIGGER update_bookings_updated_at
      BEFORE UPDATE ON public.bookings
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_swap_requests_updated_at') THEN
    CREATE TRIGGER update_swap_requests_updated_at
      BEFORE UPDATE ON public.swap_requests
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_system_settings_updated_at') THEN
    CREATE TRIGGER update_system_settings_updated_at
      BEFORE UPDATE ON public.system_settings
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  -- access_profiles triggers removed
END$$;

-- ============================================================================
-- 4. COMMENTS (Documentation)
-- ============================================================================

COMMENT ON TABLE public.profiles IS 'Extended user profiles linked to auth.users';
COMMENT ON TABLE public.sessions IS 'TACF test sessions by date and period (morning/afternoon)';
COMMENT ON TABLE public.bookings IS 'User bookings for TACF sessions';
COMMENT ON TABLE public.swap_requests IS 'Requests to change booking dates';

COMMENT ON COLUMN public.profiles.saram IS 'Military ID number (SARAM - unique identifier)';
COMMENT ON COLUMN public.sessions.max_capacity IS 'Maximum participants per session (8-21)';
COMMENT ON COLUMN public.sessions.applicators IS 'Array of test applicator names';
COMMENT ON COLUMN public.bookings.swap_reason IS 'Reason for swap request (if status is pending_swap)';

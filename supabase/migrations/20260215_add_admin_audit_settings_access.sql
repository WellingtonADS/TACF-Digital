-- Migration: add audit logs, settings, access profiles, and attendance tracking

BEGIN;

-- Add attendance confirmation flag to bookings
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS attendance_confirmed BOOLEAN NOT NULL DEFAULT false;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class WHERE relname = 'idx_bookings_session_attendance' AND relkind = 'i'
  ) THEN
    CREATE INDEX idx_bookings_session_attendance
      ON public.bookings(session_id, attendance_confirmed);
  END IF;
END$$;

-- System settings (single row)
CREATE TABLE IF NOT EXISTS public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  is_global BOOLEAN NOT NULL DEFAULT true,
  system_name TEXT NOT NULL,
  organization_name TEXT NOT NULL,
  min_capacity INTEGER NOT NULL DEFAULT 8,
  max_capacity INTEGER NOT NULL DEFAULT 21,
  default_periods session_period[] NOT NULL DEFAULT '{morning,afternoon}',
  allow_swaps BOOLEAN NOT NULL DEFAULT true,
  require_quorum BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE (is_global)
);

-- Access profiles and permissions
CREATE TABLE IF NOT EXISTS public.access_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  role user_role NOT NULL,
  icon TEXT NOT NULL DEFAULT 'shield',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.access_profile_permissions (
  access_profile_id UUID NOT NULL REFERENCES public.access_profiles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  PRIMARY KEY (access_profile_id, permission_id)
);

-- Audit logs
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
  IF NOT EXISTS (
    SELECT 1 FROM pg_class WHERE relname = 'idx_access_profiles_name' AND relkind = 'i'
  ) THEN
    CREATE UNIQUE INDEX idx_access_profiles_name ON public.access_profiles(name);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_class WHERE relname = 'idx_permissions_name' AND relkind = 'i'
  ) THEN
    CREATE UNIQUE INDEX idx_permissions_name ON public.permissions(name);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_class WHERE relname = 'idx_access_profiles_role' AND relkind = 'i'
  ) THEN
    CREATE INDEX idx_access_profiles_role ON public.access_profiles(role);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_class WHERE relname = 'idx_access_profile_permissions_permission' AND relkind = 'i'
  ) THEN
    CREATE INDEX idx_access_profile_permissions_permission
      ON public.access_profile_permissions(permission_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_class WHERE relname = 'idx_audit_logs_created_at' AND relkind = 'i'
  ) THEN
    CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_class WHERE relname = 'idx_audit_logs_action' AND relkind = 'i'
  ) THEN
    CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_class WHERE relname = 'idx_audit_logs_user_id' AND relkind = 'i'
  ) THEN
    CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
  END IF;
END$$;

-- updated_at triggers
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_system_settings_updated_at') THEN
    CREATE TRIGGER update_system_settings_updated_at
      BEFORE UPDATE ON public.system_settings
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_access_profiles_updated_at') THEN
    CREATE TRIGGER update_access_profiles_updated_at
      BEFORE UPDATE ON public.access_profiles
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END$$;

-- Seed defaults
INSERT INTO public.system_settings (
  is_global,
  system_name,
  organization_name,
  min_capacity,
  max_capacity,
  default_periods,
  allow_swaps,
  require_quorum
) VALUES (
  true,
  'TACF Digital',
  'Forca Aerea Brasileira',
  8,
  21,
  ARRAY['morning','afternoon']::session_period[],
  true,
  true
) ON CONFLICT (is_global) DO NOTHING;

INSERT INTO public.permissions (name, description) VALUES
  ('Gerenciar Usuarios', 'Permite criar e editar perfis'),
  ('Visualizar Usuarios', 'Permite visualizar base de usuarios'),
  ('Gerenciar Sessoes', 'Permite abrir e editar sessoes'),
  ('Aprovar Trocas', 'Permite aprovar solicitacoes de troca'),
  ('Visualizar Relatorios', 'Permite acessar paines de analytics'),
  ('Configuracoes do Sistema', 'Permite alterar parametros do sistema'),
  ('Gerenciar Perfis de Acesso', 'Permite ajustar permissoes'),
  ('Gerar Listas de Chamada', 'Permite gerar listas de chamada'),
  ('Fazer Agendamentos', 'Permite agendar sessoes'),
  ('Solicitar Trocas', 'Permite solicitar troca de sessao'),
  ('Visualizar Sessoes', 'Permite visualizar sessoes disponiveis'),
  ('Baixar Comprovantes', 'Permite baixar comprovantes')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.access_profiles (name, description, role, icon, is_active) VALUES
  ('Administrador Central', 'Acesso Total ao Sistema', 'admin', 'admin_panel_settings', true),
  ('Coordenador de Turma', 'Gestao de Sessoes e Usuarios', 'coordinator', 'assignment_ind', true),
  ('Usuario Militar', 'Agendamento e Consulta', 'user', 'person', true)
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.access_profile_permissions (access_profile_id, permission_id)
SELECT ap.id, p.id
FROM public.access_profiles ap
JOIN public.permissions p ON p.name IN (
  'Gerenciar Usuarios',
  'Gerenciar Sessoes',
  'Aprovar Trocas',
  'Visualizar Relatorios',
  'Configuracoes do Sistema',
  'Gerenciar Perfis de Acesso'
)
WHERE ap.name = 'Administrador Central'
ON CONFLICT DO NOTHING;

INSERT INTO public.access_profile_permissions (access_profile_id, permission_id)
SELECT ap.id, p.id
FROM public.access_profiles ap
JOIN public.permissions p ON p.name IN (
  'Gerenciar Sessoes',
  'Visualizar Usuarios',
  'Aprovar Trocas',
  'Gerar Listas de Chamada'
)
WHERE ap.name = 'Coordenador de Turma'
ON CONFLICT DO NOTHING;

INSERT INTO public.access_profile_permissions (access_profile_id, permission_id)
SELECT ap.id, p.id
FROM public.access_profiles ap
JOIN public.permissions p ON p.name IN (
  'Fazer Agendamentos',
  'Solicitar Trocas',
  'Visualizar Sessoes',
  'Baixar Comprovantes'
)
WHERE ap.name = 'Usuario Militar'
ON CONFLICT DO NOTHING;

-- RLS for new tables
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_profile_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- system_settings: admin only
DROP POLICY IF EXISTS system_settings_admin_only ON public.system_settings;
CREATE POLICY system_settings_admin_only
  ON public.system_settings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'::user_role AND COALESCE(p.active, true) = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'::user_role AND COALESCE(p.active, true) = true
    )
  );

-- access_profiles + permissions: admin only
DROP POLICY IF EXISTS access_profiles_admin_only ON public.access_profiles;
CREATE POLICY access_profiles_admin_only
  ON public.access_profiles
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'::user_role AND COALESCE(p.active, true) = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'::user_role AND COALESCE(p.active, true) = true
    )
  );

DROP POLICY IF EXISTS permissions_admin_only ON public.permissions;
CREATE POLICY permissions_admin_only
  ON public.permissions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'::user_role AND COALESCE(p.active, true) = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'::user_role AND COALESCE(p.active, true) = true
    )
  );

DROP POLICY IF EXISTS access_profile_permissions_admin_only ON public.access_profile_permissions;
CREATE POLICY access_profile_permissions_admin_only
  ON public.access_profile_permissions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'::user_role AND COALESCE(p.active, true) = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'::user_role AND COALESCE(p.active, true) = true
    )
  );

-- audit_logs: admin read only
DROP POLICY IF EXISTS audit_logs_admin_read ON public.audit_logs;
CREATE POLICY audit_logs_admin_read
  ON public.audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'::user_role AND COALESCE(p.active, true) = true
    )
  );

COMMIT;

-- Archive old sync_auth_user_errors entries to sync_auth_user_errors_archive
-- Idempotent: cria tabela de archive se não existir e move entradas >30 dias

-- 1) Criar tabela de archive se ausente
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'sync_auth_user_errors_archive'
  ) THEN
    CREATE TABLE public.sync_auth_user_errors_archive (
      id bigint PRIMARY KEY,
      created_at timestamptz,
      error_text text,
      new_payload jsonb
    );
  END IF;
END$$;

-- 2) Inserir entradas antigas (>30 dias) na tabela de archive
WITH moved AS (
  SELECT * FROM public.sync_auth_user_errors WHERE created_at < NOW() - INTERVAL '30 days'
)
INSERT INTO public.sync_auth_user_errors_archive (id, created_at, error_text, new_payload)
SELECT id, created_at, error_text, new_payload FROM moved
ON CONFLICT (id) DO NOTHING;

-- 3) Deletar as entradas movidas da tabela original
DELETE FROM public.sync_auth_user_errors WHERE created_at < NOW() - INTERVAL '30 days';

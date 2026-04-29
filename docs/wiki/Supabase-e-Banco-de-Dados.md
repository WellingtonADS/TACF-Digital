# Supabase e Banco de Dados

## Integracao no frontend

O ponto unico de integracao com Supabase e `src/services/supabase.ts`.

Responsabilidades:

- inicializar cliente tipado com `Database`.
- validar variaveis de ambiente obrigatorias.
- expor wrappers de autenticacao e RPC.

## Estrutura de banco

Referencias principais:

- `supabase/schema.sql`
- `supabase/migrations/`
- `supabase/policies/`
- `supabase/rpc/`

Entidades relevantes no schema:

- `profiles`
- `sessions`
- `bookings`
- `swap_requests`
- `locations`
- `system_settings`
- `audit_logs`

## RPCs e regras de dominio

As regras de negocio devem priorizar RPCs SQL versionadas. Exemplo no frontend:

- `confirmarAgendamentoRPC` -> RPC `confirmar_agendamento`.

RPCs versionadas observadas na branch incluem endurecimentos de permissao e de status de sessao, refletindo modelo de seguranca orientado a backend.

## Checklist de alteracao de banco

1. Criar migration SQL idempotente e revisavel.
2. Validar impacto em RLS/policies.
3. Ajustar RPCs com contratos claros de entrada/saida.
4. Atualizar tipos e consumo no frontend somente apos consolidar regra no banco.

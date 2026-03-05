# Project Guidelines

## Code Style

- TypeScript com `strict`; evitar `any` e manter tipagem explícita.
- Componentes React funcionais com hooks; JSX runtime (sem `import React`).
- Reutilize padrões existentes antes de criar novos componentes/serviços (DRY/KISS/YAGNI).
- Use Tailwind e tokens já existentes; não introduza estilo fora do sistema visual atual.

## Architecture

- Frontend: Vite + React 18 + TypeScript.
- Rotas e guards centralizados em `src/main.tsx` com `ProtectedRoute`, `AdminRoute` e `UserRoute`.
- Integração Supabase centralizada em `src/services/supabase.ts`.
- Regras de domínio (reserva, confirmação, disponibilidade, quórum) ficam no banco via RPC em `supabase/rpc/`.
- Estrutura de banco em `supabase/migrations/` e políticas em `supabase/policies/rls.sql`.

## Build and Test

- Instalar dependências: `yarn`
- Desenvolvimento: `yarn dev`
- Build: `yarn build`
- Lint: `yarn lint`
- Preview: `yarn preview`
- Verificação de tipos: `npx tsc --noEmit`
- Banco: `yarn db:apply`, `yarn db:seed`, `yarn db:check`
- E2E: `yarn test:e2e` ou `yarn test:e2e:headed`
- Integração: `yarn test:integration`

## Project Conventions

- Antes de implementar, pesquise no `src/` e prefira extensão/refatoração de código existente.
- Não mover validações críticas para frontend; usar RPCs existentes ou criar RPC em `supabase/rpc/`.
- Não adicionar dependências fora do stack aprovado sem alinhamento do time.
- Não gerar testes automaticamente, a menos que seja solicitado explicitamente.

## Integration Points

- Cliente e helpers Supabase: `src/services/supabase.ts`.
- Fluxos de agendamento e sessões usam chamadas RPC (ex.: `book_session`, `confirmar_agendamento`).
- Scripts operacionais de banco em `scripts/db/`.
- Geração de PDF em `src/utils/pdf/generateCallList.ts`.

## Security

- Não expor segredos; usar variáveis de ambiente.
- Não alterar RLS, migrations ou schema sem revisão humana do coordenador (HACO).
- Não exibir dados sensíveis sem garantir que a política/RLS cobre o cenário.

## Agent Workflow

- Fluxo mínimo por mudança: implementar -> `yarn lint` -> `npx tsc --noEmit` -> validação funcional local.
- Em mudanças de banco, documentar impacto e solicitar revisão humana antes de merge.

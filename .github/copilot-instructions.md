# TACF Digital — Instruções para agentes (resumido)

Este arquivo orienta agentes de IA para trabalhar com o repositório TACF Digital.

## Code Style

- TypeScript `strict`; evite `any`. Exemplo: [src/services/supabase.ts](src/services/supabase.ts#L1-L40).
- Componentes React funcionais + hooks; JSX runtime (não importar `React`).
- Use `yarn` (não `npm`). Execute `yarn lint` para checar regras.

## Arquitetura (rápido)

- Frontend: Vite + React 18 + TypeScript.
- Backend/storage: Supabase (RLS, RPCs, migrations) em `supabase/`.
- UI organizada por domínio: `components/Admin`, `components/Booking`, `components/Calendar`.

## Build & Test (comandos)

- Instalar: `yarn`
- Rodar dev: `yarn dev`
- Build: `yarn build`
- Lint: `yarn lint`
- Unit tests: `yarn test` (Vitest)
- E2E: `yarn test:e2e` (Playwright)
- DB scripts: `yarn db:apply`

## Convenções de projeto (importante)

- Estado preferencialmente local; não introduza Redux/Context sem discussão.
- Não valide regras de domínio (capacidade, quórum, número de ordem) no frontend — essa lógica vive no Postgres/RPCs.
- Não adicione dependências fora do stack aprovado (React/TS/Vite/Tailwind/jsPDF/Supabase/Playwright/Vitest).

## Integrações e pontos de atenção

- Supabase client e helpers: `src/services/supabase.ts`.
- RPCs importantes: `supabase/rpc/` (ex.: `confirmar_agendamento.sql`, `book_session.sql`).
- PDF geração: `src/utils/pdf/generateCallList.ts` (usa `jspdf` + `autotable`).

## Segurança e limites operacionais

- Não alterar políticas RLS e esquema sem aprovação do coordenador (HACO).
- Dados sensíveis e privacidade: não exponha nomes/identificadores sem checar RLS.

## Como agentes devem trabalhar aqui

- Prefira usar/atualizar RPCs existentes em `supabase/rpc/` em vez de mover validações para o cliente.
- Para mudanças no banco (migrations/policies), peça revisão humana e documente no PR.
- Ao modificar comportamento de reservas ou regras de domínio, marque revisão do coordenador.

## Arquivos úteis

- `src/services/supabase.ts` — wrapper Supabase
- `src/utils/pdf/generateCallList.ts` — gerador de listas de chamada
- `supabase/migrations` e `supabase/policies/rls.sql`

## Skills recomendadas (agentes)

- `react-patterns` / `frontend-developer`: revisão e implementação de componentes React/TS (src/).
- `lint-and-validate`: checagem obrigatória após alterações (`yarn lint`, `npx tsc --noEmit`).
- `testing-patterns` + `unit-testing-test-generate`: escrever/atualizar testes unitários (Vitest).
- `e2e-testing-patterns`: criar/manter testes E2E com Playwright (`yarn test:e2e`).
- `database-migrations-sql-migrations` / `postgres-best-practices`: revisar migrations, RPCs e RLS (supabase/).
- `performance-engineer`: otimização de bundle, Core Web Vitals e profiling.
- `pdf-official`: manter geração/extração de PDFs (`src/utils/pdf/`).

Última atualização: 13 Feb 2026

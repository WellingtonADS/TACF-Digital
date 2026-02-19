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

### Rotas

- **Preview:** rotas de visualização sob `/preview/*`.
- **App:** aplicação principal sob `/app/*`.
- Use `React.lazy` + `Suspense` por rota e implemente prefetch on hover (prefetch do bundle/queries quando o usuário passa o mouse sobre links).

## Build & Test (comandos)

- Instalar: `yarn`
- Rodar dev: `yarn dev`
- Build: `yarn build`
- Lint: `yarn lint`
- Unit tests: `yarn test` (Vitest)
- E2E: `yarn test:e2e` (Playwright)
- E2E: Playwright removed in this branch; reintroduce via PR if needed
- DB scripts: `yarn db:apply`

> Observação: ao desenvolver localmente, garanta que o frontend aponte para o Supabase correto e que as variáveis de ambiente estejam configuradas para usar dados reais quando necessário.

## Convenções de projeto (importante)

- Estado preferencialmente local; não introduza Redux/Context sem discussão.
- Não valide regras de domínio (capacidade, quórum, número de ordem) no frontend — essa lógica vive no Postgres/RPCs.
- Não adicione dependências fora do stack aprovado. Pilha aprovada: React, TypeScript, Vite, Tailwind, Sonner (notificações), jsPDF (+autotable), `react-qr-code`, Supabase, Vitest.
- Ao implementar geração de PDF/QR, prefira utilitários existentes: `src/utils/pdf/generateCallList.ts` e componentes como `src/pages/DigitalTicket.tsx`.

## Integrações e pontos de atenção

- Supabase client e helpers: `src/services/supabase.ts`.
- RPCs importantes: `supabase/rpc/` (ex.: `confirmar_agendamento.sql`, `book_session.sql`).
- PDF geração: `src/utils/pdf/generateCallList.ts` (usa `jspdf` + `autotable`).

- UI e conexão com dados reais: ao refatorar interfaces, garanta que as chamadas do frontend usem `src/services/supabase.ts` e que hooks como `useSessions` / `useBooking` consumam RPCs existentes em `supabase/rpc/`.
- Lógica crítica (quórum, validações, regras de reserva) deve ficar exclusivamente no banco via RPCs/migrations — **não** mova essas validações para o frontend.

## Segurança e limites operacionais

- Não alterar políticas RLS e esquema sem aprovação do coordenador (HACO).
- Dados sensíveis e privacidade: não exponha nomes/identificadores sem checar RLS.

## Como agentes devem trabalhar aqui

- Prefira usar/atualizar RPCs existentes em `supabase/rpc/` em vez de mover validações para o cliente.
- Para mudanças no banco (migrations/policies), abra issue, documente a mudança e peça revisão humana.
- Ao refatorar UI para usar dados reais: valide `env` locais, atualize `src/services/supabase.ts` se necessário e escreva testes unitários que mockem esse wrapper.
- Para rota/Bundle splitting: adicione lazy-loading por rota e escreva testes básicos para garantir fallback UI visível durante carregamento.

## Arquivos úteis

- `src/services/supabase.ts` — wrapper Supabase
- `src/utils/pdf/generateCallList.ts` — gerador de listas de chamada
- `src/pages/DigitalTicket.tsx` — exemplo de PDF/QR
- `supabase/migrations` e `supabase/policies/rls.sql`

## Skills recomendadas (agentes)

- `react-patterns` / `frontend-developer`: revisão e implementação de componentes React/TS (src/).
- `lint-and-validate`: checagem obrigatória após alterações (`yarn lint`, `npx tsc --noEmit`).
- `testing-patterns` + `unit-testing-test-generate`: escrever/atualizar testes unitários (Vitest).
- `e2e-testing-patterns`: criar/manter testes E2E com Playwright (`yarn test:e2e`).
- `database-migrations-sql-migrations` / `postgres-best-practices`: revisar migrations, RPCs e RLS (supabase/).
- `pdf-official`: manter geração/extração de PDFs (`src/utils/pdf/`).

Última atualização: 19 Feb 2026

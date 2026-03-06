# Project Guidelines

## Objetivo do projeto

O TACF Digital é uma plataforma de agendamento e gestão de sessões voltada para o ambiente militar. O foco é permitir que usuários reservem, confirmem e administrem sessões com regras de quórum, capacidade e cronograma controladas pelo banco de dados. Os agentes devem manter esse propósito em mente ao modificar ou estender o código: a interface é apenas uma camada de apresentação, toda regra de negócio importante vive em RPCs/migrations no Supabase.

## Estrutura de arquivos e prioridades

Para evitar dispersão de código, siga a hierarquia abaixo sempre que adicionar ou alterar arquivos:

1. **`src/pages/`** – cada rota principal tem sua própria página; componentes específicos de página devem ficar aqui.
2. **`src/components/`** – UI reutilizável agrupada por domínio (`Admin`, `Booking`, `Calendar`, etc.). Antes de criar uma nova pasta, verifique se ela já se encaixa em uma das categorias existentes.
3. **`src/hooks/`** – hooks customizados que encapsulam lógica de dados ou comportamento compartilhado (por ex. `useBooking`, `useSessions`).
4. **`src/services/`** – wrappers e clientes externos (Sobresupabase, API, etc.). Evite criar serviços para lógica que pertence ao banco de dados; use RPCs.
5. **`src/utils/`** – funções utilitárias e geradores (ex.: PDF, formatação de datas). Use quando o código não se encaixa em componentes, hooks ou serviços.
6. **`supabase/`** – migrations, políticas e RPCs; toda lógica de domínio deve ser colocada aqui, não no frontend.

> 🔁 Ao adicionar arquivos, primeiro verifique se algo existente pode ser reaproveitado para manter o repositório organizado.

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

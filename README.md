# TACF-Digital

Plataforma institucional para gestao de agendamentos e listas de chamada do Teste de Avaliacao de Condicionamento Fisico (TACF), voltada ao contexto operacional do Hospital da Aeronautica de Canoas (HACO).

## Visao Geral

O TACF-Digital apoia a operacao administrativa e a execucao do TACF com padronizacao, rastreabilidade e eficiencia. Regras criticas de dominio permanecem no backend (Supabase/Postgres), com politicas de seguranca e controle de acesso via RLS/RPC.

## Stack

- React 18
- TypeScript (strict)
- Vite
- Tailwind CSS
- Supabase (Auth, Postgres, RLS, RPC)
- jsPDF + jspdf-autotable
- Yarn
- ESLint

## Arquitetura

- Frontend em `src/` com organizacao por dominio.
- Integracao com Supabase centralizada em `src/services/supabase.ts`.
- Regras de negocio sensiveis no banco, preferencialmente em `supabase/rpc/`.
- Schema e evolucao de banco em `supabase/migrations/`.
- Politicas de seguranca em `supabase/policies/rls.sql`.

## Estrutura Principal

- `src/components/`: componentes reutilizaveis e por dominio.
- `src/containers/`: composicao de fluxos e telas.
- `src/hooks/`: hooks de estado e integracao.
- `src/layout/`: estrutura visual e navegacao.
- `src/pages/`: paginas e rotas.
- `src/services/`: integracoes com API/Supabase.
- `src/utils/`: utilitarios (ex.: PDF).
- `supabase/`: migrations, policies e RPCs.
- `scripts/db/`: scripts operacionais de banco.
- `docs/`: documentacao funcional e operacional.

## Comandos

```bash
yarn
yarn dev
yarn lint
npx tsc --noEmit
yarn build
yarn preview
```

## Banco de Dados

```bash
yarn db:apply
yarn db:seed
yarn db:check
```

## Testes

```bash
yarn test:integration
yarn test:e2e
yarn test:e2e:headed
```

## Licenca

Este projeto esta licenciado sob os termos da licenca MIT. Consulte [LICENSE](./LICENSE).

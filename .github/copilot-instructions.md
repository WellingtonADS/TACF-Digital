Sempre evite resposta longas na janela de contexto, use documentos MarkDown, txt, csv, etc..

```instructions
# TACF Digital — Instruções para agentes (resumido)

Este arquivo orienta agentes de IA para trabalhar com o repositório TACF Digital.

Planejar a criação/refatoração mantendo as conexões do projeto com o banco de dados, pesquise o que já existe em src, só gere algo novo se for extremamente preciso. não gerar testes sem ser solicitado. Sempre com refinamento visual final para aproximar ainda mais do conceito do projeto
D:\Users\well\Projetos\Desenvolvimento\tacf-digital\docs\ContextRotaAdmin.md
D:\Users\well\Projetos\Desenvolvimento\tacf-digital\docs\ContextRotaUser.md


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
- E2E: Playwright removed in this branch; reintroduce via PR if needed
- DB scripts: `yarn db:apply`

## Convenções de projeto (importante)

- Estado preferencialmente local; não introduza Redux/Context sem discussão.
- Não valide regras de domínio (capacidade, quórum, número de ordem) no frontend — essa lógica vive no Postgres/RPCs.
- Não adicione dependências fora do stack aprovado (React/TS/Vite/Tailwind/jsPDF/Supabase/Playwright/Vitest).
- Não adicione dependências fora do stack aprovado (React/TS/Vite/Tailwind/jsPDF/Supabase/Vitest). Playwright é opcional e removido nesta branch.

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

## Atualizações e orientações adicionais (2026-02-19)

- Rotas e organização:
  - Considere separar rotas públicas de `preview` e rotas da aplicação principal:
    - `/preview/*` → views estáticas/preview (carregamento otimizado, menos dados sensíveis).
    - `/app/*` → aplicação principal (autenticação, dados reais via Supabase).
  - Mantenha convenção de pastas e lazy-loading por rota para reduzir bundle inicial.

- Lazy-loading por rota:
  - Use `React.lazy` + `Suspense` para carregar componentes por rota em `src/pages`.
  - Exemplo: carregar páginas com `const Page = React.lazy(() => import('./pages/XYZ'))`.
  - Forneça um `fallback` leve em `Suspense` (skeleton/loader) para experiência imediata.

- Prefetch on hover / prefetching:
  - Prefetch assets e módulos ao detectar hover em links importantes (ex.: `onMouseEnter`).
  - Prefetch de dados pode ser feito com chamadas Supabase leves ou estratégias de cache.
  - Evite prefetch agressivo que aumente uso de API/limites; prefira prefetch condicional.

- Uso de Supabase para dados reais:
  - Use `src/services/supabase.ts` como única fonte para consultas e mutações.
  - Prefira RPCs em `supabase/rpc/` para regras de domínio complexas e validações server-side.
  - Nunca mover regras de domínio críticas para o frontend; mantenha a lógica no banco/RPCs.
  - Ao introduzir integração com dados reais, execute `yarn lint` e `npx tsc --noEmit` antes de abrir PR.

- Geração de PDF / QR:
  - PDFs devem ser gerados usando os utilitários existentes (`src/utils/pdf/generateCallList.ts`).
  - Para QR codes em PDFs, prefira gerar imagens vetoriais/PNG no backend ou usar libs aprovadas no frontend (`jspdf` + plugin compatível).
  - Documente qualquer alteração na geração de PDF/QR em um arquivo de migração/README e inclua testes unitários.

- Revisões e changes no banco de dados:
  - Qualquer mudança em `supabase/migrations` ou `supabase/policies` exige revisão do coordenador (HACO).
  - Ao criar migrations, documente o impacto e adicione testes/instruções de rollback no PR.

- Observações gerais:
  - Não introduzir validações de domínio no frontend; o frontend é apenas uma camada de apresentação.
  - Para mudanças de infra/docs, adicione labels apropriadas (`docs`, `infra`) e descreva as etapas de verificação no corpo do PR.

```

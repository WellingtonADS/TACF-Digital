# Diretrizes do Projeto para Agentes AI

## 🎯 Objetivo do Projeto

Frontend em React + Supabase para gerenciamento de agendamentos e listas de chamada (ex.: convocações/turnos), com geração de PDFs e regras de domínio aplicadas via RPCs/Postgres.

## 🛠 Tech Stack & Padrões

- **Linguagem:** TypeScript (strict)
- **Frameworks:** React 18 (Vite), Tailwind CSS, Supabase (Postgres + Auth)
- **Testes:** Vitest (unit), Playwright (E2E)
- **Build/cli:** Yarn, Vite
- **Estilo/arquitetura:** Componentes funcionais e hooks, JSX runtime (não importar `React`), estado preferencialmente local, evitar `any`.

## rules Regras de Ouro

1. **Seja Conciso:** respostas e commits curtos; priorize código claro sobre longas explicações.
2. **Segurança:** nunca exponha chaves/segredos; não hardcode credenciais. Use variáveis de ambiente (`.env`).
3. **Tipagem:** mantenha `strict` em TypeScript; evite `any` — prefira tipos explícitos e generics quando necessário.
4. **Documentação:** adicione JSDoc/Docstrings somente para funções complexas ou regras de negócio importantes.
5. **Banco de Dados / RLS:** não altere `supabase/` (schemas, policies, migrations) sem aprovação humana do coordenador; regras de domínio devem residir no backend (RPCs).
6. **Validações:** prefira criar/usar RPCs em `supabase/rpc/` ao invés de mover validações críticas para o cliente.

## 🧪 Estratégia de Testes

- Todo código novo deve incluir testes unitários (Vitest). Cobertura mínima para funcionalidades novas.
- Use factories e helpers de teste (mocks) para dependências externas (`src/services/supabase.ts` deve ser mockado em testes unitários).
- Cenários críticos (fluxos de reserva, emissão de comprovantes, geração de PDFs) devem ter testes E2E com Playwright.
- Execute linters e tipos antes de abrir PR: `yarn lint` e `npx tsc --noEmit`.

## Integrações e pontos de atenção

- Supabase client e helpers em `src/services/supabase.ts` — revise antes de alterar.
- Lógica de reserva e quórum vive em RPCs (`supabase/rpc/`) e migrations (`supabase/migrations`).
- Geração de PDF: `src/utils/pdf/generateCallList.ts` usa `jspdf` + `autotable`.

## Fluxo de trabalho para agentes

1. Fazer mudanças locais e rodar: `yarn && yarn lint && npx tsc --noEmit && yarn test`.
2. Para alterações no DB: abrir issue, descrever migração, criar migration em `supabase/migrations/` e pedir revisão humana.
3. Não incluir dependências fora do stack aprovado sem consentimento do time.

## Contatos e revisão humana

- Alterações que toquem RLS, políticas de privacidade, ou regras de domínio: solicitar revisão do coordenador (HACO) antes de merge.



# TACF-Digital

Sistema de gerenciamento de agendamentos e listas de chamada para o Teste de Avaliação de Condicionamento Físico (TACF) do Hospital da Aeronáutica de Canoas (HACO).

## 🎯 Sobre o Projeto

O TACF Digital é uma aplicação web moderna desenvolvida para automatizar e otimizar o processo de agendamento de testes de condicionamento físico, incluindo:

- Agendamento de sessões de teste
- Gestão de capacidade e quórum
- Geração automática de listas de chamada em PDF
- Sistema de permuta entre usuários
- Emissão de comprovantes e tickets
- Painel administrativo completo

## 🛠 Stack Tecnológico

### Frontend

- **React 18** - Biblioteca UI
- **TypeScript** (strict mode) - Tipagem estática
- **Vite** - Build tool e dev server

````bash
# Build
yarn test:ui         # UI do Vitest

yarn test


# Com coverage

### Testes E2E (Playwright)

yarn test:e2e
## 📝 Convenções e Padrões

- Prefira interfaces para objetos públicos
- Estado preferencialmente local
### Estilo de Código
- Um componente por arquivo
## 🤝 Contribuindo
1. Faça um fork do projeto
# TACF-Digital

Gerenciador de agendamentos e listas de chamada para o Teste de Avaliação de Condicionamento Físico (TACF) — HACO.

## **Visão geral**

Aplicação web para: agendar sessões, gerenciar capacidade/quórum, gerar listas de chamada em PDF, permitir permutas entre usuários e fornecer um painel administrativo completo.

## **Tecnologias principais**

- Frontend: React 18 + TypeScript (strict), Vite, Tailwind CSS
- PDFs: jsPDF + autotable
- Backend: Supabase (Postgres, Auth, Realtime, RLS)
- Testes: Vitest (unit) e Playwright (E2E)
- Ferramentas: Yarn, ESLint, TypeScript

## **Estrutura do repositório (resumo)**

- `src/` — código React (components, pages, hooks, services, utils)
- `supabase/` — migrations, policies, RPCs e schema
- `e2e/` — testes end-to-end
- `docs/` — documentação e instruções

## **Como começar (rápido)**

1. Instalar dependências:

```bash
yarn
````

2. Copiar variáveis de ambiente e ajustar credenciais do Supabase:

```bash
cp .env.example .env
# editar .env
```

3. Rodar em desenvolvimento:

```bash
yarn dev
# abrir http://localhost:5173
```

## **Scripts úteis**

- `yarn dev` — dev server
- `yarn build` / `yarn preview` — build e preview
- `yarn lint` — ESLint
- `yarn type-check` — `npx tsc --noEmit`
- `yarn test` — Vitest
- `yarn test:e2e` — Playwright
- `yarn db:apply` — aplicar migrações Supabase

## **Boas práticas e convenções**

- TypeScript em `strict` — evite `any` e prefira tipos explícitos
- Componentes funcionais + hooks; JSX runtime (não importar `React` globalmente)
- Estado preferencialmente local; evite introduzir Redux/Context sem necessidade
- Regras de negócio críticas (capacidade, quórum, permissões) devem ficar no banco/RPCs (`supabase/rpc/`)

## **Banco de dados**

- Crie migrations em `supabase/migrations/` com nome `YYYYMMDD_descricao.sql`
- RPCs importantes: `book_session.sql`, `confirmar_agendamento.sql`, `approve_swap.sql`, `get_sessions_availability.sql`
- Não altere políticas RLS sem aprovação do coordenador do projeto

## **Testes**

- Unitários: `yarn test` (Vitest)
- E2E: `yarn test:e2e` (Playwright)
- Antes de abrir PR: `yarn lint && npx tsc --noEmit && yarn test`

## **Segurança**

- Nunca commite chaves ou credenciais; use `.env`
- Respeite RLS e privacidade de dados; validações sensíveis no backend

## **Contribuindo**

1. Fork → branch (`feature/..`) → commits claros → PR
2. Execute checks locais antes de submeter: lint, type-check, testes

## **Documentação e arquivos úteis**

- `src/services/supabase.ts` — cliente Supabase
- `src/utils/pdf/generateCallList.ts` — gerador de listas em PDF
- `supabase/rpc/` — stored procedures importantes
- `docs/` e `AGENTS.md` — instruções de agente e processos

---

Última atualização: 13 de fevereiro de 2026

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](./LICENSE) para mais detalhes.

## 👥 Contato

Projeto desenvolvido para o Hospital da Aeronáutica de Canoas (HACO).

---

**Última atualização:** 16 de fevereiro de 2026

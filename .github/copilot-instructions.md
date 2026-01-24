# TACF Digital — Copilot Instructions (resumido e prático)

Este documento reúne regras e conhecimento prático para agentes de IA trabalharem neste repositório.

- **Arquitetura (visão geral):** cliente React (Vite, React 18, TypeScript strict) + Supabase (auth, RLS, RPCs). UI é dividida em componentes por domínio: `components/Admin`, `components/Booking`, `components/Calendar`, `components/Layout`. O servidor DB vive em `supabase/` (migrations, policies, rpc).

- **Fluxos de dados importantes:** autenticação e leitura/escrita via `src/services/supabase.ts` (ex.: `confirmarAgendamentoRPC()` chama RPC `confirmar_agendamento` — NOTE: NUNCA valide vagas no frontend). Geração de PDF de chamada em `src/utils/pdf/generateCallList.ts` (usa `jspdf` + `autotable`).

- **Comandos e workflows de desenvolvedor:** use Yarn (não npm). Scripts principais em `package.json`:
	- `yarn dev` — roda Vite em dev.
	- `yarn build` — `tsc -b` então `vite build`.
	- `yarn lint` — rodar ESLint.
	- `yarn preview` — pré-visualizar build.
	- `yarn test` — Vitest unitário.
	- `yarn test:e2e` — Playwright E2E.
	- `yarn db:apply` — aplicar scripts DB em `scripts/apply-db-scripts.ts`.

- **Padrões e convenções específicas do projeto:**
	- Projeto usa **Yarn** exclusivamente; não adicione lockfiles alternativos.
	- Typescript strict: todos os novos arquivos `.ts/.tsx` devem ter tipos explícitos (evite `any`).
	- Componentes funcionais + hooks. Estado preferencialmente local; não introduza Redux/Context sem discussão.
	- JSX runtime (não importar `React` explicitamente).
	- Remova variáveis/params não usados (ESLint ativo).

- **Regras de domínio (não-negociáveis):** shift-only (turno Manhã/Tarde); sessão capacidade 8–21; usuário não pode auto-swap; usuário só vê sua própria reserva; coordenador vê lista completa; máximo 1 reserva ativa por semestre. Essas regras são aplicadas via RPCs/RLS — mudanças exigem coordenação.

- **Integrações e pontos de atenção:**
	- Supabase client: `src/services/supabase.ts` — checa `import.meta.env.VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` e exporta `supabase` e helpers RPC.
	- Migrations e políticas: `supabase/migrations` e `supabase/policies/rls.sql`.
	- PDFs: `src/utils/pdf/generateCallList.ts` (nome do arquivo de saída: `Lista_Chamada_DDMMYYYY_TURNO.pdf`).

- **Arquivos exemplares a consultar:**
	- Supabase wrapper: [src/services/supabase.ts](src/services/supabase.ts#L1-L40)
	- Gerador de PDF: [src/utils/pdf/generateCallList.ts](src/utils/pdf/generateCallList.ts#L1-L120)
	- Entrypoint: [src/main.tsx](src/main.tsx#L1-L40)
	- Migrations: [supabase/migrations](supabase/migrations)

- **Testes e CI:** unit tests com Vitest (`vitest.config.ts`), E2E com Playwright (`e2e/` + `playwright.config.ts`). CI usa as mesmas scripts; ver `.github/workflows/playwright.yml`.

- **O que NÃO mudar sem revisão:**
	- Esquema e políticas RLS no diretório `supabase/` (alterações exigem aprovação do coordenador HACO).
	- Validações de quórum / geração do Número de Ordem (YYYY-S-XXXX) — toda lógica deve residir no backend (Postgres / RPCs). Não implementar esta lógica no cliente.
	- Mudanças que afetam privacidade (ex.: mostrar nomes em calendário).
	- Adicionar dependências fora do stack especificado (React/TS/Vite/Tailwind/jsPDF/Supabase/Playwright/Vitest).

- **Boas práticas operacionais para agentes:**
	- Prefira ajustar/usar RPCs existentes em `supabase/rpc/` em vez de adicionar lógica complexa no cliente.
	- Para gerar listas de chamada, use a função em `src/utils/pdf/generateCallList.ts` para manter nome e ordenação esperadas.
	- Ao adicionar componentes administrativos (ex.: `AdminSessionManager`), valide UX e privacidade; ver `components/Admin`.

- **Ambiente local:** crie `.env.local` com `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` (consulte `src/services/supabase.ts` erro de validação).

Última atualização: 24 Jan 2026

# Documentacao Tecnica - TACF Digital

## 1. Resumo Executivo

O TACF Digital e uma aplicacao web para agendamento, confirmacao e gestao de sessoes do TACF no contexto militar. A solucao utiliza React + TypeScript no frontend e Supabase (Auth, Postgres, RLS e RPC) no backend.

Principio central do projeto:

- regras de dominio sensiveis (quorum, capacidade, politicas de acesso e validacoes de agendamento) devem permanecer no banco via RPC/migrations;
- o frontend atua como camada de experiencia e orquestracao.

## 2. Stack Tecnologica

Camada de aplicacao:

- React 18
- TypeScript (strict)
- Vite
- React Router
- Tailwind CSS
- Sonner

Camada de dados e autenticacao:

- Supabase JS
- PostgreSQL (schema, migrations, policies, RPC)

Qualidade e tooling:

- ESLint
- Vitest
- TypeScript compiler (`tsc -b` no build)

Scripts de referencia (package.json):

- `yarn dev`
- `yarn lint`
- `yarn build`
- `yarn preview`
- `yarn test:integration`
- `yarn db:check`

## 3. Estrutura Tecnica do Repositorio

- `src/main.tsx`: bootstrap da app, roteamento global, lazy loading e toaster.
- `src/router/routeRegistry.ts`: registro central de rotas, metadados de acesso e sidebar.
- `src/router/routeAccess.ts`: regras de autorizacao por papel e modulos permitidos.
- `src/hooks/useAuth.ts`: sessao/autenticacao, carregamento de perfil e cache em sessionStorage.
- `src/hooks/useSessions.ts`: consulta e composicao de disponibilidade de sessoes.
- `src/services/supabase.ts`: cliente Supabase central e helpers de auth/RPC.
- `supabase/schema.sql`: base de schema e tipos do banco.
- `supabase/migrations`, `supabase/policies`, `supabase/rpc`: evolucao e regras de dominio no banco.

## 4. Arquitetura de Frontend

### 4.1 Bootstrap e Roteamento

A aplicacao inicia em `src/main.tsx` com:

- `BrowserRouter` para navegacao;
- `Suspense` por rota com fallback de carregamento;
- wrappers de acesso por papel (`ProtectedRoute`, `AdminRoute`, `UserRoute`);
- prefetch de rotas criticas (`prefetchCriticalRoutes`) em ambiente browser.

O registro das rotas de aplicacao e centralizado em `src/router/routeRegistry.ts`, contendo:

- caminho (`path`);
- nivel de acesso (`user`, `admin`, `authenticated`);
- configuracao de sidebar;
- flags de prefetch;
- `lazyLoader` para code splitting por pagina.

### 4.2 Controle de Acesso

`src/router/routeAccess.ts` define:

- papeis administrativos (`admin`, `coordinator`);
- modulos permitidos para coordenador via metadata (`access_modules`);
- permissoes finas de sessao (`create_session`, `duplicate_session`, `cancel_session`);
- fallback seguro para home (`/app`) quando nao houver modulos administrativos validos.

### 4.3 Gerenciamento de Estado

Padrao predominante:

- estado local por pagina/componente;
- hooks para encapsular acesso a dados e fluxos de dominio;
- sem store global centralizada.

## 5. Autenticacao e Perfil

`src/hooks/useAuth.ts` implementa:

- bootstrap por `supabase.auth.getSession()` com timeout defensivo;
- assinatura de `onAuthStateChange` para sincronizacao de sessao;
- busca de perfil em `public.profiles` com cache de requisicao em memoria;
- persistencia de perfil em `sessionStorage` para reduzir flicker de UI;
- fallback de desenvolvimento para perfil de teste quando aplicavel.

Pontos de robustez:

- tratamento explicito para refresh token invalido;
- limpeza de estado local de auth;
- separacao entre carregamento inicial e sincronizacao por evento.

## 6. Camada de Dados e Dominio

### 6.1 Cliente Supabase

`src/services/supabase.ts` concentra:

- criacao do client tipado (`Database`);
- validacao de variaveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`;
- helpers de auth (`signIn`, `signUp`), perfil (`upsertProfile`) e acesso generico a tabela.

### 6.2 RPCs e Operacoes de Negocio

Exemplo implementado:

- `confirmarAgendamentoRPC` encapsula chamada `confirmar_agendamento` e normaliza resposta para o frontend.

Diretriz arquitetural:

- manter logica de negocio sensivel no banco (RPC/migrations), evitando duplicacao de regras criticas no cliente.

### 6.3 Disponibilidade de Sessoes

`src/hooks/useSessions.ts` compoe disponibilidade a partir de:

- leitura de `sessions` em intervalo de datas;
- agregacao de `bookings` por sessao (desconsiderando `cancelado`);
- calculo de ocupacao/disponibilidade no cliente para renderizacao.

## 7. Modelo de Banco (Visao Macro)

`supabase/schema.sql` define, entre outros:

- enums de papel, periodo, status de sessao, status de booking e afins;
- `profiles` (extensao de `auth.users`);
- `sessions`, `bookings`, `swap_requests`, `locations`, `system_settings`, `audit_logs`.

Observacao:

- o schema base deve ser lido em conjunto com `supabase/migrations`, que representam o estado evolutivo real aplicado no ambiente.

## 8. Seguranca e Governanca

Controles previstos na arquitetura:

- autenticacao Supabase + perfil interno;
- autorizacao por papel e modulos (incluindo coordenador com escopo restrito);
- isolamento de regras criticas no banco;
- trilhas e auditoria suportadas por estruturas no schema.

Boas praticas para manutencao:

- evitar expor dados sensiveis em camadas sem RLS validado;
- nao mover validacoes de capacidade/quorum para o frontend;
- revisar sempre impacto de migrations/policies antes de merge.

## 9. Build, Validacao e Testes

Fluxo recomendado:

1. `yarn lint`
2. `npx tsc --noEmit` (quando aplicavel na esteira local)
3. `yarn build`
4. `yarn test:integration`

Validacao de estrutura SQL:

- `yarn db:check` valida existencia de SQL em `supabase/migrations`, `supabase/rpc` e `supabase/policies`.

## 10. Limitacoes Conhecidas (Branch Atual)

- `db:apply` e `db:seed` estao definidos em `package.json`, mas dependem de `scripts/db/applyMigrations.cjs`, ausente no workspace desta branch.
- a pasta `docs/` estava sem documentacao tecnica estruturada; este arquivo formaliza a base tecnica atual.

## 11. Onboarding Tecnico Rapido

1. Instalar dependencias: `yarn`
2. Configurar `.env` com credenciais Supabase
3. Rodar aplicacao: `yarn dev`
4. Validar qualidade: `yarn lint` e `yarn test:integration`
5. Ler os pontos de entrada tecnicos:
   - `src/main.tsx`
   - `src/router/routeRegistry.ts`
   - `src/router/routeAccess.ts`
   - `src/hooks/useAuth.ts`
   - `src/services/supabase.ts`

## 12. Wiki Tecnica (Capitulos)

Para navegacao por topicos, consulte tambem as paginas em `docs/wiki/`:

- `docs/wiki/Home.md`
- `docs/wiki/Arquitetura-Geral.md`
- `docs/wiki/Rotas-e-Controle-de-Acesso.md`
- `docs/wiki/Supabase-e-Banco-de-Dados.md`
- `docs/wiki/Servicos-e-Hooks.md`
- `docs/wiki/Operacao-Build-e-Qualidade.md`

---

Documento gerado a partir do estado atual da branch em 29/04/2026.

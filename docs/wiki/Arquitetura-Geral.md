# Arquitetura Geral

## Visao de alto nivel

O TACF Digital e uma aplicacao web com frontend SPA e backend Supabase.

- Frontend: React 18 + TypeScript + Vite.
- Backend gerenciado: Supabase (Auth + Postgres + RLS + RPC).
- Dominio: agendamento, confirmacao e administracao de sessoes TACF.

## Componentes centrais

- `src/main.tsx`: bootstrap, providers e composicao das rotas.
- `src/router/routeRegistry.ts`: catalogo de rotas e metadados.
- `src/router/routeAccess.ts`: regras de autorizacao por papel e metadata.
- `src/hooks/useAuth.ts`: sessao, perfil e sincronizacao de autenticacao.
- `src/services/supabase.ts`: cliente Supabase e wrappers principais.

## Principios arquiteturais

- Regra de negocio sensivel no banco (RPC/migrations), nao no cliente.
- Frontend orientado a UX e orquestracao de fluxo.
- Controle de acesso em duas camadas:
  - guardas de rota no frontend;
  - restricoes de dados e operacoes no backend via RLS/RPC.

## Navegacao e rendering

- Rotas com `React.lazy` + `Suspense` para carregamento sob demanda.
- Prefetch seletivo de rotas criticas para reduzir latencia percebida.
- Guardas por perfil para rotas autenticadas, administrativas e de usuario final.

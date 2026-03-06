# Diagnóstico DRY Unificado - Rotas Admin e Usuario

## Objetivo

Consolidar, em um unico documento, os problemas de DRY (Don't Repeat Yourself) das rotas dos perfis Administrador e Usuario, com base em:

- `docs/ContextRotaAdmin.md`
- `docs/ContextRotaUser.md`
- Implementacao atual em `src/`

## Escopo e evidencias avaliadas

- Definicao de rotas: `src/main.tsx`
- Navegacao lateral (admin e usuario): `src/components/layout/Sidebar.tsx`
- Prefetch de rotas: `src/utils/prefetchRoutes.ts`
- Guardas e redirecionamento: `src/components/AdminRoute.tsx`, `src/components/UserRoute.tsx`, `src/components/ProtectedRoute.tsx`, `src/components/AutoRedirect.tsx`

## Achados transversais (Admin + Usuario)

### 1. Fonte de verdade de rotas fragmentada (problema DRY principal)

O catalogo de rotas esta repetido em camadas diferentes:

- roteamento: `src/main.tsx`
- sidebar: `src/components/layout/Sidebar.tsx`
- prefetch: `src/utils/prefetchRoutes.ts`

Impacto:

- Maior risco de inconsistencias funcionais e de UX.
- Mudancas de rota exigem sincronizacao manual em varios arquivos.
- O contrato dos docs de contexto nao se traduz em uma fonte unica no codigo.

### 2. Politica de autorizacao repetida em multiplos guards

A regra de papeis admin/coordinator esta duplicada em componentes diferentes:

- `src/components/AdminRoute.tsx`
- `src/components/UserRoute.tsx`
- `src/components/AutoRedirect.tsx`

Impacto:

- Alteracoes de autorizacao podem gerar comportamentos divergentes.
- A regra de acesso nao esta centralizada em uma unica politica reutilizavel.

### 3. Estado `forbidden` documentado, mas sem implementacao padronizada

Ambos os contextos (admin e usuario) preveem estado de tela `forbidden`. Na implementacao, o fluxo principal e redirecionamento silencioso com `Navigate`, sem tela unificada de acesso negado.

Impacto:

- Contrato funcional dos documentos nao esta representado de forma explicita no frontend.
- Tendencia a solucoes locais e repetitivas no futuro.

### 4. Cobertura de prefetch parcial e paralela ao mapa de rotas

`src/utils/prefetchRoutes.ts` replica paths e imports que ja existem no `React.lazy` em `src/main.tsx`.

Impacto:

- Duplicacao de manutencao.
- Risco de rotas existirem no roteador, mas sem cobertura de prefetch (ou vice-versa).

## Achados especificos - Perfil Administrador

### A1. Rotas administrativas relevantes do contexto nao estao refletidas no menu

No contexto admin, rotas como abaixo sao parte da jornada funcional:

- `/app/reagendamentos/notificacao`
- `/app/configuracoes/perfis`
- `/app/om/:id`
- `/app/om/:id/schedules`

Essas rotas existem no roteador (`src/main.tsx`), mas nao no `adminNav` em `src/components/layout/Sidebar.tsx`.

Impacto:

- Navegacao fica incompleta para o operador.
- A matriz de navegacao do contexto admin nao fica plenamente representada na UI.

### A2. Prefetch admin tambem nao cobre todo o mapa funcional

O prefetch inclui parte do escopo admin, mas nao cobre todas as rotas relevantes do contexto (ex.: notificacao de reagendamento e perfis de acesso).

Impacto:

- Inconsistencia de experiencia e performance entre fluxos da mesma area.

## Achados especificos - Perfil Usuario

### U1. Divergencia de rota canonica de dashboard (`/app/dashboard` vs `/app`)

No contexto de usuario, a rota de entrada e descrita como `/app/dashboard`. No codigo:

- Sidebar usa `/app` como dashboard: `src/components/layout/Sidebar.tsx:23`
- Prefetch usa `/app` para dashboard: `src/utils/prefetchRoutes.ts:4`
- Roteador usa fallback `/app/*`: `src/main.tsx:362`

Impacto:

- Contrato funcional e implementacao divergem sobre rota canonica.
- Aumenta o risco de ajustes futuros quebrarem breadcrumbs, links e analytics.

### U2. Contrato de guardas do contexto difere da composicao real

O contexto do usuario cita `ProtectedRoute` para todo `/app/*`, mas no roteador as rotas principais usam `UserRoute`/`AdminRoute` diretamente e o wildcard tambem esta em `UserRoute`.

Impacto:

- O modelo de seguranca existe, mas nao com a mesma arquitetura descrita no documento.
- Isso dificulta manutencao documental e pode gerar interpretacoes diferentes no time.

### U3. Rota de recurso existe no roteador, mas sem prefetch dedicado

- Rota existe em `src/main.tsx:140`
- Existem links diretos a partir de resultados: `src/pages/ResultsHistory.tsx:391` e `src/pages/ResultsHistory.tsx:492`
- Nao ha entrada explicita em `src/utils/prefetchRoutes.ts`

Impacto:

- Fluxo de excecao operacional tem menor preparacao de bundle em comparacao a outras rotas principais.

## Priorizacao consolidada

1. Critico: unificar catalogo de rotas/metadata (router + sidebar + prefetch).
2. Alto: centralizar politica de autorizacao e redirecionamento por papel.
3. Alto: alinhar rota canonica de dashboard do usuario (`/app/dashboard` ou `/app`) e atualizar documentos/codigo de forma consistente.
4. Medio: padronizar estado `forbidden` com componente unico.
5. Medio: fechar lacunas de cobertura de prefetch nas rotas de contexto.

## Recomendacao de consolidacao DRY (alvo unico)

### 1. Route Registry unico

Criar uma estrutura unica de metadados de rota com:

- `path`
- `lazyLoader`
- `access` (`user`, `admin`, `authenticated`)
- `showInSidebar`
- `prefetch` (boolean ou prioridade)
- `section` (dashboard, agendamento, efetivo, governanca etc.)

Consumidores:

- `src/main.tsx` monta `Route`
- `src/components/layout/Sidebar.tsx` renderiza menu
- `src/utils/prefetchRoutes.ts` deriva loaders e criticas

### 2. Politica de acesso unica

Extrair helpers compartilhados, por exemplo:

- `isAdminLike(role)`
- `canAccessRoute(role, access)`
- `getDefaultHomeByRole(role)`

Aplicar em `AdminRoute`, `UserRoute` e `AutoRedirect`.

### 3. Contrato de estados de tela comum

Criar componentes/regras padrao para `loading`, `empty`, `error`, `forbidden` e `offline`, com reaproveitamento nos dois perfis.

### 4. Alinhamento documento-codigo

Escolher e fixar rota canonica de dashboard do usuario:

- Opcao A: adotar `/app/dashboard` no codigo.
- Opcao B: manter `/app` no codigo e atualizar `ContextRotaUser.md`.

## Criterios de sucesso

- Uma unica fonte de verdade para rotas e metadados de navegacao.
- Nao ha paths hardcoded repetidos em router/sidebar/prefetch.
- Regra de autorizacao alterada em um unico ponto reflete em todos os guards.
- Contextos admin e usuario ficam aderentes ao comportamento real da aplicacao.

## Conclusao

O problema estrutural de DRY no projeto nao esta em uma rota isolada, mas na duplicacao da configuracao de navegacao e acesso em multiplos arquivos. A consolidacao em um registry unico, mais politica de acesso centralizada, reduz risco de regressao e aproxima implementacao dos contratos funcionais definidos em `ContextRotaAdmin.md` e `ContextRotaUser.md`.

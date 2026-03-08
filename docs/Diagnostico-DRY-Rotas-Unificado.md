# Diagnóstico DRY Unificado - Rotas Admin e Usuario

## Objetivo

Consolidar, em um unico documento, os problemas de DRY (Don't Repeat Yourself) das rotas dos perfis Administrador e Usuario, com base em:

- `docs/ContextRotaAdmin.md`
- `docs/ContextRotaUser.md`
- Implementacao atual em `src/`

## Status de execucao (mar/2026)

- `PR 1`: concluido.
- `PR 2`: concluido.
- `PR 3`: concluido.
- `PR 4`: concluido.
- `PR 5`: concluido.

Itens ja resolvidos no codigo:

- Politica de acesso centralizada em `src/utils/routeAccess.ts`.
- Sidebar derivada de metadados em `src/utils/routeRegistry.ts`.
- Prefetch derivado do registry em `src/utils/prefetchRoutes.ts`.
- Rotas `/app/*` mapeadas por registry em `src/main.tsx`.
- Estado de acesso negado implementado para area admin em `src/components/AdminRoute.tsx` com `src/components/ForbiddenState.tsx`.
- Rota canonica de dashboard do usuario alinhada para `/app` em `docs/ContextRotaUser.md`.

Decisao aplicada no PR 5:

- Estado `forbidden` padronizado para acesso negado a rotas administrativas.
- Em rotas de usuario, perfis admin/coordinator permanecem com redirecionamento para `/app/admin` (decisao de UX para evitar beco sem saida).

## Escopo e evidencias avaliadas

- Definicao de rotas: `src/main.tsx`
- Navegacao lateral (admin e usuario): `src/components/layout/Sidebar.tsx`
- Prefetch de rotas: `src/utils/prefetchRoutes.ts`
- Guardas e redirecionamento: `src/components/AdminRoute.tsx`, `src/components/UserRoute.tsx`, `src/components/ProtectedRoute.tsx`, `src/components/AutoRedirect.tsx`

## Achados transversais (Admin + Usuario)

### 1. Fonte de verdade de rotas fragmentada (problema DRY principal)

Status atual: resolvido.

O catalogo de rotas esta repetido em camadas diferentes:

- roteamento: `src/main.tsx`
- sidebar: `src/components/layout/Sidebar.tsx`
- prefetch: `src/utils/prefetchRoutes.ts`

Impacto:

- Maior risco de inconsistencias funcionais e de UX.
- Mudancas de rota exigem sincronizacao manual em varios arquivos.
- O contrato dos docs de contexto nao se traduz em uma fonte unica no codigo.

### 2. Politica de autorizacao repetida em multiplos guards

Status atual: resolvido.

A regra de papeis admin/coordinator esta duplicada em componentes diferentes:

- `src/components/AdminRoute.tsx`
- `src/components/UserRoute.tsx`
- `src/components/AutoRedirect.tsx`

Impacto:

- Alteracoes de autorizacao podem gerar comportamentos divergentes.
- A regra de acesso nao esta centralizada em uma unica politica reutilizavel.

### 3. Estado `forbidden` documentado, mas sem implementacao padronizada

Status atual: resolvido com politica definida por contexto.

Ambos os contextos (admin e usuario) preveem estado de tela `forbidden`. Na implementacao, o fluxo principal e redirecionamento silencioso com `Navigate`, sem tela unificada de acesso negado.

Impacto:

- Contrato funcional dos documentos nao esta representado de forma explicita no frontend.
- Tendencia a solucoes locais e repetitivas no futuro.

### 4. Cobertura de prefetch parcial e paralela ao mapa de rotas

Status atual: resolvido.

`src/utils/prefetchRoutes.ts` replica paths e imports que ja existem no `React.lazy` em `src/main.tsx`.

Impacto:

- Duplicacao de manutencao.
- Risco de rotas existirem no roteador, mas sem cobertura de prefetch (ou vice-versa).

## Achados especificos - Perfil Administrador

### A1. Rotas administrativas relevantes do contexto nao estao refletidas no menu

Status atual: resolvido com criterio explicito de rotas de detalhe fora do menu.

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

Status atual: resolvido.

O prefetch inclui parte do escopo admin, mas nao cobre todas as rotas relevantes do contexto (ex.: notificacao de reagendamento e perfis de acesso).

Impacto:

- Inconsistencia de experiencia e performance entre fluxos da mesma area.

## Achados especificos - Perfil Usuario

### U1. Divergencia de rota canonica de dashboard (`/app/dashboard` vs `/app`)

Status atual: resolvido.

No contexto de usuario, a rota de entrada e descrita como `/app/dashboard`. No codigo:

- Sidebar usa `/app` como dashboard: `src/components/layout/Sidebar.tsx:23`
- Prefetch usa `/app` para dashboard: `src/utils/prefetchRoutes.ts:4`
- Roteador usa fallback `/app/*`: `src/main.tsx:362`

Impacto:

- Contrato funcional e implementacao divergem sobre rota canonica.
- Aumenta o risco de ajustes futuros quebrarem breadcrumbs, links e analytics.

### U2. Contrato de guardas do contexto difere da composicao real

Status atual: resolvido (documentacao alinhada ao modelo por perfil).

O contexto do usuario cita `ProtectedRoute` para todo `/app/*`, mas no roteador as rotas principais usam `UserRoute`/`AdminRoute` diretamente e o wildcard tambem esta em `UserRoute`.

Impacto:

- O modelo de seguranca existe, mas nao com a mesma arquitetura descrita no documento.
- Isso dificulta manutencao documental e pode gerar interpretacoes diferentes no time.

### U3. Rota de recurso existe no roteador, mas sem prefetch dedicado

Status atual: resolvido.

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

## Plano de execucao por etapas (PRs)

### PR 1 - Fundacao de metadados e politicas de acesso

Objetivo:

- Criar a base compartilhada (sem trocar o roteamento completo ainda) para reduzir risco de regressao.

Ordem de arquivos:

1. `src/types/index.ts` (ou arquivo de tipos equivalente): adicionar tipos de metadados de rota e tipo de acesso.
2. `src/utils/routeAccess.ts` (novo): implementar `isAdminLike`, `canAccessRoute`, `getDefaultHomeByRole`.
3. `src/utils/routeRegistry.ts` (novo): criar registry inicial com paths e flags (`showInSidebar`, `prefetch`, `access`, `section`).
4. `src/components/AdminRoute.tsx`: substituir regra inline por helper central.
5. `src/components/UserRoute.tsx`: substituir regra inline por helper central.
6. `src/components/AutoRedirect.tsx`: usar `getDefaultHomeByRole`.

Impacto esperado:

- Alto impacto tecnico (remove duplicacao da regra de papel).
- Baixo impacto visual/funcional para usuario final.
- Reduz risco de divergencia entre guards.

Risco principal:

- Erro de mapeamento de role no helper central.

Checklist de validacao do PR:

- Login admin redireciona para area admin.
- Login usuario redireciona para area usuario.
- Usuario sem permissao nao acessa rota admin.

### PR 2 - Migracao da Sidebar para consumir registry

Objetivo:

- Eliminar lista hardcoded de navegacao em `Sidebar.tsx`.

Ordem de arquivos:

1. `src/utils/routeRegistry.ts`: complementar metadados de navegacao (rotulo, icone, ordem).
2. `src/components/layout/Sidebar.tsx`: substituir `userNav/adminNav` por derivacao do registry.
3. `src/components/layout/Sidebar.tsx`: explicitar regra de exibicao para rotas de detalhe (`showInSidebar: false`).

Impacto esperado:

- Alto impacto de manutencao (menu passa a ter fonte unica).
- Medio impacto funcional (corrige lacunas de navegacao admin onde aplicavel).

Risco principal:

- Ordem/rotulo de itens no menu ficar diferente do esperado de produto.

Checklist de validacao do PR:

- Menus admin e usuario aparecem corretos por perfil.
- Rotas de detalhe nao aparecem como menu principal.
- Hover/prefetch por item continua funcional.

### PR 3 - Migracao do prefetch para derivar do registry

Objetivo:

- Remover duplicacao entre `prefetchRoutes.ts` e `main.tsx`.

Ordem de arquivos:

1. `src/utils/routeRegistry.ts`: anexar `lazyLoader` e prioridade de prefetch.
2. `src/utils/prefetchRoutes.ts`: derivar `routeLoaders` do registry.
3. `src/utils/prefetchRoutes.ts`: manter apenas regras especiais inevitaveis (rotas dinamicas) e documentar.
4. `src/pages/ResultsHistory.tsx` (se necessario): incluir prefetch de `/app/recurso` em pontos de entrada.

Impacto esperado:

- Alto impacto tecnico (reduz paths duplicados e inconsistencias de performance).
- Medio impacto de UX (carregamento mais consistente nas rotas de contexto).

Risco principal:

- Alguma rota perder prefetch por metadado faltante.

Checklist de validacao do PR:

- Rotas criticas continuam prefetchando em hover.
- Fluxos `/app/reagendamentos/notificacao`, `/app/configuracoes/perfis` e `/app/recurso` com prefetch conforme regra definida.

### PR 4 - Refatoracao do `main.tsx` para montar rotas via registry

Objetivo:

- Tornar roteamento e metadados uma unica fonte de verdade.

Ordem de arquivos:

1. `src/utils/routeRegistry.ts`: finalizar todos os registros de rota do escopo `/app/*`.
2. `src/main.tsx`: substituir declaracoes repetitivas de `Route` por mapeamento do registry.
3. `src/main.tsx`: manter excecoes explicitas (ex.: `/login`, `/register`, `/forgot`, fallback).

Impacto esperado:

- Impacto critico de arquitetura (remove principal foco de DRY).
- Medio risco funcional por mexer na composicao de todas as rotas.

Risco principal:

- Ordem de match/fallback gerar comportamento inesperado em rotas dinamicas.

Checklist de validacao do PR:

- Todas as rotas listadas em `ContextRotaAdmin.md` e `ContextRotaUser.md` resolvem corretamente.
- Guardas continuam aplicados por perfil.
- Wildcards e fallback mantem comportamento atual.

### PR 5 - Alinhamento funcional final: rota canonica e estado forbidden

Objetivo:

- Fechar divergencias entre documento e codigo.

Ordem de arquivos:

1. Decisao de produto: definir rota canonica (`/app` ou `/app/dashboard`).
2. `src/main.tsx`, `src/components/layout/Sidebar.tsx`, `src/utils/prefetchRoutes.ts` e `src/utils/routeRegistry.ts`: aplicar a decisao de rota canonica.
3. `src/components/` (novo `ForbiddenState.tsx`, por exemplo): criar estado padrao de acesso negado.
4. `src/components/AdminRoute.tsx` e `src/components/UserRoute.tsx`: trocar redirecionamento silencioso por estado `forbidden` quando apropriado.
5. `docs/ContextRotaUser.md` e `docs/ContextRotaAdmin.md`: atualizar contrato final para refletir implementacao acordada.

Impacto esperado:

- Alto impacto de consistencia produto-documentacao.
- Alto valor para suporte operacional (feedback explicito de acesso negado).

Risco principal:

- Mudanca de URL canonica quebrar links externos internos nao mapeados.

Checklist de validacao do PR:

- Dashboard canonico unico e consistente em menu, router e prefetch.
- Estado `forbidden` visivel e padronizado para cenarios sem permissao.
- Documentacao de contexto aderente ao comportamento real.

## Estrategia de rollout

- Sequencia recomendada: PR 1 -> PR 2 -> PR 3 -> PR 4 -> PR 5.
- Evitar juntar PR 4 e PR 5 no mesmo merge para reduzir superficie de risco.
- Cada PR deve manter retrocompatibilidade de comportamento externo sempre que possivel.

## Impacto por PR (resumo executivo)

1. PR 1: reduz risco de divergencia de autorizacao.
2. PR 2: reduz risco de divergencia de navegacao.
3. PR 3: reduz risco de divergencia de performance/prefetch.
4. PR 4: elimina duplicacao estrutural de rotas no roteador.
5. PR 5: fecha aderencia entre UX, seguranca e documentacao.

## Criterios de sucesso

- Uma unica fonte de verdade para rotas e metadados de navegacao.
- Nao ha paths hardcoded repetidos em router/sidebar/prefetch.
- Regra de autorizacao alterada em um unico ponto reflete em todos os guards.
- Contextos admin e usuario ficam aderentes ao comportamento real da aplicacao.

## Conclusao

O problema estrutural de DRY no projeto nao esta em uma rota isolada, mas na duplicacao da configuracao de navegacao e acesso em multiplos arquivos. A consolidacao em um registry unico, mais politica de acesso centralizada, reduz risco de regressao e aproxima implementacao dos contratos funcionais definidos em `ContextRotaAdmin.md` e `ContextRotaUser.md`.

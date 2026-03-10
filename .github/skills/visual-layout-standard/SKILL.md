---
name: visual-layout-standard
description: Padroniza layout visual no src com contrato unico de cores, tipografia, icones, loading e responsividade. Use para refatorar paginas sem regressao de consistencia.
---

# Visual Layout Standard (TACF Digital)

Skill de execucao para aplicar o padrao visual unico do projeto, com foco em consistencia, simplicidade e reuso.

Fonte canonica obrigatoria: `docs/cores fora do padrão.md`.

---

## 1) Objetivo

Aplicar um unico padrao de UI no `src/`:

- linguagem estrutural azul/branco/cinza
- cores de estado apenas para estado funcional real
- icones via `AppIcon`
- loading full page via `FullPageLoading`
- layout responsivo consistente com `Layout`

Principios obrigatorios:

1. DRY: nao repetir o que ja existe.
2. KISS: evitar complexidade desnecessaria.
3. YAGNI: so implementar o que sera usado agora.
4. Reuso-first: pesquisar em `src/` antes de criar algo novo.
5. Nao gerar testes sem solicitacao explicita.

---

## 2) Fluxo operacional (passo a passo)

### Passo 1 - Diagnostico

Rodar auditoria no escopo alvo (`src/pages/**` ou arquivo unico):

- cores estruturais fora de contrato: `amber|emerald|violet|sky|yellow|purple|dark:`
- estados para auditoria: `success|error`
- legado de vermelho literal: `red-`
- loading fragmentado: `Carregando...|Carregando…|Loader2|animate-spin`
- uso direto de icones no JSX sem `AppIcon`

Saida esperada: lista de ocorrencias por arquivo e contexto.

### Passo 2 - Classificacao de ocorrencias

Classificar cada match:

1. Estado funcional:

- pode manter semantica de estado (`success/error`)

2. Visual estrutural:

- migrar para tokens estruturais (`primary`, `bg-card`, `text-body`, `text-muted`, `border-default`)

Regra critica:

- `red-*` deve migrar para token semantico `error` equivalente
- manter `red-*` apenas com limitacao tecnica comprovada e justificativa no PR

### Passo 3 - Planejamento de refatoracao

Ordem obrigatoria:

1. `src/components/layout/*`
2. paginas de maior exposicao de usuario
3. restante das paginas
4. componentes administrativos de menor exposicao

Estrategia:

- mudancas pequenas por arquivo/lote logico
- validar antes do proximo lote
- evitar alteracao cega em massa sem revisao contextual

### Passo 4 - Implementacao padrao

Aplicar contrato visual:

1. Layout/shell:

- pagina de app usa `Layout`

2. Cards:

- usar `CARD_BASE_CLASS`, `CARD_ELEVATED_CLASS`, `CARD_INTERACTIVE_CLASS` ou `card-surface*`

3. Icones:

- usar `AppIcon` no arquivo alterado
- hierarquia de tamanho: `xs|sm|md|lg` conforme papel visual

4. Loading:

- full page: `FullPageLoading`
- parcial: `PageSkeleton` ou local

5. Tipografia:

- H1: `text-xl md:text-2xl lg:text-3xl`
- H2/H3 de secao com conteudo: `text-lg md:text-xl`
- rotulo institucional curto: `text-sm uppercase`
- corpo: `text-sm` ou `text-base`
- auxiliar: `text-xs` ou `text-sm`

6. Cores de texto:

- principal: `text-body`
- apoio: `text-muted`
- sobre fundo escuro: `text-inverted` e variacao de apoio

### Passo 5 - Validacao

Checklist minimo por lote:

1. `yarn lint`
2. arquivo alterado sem erros
3. sem overflow horizontal em 360px
4. desktop e mobile consistentes
5. sem retorno principal com texto cru `Carregando...`
6. sem cor estrutural fora do contrato

---

## 3) Matriz de decisao rapida

| Caso                                    | Decisao                          |
| --------------------------------------- | -------------------------------- |
| Cor fora do contrato em card/header/nav | Migrar para tokens estruturais   |
| Cor de estado em feedback real          | Manter semantica `success/error` |
| `red-*` legado                          | Migrar para `error`              |
| Icone direto no JSX                     | Migrar para `AppIcon`            |
| Loading de pagina inteira               | `FullPageLoading`                |
| Loading parcial de bloco                | `PageSkeleton`                   |
| H2 de secao com conteudo                | `text-lg md:text-xl`             |
| Rotulo curto institucional              | `text-sm uppercase`              |

---

## 4) Bloqueios (nao aprovar)

Bloquear alteracao se houver:

1. pagina `app/*` sem `Layout`
2. icone novo fora de `AppIcon`
3. loading full-page sem `FullPageLoading`
4. nova variacao de card fora de `CARD_*`/`card-surface*`
5. uso estrutural de `amber/emerald/violet/sky/yellow/purple`
6. uso de `red-*` sem justificativa tecnica aprovada
7. texto redundante sem valor de UX

---

## 5) Definicao de pronto

Concluir quando todos forem verdadeiros:

1. estrutura em azul/branco/cinza
2. estado funcional restrito a `success/error`
3. icones consistentes por hierarquia de tamanho
4. tamanhos e cores de texto consistentes por papel visual
5. responsividade consistente com `Layout` e breakpoints oficiais
6. lint limpo

---

## 6) Prompts de uso sugeridos

1. `Aplique a skill visual-layout-standard em src/pages/Scheduling.tsx e normalize cores, icones e loading.`
2. `Faça auditoria visual em src/pages/** com a skill visual-layout-standard e priorize paginas de usuario.`
3. `Refatore src/pages/OperationalDashboard.tsx usando a matriz de decisao da skill visual-layout-standard.`
4. `Valide se src/pages/Documents.tsx cumpre definicao de pronto da skill visual-layout-standard.`

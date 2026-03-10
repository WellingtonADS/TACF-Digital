---
name: responsive-layout-check
description: Valida e corrige consistencia de container, grid e breakpoints nas paginas app para evitar regressao de responsividade.
---

# Responsive Layout Check

Skill para validar e corrigir responsividade de layout no padrao oficial do projeto.

Fonte oficial: `docs/cores fora do padrão.md`.

## 1) Objetivo

Garantir consistencia entre mobile/tablet/desktop com:

- `Layout` como shell
- container padrao por pagina
- grid progressivo sem quebra estrutural

## 2) Contrato minimo

1. Breakpoints oficiais:

- mobile `<768`
- tablet `>=768 e <1024`
- desktop `>=1024`

2. Shell:

- pagina `app/*` deve usar `Layout`

3. Container:

- `mx-auto`
- `max-w-6xl` (fluxo operacional) ou `max-w-5xl` (conteudo)
- `px-4 sm:px-6` e `lg:px-0` quando aplicavel

4. Grid:

- mobile first (`grid-cols-1`/`flex-col`)
- densificacao progressiva em `sm/md/lg/xl`

## 3) Checklist de validacao

1. sem overflow horizontal em 360px
2. sidebar sem compensacao manual fora do `Layout`
3. titulo e blocos sem truncamento indevido
4. botoes acionaveis em mobile
5. estrutura de colunas previsivel em desktop

## 4) Fluxo de execucao

1. Ler pagina alvo
2. Comparar com contrato minimo
3. Listar desvios com severidade
4. Corrigir em lote pequeno
5. Validar diagnostico + lint

## 5) Criterio de pronto

1. pagina cumpre contrato minimo
2. sem desvio critico de responsividade
3. lint limpo

## 6) Prompts de uso

1. `Use a skill responsive-layout-check para validar src/pages/Scheduling.tsx.`
2. `Use a skill responsive-layout-check em src/pages/OperationalDashboard.tsx e corrija desvios.`
3. `Use a skill responsive-layout-check para auditar todas as rotas app/*.`

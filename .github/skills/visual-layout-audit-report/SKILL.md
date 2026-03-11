---
name: visual-layout-audit-report
description: Audita paginas do src contra o padrao visual oficial e gera relatorio acionavel por prioridade (alto, medio, baixo).
---

# Visual Layout Audit Report

Skill de auditoria para mapear inconsistencias visuais antes da refatoracao.

Fonte oficial: `docs/cores fora do padrão.md`.

## 1) Objetivo

Gerar um relatorio pratico por arquivo com:

- o que esta fora de padrao
- severidade
- acao recomendada
- criterio de pronto

## 2) Entradas esperadas

1. Escopo: arquivo unico, pasta ou `src/pages/**`
2. Prioridade: usuario, layout compartilhado, admin
3. Formato de saida: markdown (padrao) ou csv

## 3) Processo de auditoria

### Passo 1 - Coleta

Buscar ocorrencias de:

- cores estruturais fora de contrato: `amber|emerald|violet|sky|yellow|purple|dark:`
- legado de vermelho literal: `red-`
- loading fragmentado: `Carregando...|Carregando…|Loader2|animate-spin`
- icones fora de padrao: uso direto de `lucide-react` no JSX
- variacao de texto fora da hierarquia: uso excessivo de `text-[10px]` em leitura continua

### Passo 2 - Classificacao

Classificar cada ocorrencia:

- Estrutural (quebra de identidade visual)
- Funcional (estado permitido)
- Tecnica (reuso/componente base nao utilizado)

### Passo 3 - Prioridade

- Alta: layout shell, navegacao, headers, cards principais
- Media: secoes internas, tabelas, listas
- Baixa: microdetalhes de apoio

### Passo 4 - Saida do relatorio

Para cada arquivo reportar:

1. problema
2. severidade
3. regra violada
4. correcao recomendada

## 4) Modelo de saida (markdown)

```md
## Arquivo: src/pages/Exemplo.tsx

- Severidade: Alta
- Problema: cor estrutural fora de contrato (`amber-*` em cabecalho)
- Regra: Paleta estrutural permitida
- Acao: migrar para `primary/bg-card/text-body`
```

## 5) Criterio de auditoria aprovada

A auditoria esta pronta quando:

1. todos os problemas estao classificados
2. cada problema tem acao objetiva
3. lista esta ordenada por prioridade
4. nao ha achados duplicados

## 6) Prompts de uso

1. `Use a skill visual-layout-audit-report para auditar src/pages/** e gerar relatorio por prioridade.`
2. `Use a skill visual-layout-audit-report no arquivo src/pages/OperationalDashboard.tsx.`
3. `Use a skill visual-layout-audit-report e entregue saida em formato csv.`

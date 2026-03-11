---
name: token-migration-assistant
description: Migra classes legadas de cor e tipografia para tokens semanticos do projeto com foco em consistencia e baixo risco.
---

# Token Migration Assistant

Skill para migracao controlada de estilos legados para o contrato de tokens do projeto.

Fonte oficial: `docs/cores fora do padrão.md`.

## 1) Objetivo

Padronizar estilos visuais sem regressao funcional:

- remover cores legadas estruturais
- migrar `red-*` para `error`
- manter `success/error` apenas em estado funcional
- reforcar hierarquia de texto semantica

## 2) Regras de mapeamento

### 2.1 Cores estruturais

Migrar:

- `amber|emerald|violet|sky|yellow|purple` -> `primary/bg-card/text-body/text-muted/border-default` conforme papel visual

### 2.2 Cores de estado

- `red-*` funcional -> `error` equivalente
- `success`/`error` em estado funcional -> manter
- `success`/`error` em estrutura principal -> migrar para paleta estrutural

### 2.3 Texto

Aplicar hierarquia:

- principal: `text-body`
- apoio: `text-muted`
- sobre fundo escuro: `text-inverted`

## 3) Fluxo de migracao

1. Diagnosticar ocorrencias por arquivo
2. Classificar (estrutural vs funcional)
3. Migrar bloco a bloco
4. Validar visualmente e por lint

## 4) Bloqueios

Nao concluir migracao quando houver:

1. classe legado estrutural remanescente sem justificativa
2. estado funcional quebrado por migracao cega
3. mistura de padroes semanticos no mesmo bloco

## 5) Definicao de pronto

1. arquivo sem cor estrutural fora de contrato
2. estados funcionais preservados
3. texto com hierarquia semantica consistente
4. lint limpo

## 6) Prompts de uso

1. `Use a skill token-migration-assistant para migrar src/pages/Scheduling.tsx para tokens semanticos.`
2. `Use a skill token-migration-assistant no modulo src/pages/ e priorize paginas de usuario.`
3. `Use a skill token-migration-assistant para revisar red-* e aplicar error semantico.`

# Plano de Refatoração — Frontend Conformity 2026-02

Objetivo: aplicar tipagem estrita, reduzir bundle e remover antipadrões no frontend.

- Branch alvo: `refactor/frontend-conformity-2026-02`
- Branch base (atual de trabalho): `260130-Ajuste-cadastro`
- Labels sugeridos: `epic`, `refactoring`, `frontend`, `technical-debt`

Resumo das fases:

Fase 0 — Preparação e Rastreamento (esta versão):

- Criar e commitar este plano em `.github/REFACTOR_PLAN.md`.
- Criar `.github/refactor-checklist.md` com tarefas rastreáveis.
- Criar stubs de issues em `.github/issues/` para cada sub-epic.
- Criar branch `refactor/frontend-conformity-2026-02` e commitar arquivos iniciais.

Fase 1 — Tipagem estrita (services, rpc wrappers)
Fase 2 — Hooks e extração de lógica (useSessions, useBooking)
Fase 3 — UI: migração de ícones, remover `any`, evitar setState em efeitos
Fase 4 — Bundle: lazy-load de `jspdf`, otimizações e chunking
Fase 5 — Tests & Lint: Vitest + ESLint clean

Critérios de aceitação (para fechar o epic):

- `npx tsc --noEmit` sem erros
- `npx eslint . --ext .ts,.tsx` sem erros (warnings analisados)
- Suíte de testes local verde (Vitest)
- PR com changelog e checklist preenchida

Notas:

- Não altere RLS/migrations sem aprovação do coordenador (HACO).
- Manter validações críticas no backend (RPCs/Postgres).

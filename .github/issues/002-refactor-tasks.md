# [Task] Refactor — Tipagem e Services

Descrição rápida: subtarefa para centralizar tipagem de serviços e RPC wrappers.

Checklist:

- [x] Atualizar `src/services/supabase.ts` com tipos Database generics
- [x] Garantir RPC wrappers tipados (ex.: `confirmar_agendamento`)
- [x] Atualizar mocks/tests conforme novas assinaturas

Status: Concluído

Resumo da entrega:

- Escopo: reescrita estrita da camada `src/services/*` (supabase, api, bookings, split admin/\*)
- Commits principais: `d225977`, `42e638c`, `7e4b98f`, `a0718ca`
- Validações CI locais: `npx tsc --noEmit` ✅, `yarn lint` ✅, `npx vitest run` ✅ (18/18)
- Branch/PR: `refactor/frontend-conformity-2026-02` — PR draft #9

Observações:

- Mocks/tests atualizados onde necessário; alguns `any` permanecem somente em testes/mocks (aceitável).
- Pendência operacional: fechar a Issue no GitHub (se desejar, posso fechar via GitHub MCP).

Prioridade: Alta

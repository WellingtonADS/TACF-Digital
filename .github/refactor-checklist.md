# Refactor Checklist — Frontend Conformity

Checklist objetivo para o epic `refactor/frontend-conformity-2026-02`.

Atualizado: 15/02/2026

## Resumo de Progresso

- **Fase 0 — Preparação & Rastreamento:** Concluída — branch e artefatos iniciais criados, issues stubbed.
- **Fase 1 — Tipagem Estrita (Services Layer):** Concluída — `src/services/*` reescrito, RPCs tipadas e testes de serviços adicionados.
- **Fase 2 — Hooks Customizados:** Concluída — `useSupabaseQuery`, `useAuth` e `useSessions` implementados e testados.
- **Fase 3 — Migração de Ícones (Lucide → MUI):** Concluída — migração aplicada onde necessário.
- **Fase 4 — Bundle Optimization (jsPDF lazy-load):** Concluída — geração de PDF via `generateReceipt` carrega `jspdf` dinamicamente.
- **Fase 5 — Refatoração de Componentes Grandes:** Em progresso — trabalhos por componente; calendar e parte do admin já refatorados.
- **Fase 6 — Remoção de Anti-Padrões:** Em planejamento (a executar conforme refactors avançam).
- **Fase 7 — Componentes Faltantes (Admin / Cross-Module):** Pendente.
- **Fase 8 — Dark Mode & Testes:** Pendente.
- **Fase 9 — Validação & Deploy:** Pendente.

## Itens de sprint (status atual)

- [x] Tipagem estrita: atualizar `src/services/*` e `supabase` RPC wrappers — concluído
- [x] Extrair hooks: `useSupabaseQuery`, `useAuth`, `useSessions` — concluído
- [x] Migrar ícones para MUI wrapper — concluído
- [x] Lazy-load heavy libs: `jspdf`, `jspdf-autotable` — concluído
- [x] Testes: adicionar/atualizar testes Vitest para hooks e serviços — concluído (suite verde nas últimas execuções)
- [ ] Refactor CalendarGrid into subcomponents — concluído (`CalendarHeader`, `CalendarBody`)
- [~] Refactor UserEditModal into `UserForm` + `useUserForm` — em progresso (componentes criados; lint apontou erro de parsing durante verificação)
- [ ] Refactor BookingConfirmationModal into composable parts — pendente
- [ ] Replace `window.location.reload` usages — pendente
- [ ] Standardize component declarations to `export default function` — pendente (migrar gradualmente)
- [ ] Remover anti-padrões — pendente
- [ ] Criar páginas Admin faltantes — pendente
- [ ] Criar componentes Cross-module — pendente
- [ ] Dark mode & testes — pendente
- [ ] Validação, docs & deploy — pendente

## Notas operacionais

- Branch de trabalho: `refactor/frontend-conformity-2026-02` (PR draft: chore(refactor): Frontend Conformity — Phase 0 #9).
- Estado atual: a maior parte das fases iniciais foi concluída; foco imediato no término da refatoração de `UserEditModal` e correção de lint/parse.
- Próxima ação recomendada: corrigir erro de parsing em `src/components/Admin/UserEditModal.tsx`, rodar (`npx tsc --noEmit`, `yarn lint`, `npx vitest run`) e só então commitar a conclusão desta subfase.

## Comandos úteis (executar localmente antes do PR)

```bash
YARN
npx tsc --noEmit
yarn lint
npx vitest run
```

Documentar quaisquer mudanças de banco (migrations/RLS) com issue separada antes de commitar alterações no diretório `supabase/`.

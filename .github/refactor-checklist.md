# Refactor Checklist — Frontend Conformity

Checklist objetivo para o epic `refactor/frontend-conformity-2026-02`.

Atualizado: 15/02/2026

## Resumo de Progresso

- **Fase 0 — Preparação & Rastreamento:** Concluída — branch e artefatos iniciais criados, issues stubbed.
- **Fase 1 — Tipagem Estrita (Services Layer):** Concluída — `src/services/*` reescrito, RPCs tipadas e testes de serviços adicionados.
- **Fase 2 — Hooks Customizados:** Concluída — `useSupabaseQuery`, `useAuth` e `useSessions` implementados e testados.
- **Fase 3 — Migração de Ícones (Lucide → MUI):** Concluída — migração aplicada onde necessário.
- **Fase 4 — Bundle Optimization (jsPDF lazy-load):** Concluída — geração de PDF via `generateReceipt` carrega `jspdf` dinamicamente.
- **Fase 5 — Refatoração de Componentes Grandes:** Concluída — UserEditModal, AuthContext, BookingConfirmationModal e CalendarGrid todos refatorados e decompostos.
- **Fase 6 — Remoção de Anti-Padrões:** Concluída — window.location.reload substituído, console statements envolvidos em DEV guards, React.FC removido.
- **Fase 7 — Componentes Faltantes (Admin / Cross-Module):** Pendente.
- **Fase 8 — Dark Mode & Testes:** Pendente.
- **Fase 9 — Validação & Deploy:** Pendente.

## Itens de sprint (status atual)

- [x] Tipagem estrita: atualizar `src/services/*` e `supabase` RPC wrappers — concluído
- [x] Extrair hooks: `useSupabaseQuery`, `useAuth`, `useSessions` — concluído
- [x] Migrar ícones para MUI wrapper — concluído
- [x] Lazy-load heavy libs: `jspdf`, `jspdf-autotable` — concluído
- [x] Testes: adicionar/atualizar testes Vitest para hooks e serviços — concluído (suite verde nas últimas execuções)
- [x] Refactor CalendarGrid into subcomponents — concluído (`CalendarHeader`, `CalendarBody`)
- [x] Refactor UserEditModal into `UserForm` + `useUserForm` — concluído
- [x] Refactor BookingConfirmationModal into composable parts — concluído (`TafSelector`, `PeriodSelector`, `useBookingConfirmation`)
- [x] Replace `window.location.reload` usages — concluído (4 instâncias refatoradas; 3 em DevAuthDebug preservadas intencionalmente)
- [x] Wrap console statements with DEV guards — concluído (services, utils, ErrorBoundary)
- [x] Standardize component declarations to `export default function` — concluído (Login, UserDashboard, ProfileSetup, Button, DevAuthDebug, AuthProvider)
- [ ] Remover anti-padrões adicionais — pendente
- [ ] Criar páginas Admin faltantes — pendente
- [ ] Criar componentes Cross-module — pendente
- [ ] Dark mode & testes — pendente
- [ ] Validação, docs & deploy — pendente

## Notas operacionais

- Branch de trabalho: `refactor/frontend-conformity-2026-02` (PR draft: chore(refactor): Frontend Conformity — Phase 0 #9).
- Estado atual: Fases 0-6 concluídas — todas as refatorações principais de componentes e anti-padrões aplicadas. Testes passando (18/18), tsc clean, lint clean.
- Próxima ação recomendada: executar Fase 7 (componentes faltantes Admin/Cross-module) conforme plano original.
- Commits:
  - `c2c721e` — Phase 5 (decomposição de componentes grandes)
  - `a37f1dd` — Phase 6 (remoção de anti-padrões)

## Comandos úteis (executar localmente antes do PR)

```bash
npx tsc --noEmit
yarn lint
npx vitest run
```

Documentar quaisquer mudanças de banco (migrations/RLS) com issue separada antes de commitar alterações no diretório `supabase/`.

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
- **Fase 8 — Componentes Cross-Module:** Concluída — ScoreEntryScreen, SystemSettings, AccessProfilesManagement criados.
- **Fase 9 — Dark Mode & Testes:** Pendente.
- **Fase 10 — Validação & Deploy:** Pendente.

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
- [x] Criar ScoreEntryScreen — concluído (confirmação de presença, busca e filtro de militares)
- [x] Criar SystemSettings — concluído (configurações gerais, parâmetros TAF, locais, perfis de acesso, auditoria)
- [x] Criar AccessProfilesManagement — concluído (gestão de perfis admin/coordinator/user com permissões)
- [ ] Criar páginas Admin faltantes — pendente (Issue #40+)
- [ ] Dark mode & testes — pendente
- [ ] Validação, docs & deploy — pendente

## Notas operacionais

- Branch de trabalho: `refactor/frontend-conformity-2026-02` (PR draft: chore(refactor): Frontend Conformity — Phase 0 #9).
- Estado atual: Fases 0-6 e 8 concluídas — todas as refatorações principais de componentes e anti-padrões aplicadas. Testes passando (18/18), tsc clean, lint clean.
- Próxima ação recomendada: Fase 9 (Dark Mode & Testes) ou continuar com páginas Admin restantes conforme necessário.
- Commits recentes:
  - `c2c721e` — Phase 5 (decomposição de componentes grandes)
  - `a37f1dd` — Phase 6 (remoção de anti-padrões)
  - `ea4d9dd` — Phase 8 (ScoreEntryScreen + SystemSettings)
  - `3535a5e` — Phase 8 (AccessProfilesManagement)
  - `d6bde12` — Phase 8 (refactor ScoreEntryScreen lint fixes)

## Pendências de banco de dados (necessárias para funcionalidades completas)

- **ScoreEntryScreen:** campo `attendance_confirmed` na tabela `bookings`
- **SystemSettings:** tabela `settings`, `locations`, `audit_logs`
- **AccessProfilesManagement:** tabelas `access_profiles`, `permissions`

Todas as pendências foram documentadas com comentários TODO nos componentes e avisos visuais nas interfaces.

## Comandos úteis (executar localmente antes do PR)

```bash
npx tsc --noEmit
yarn lint
npx vitest run
```

Documentar quaisquer mudanças de banco (migrations/RLS) com issue separada antes de commitar alterações no diretório `supabase/`.

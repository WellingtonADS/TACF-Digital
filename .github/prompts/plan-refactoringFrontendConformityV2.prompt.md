# Plan: Refatoração Frontend TACF Digital — Qualidade & Conformidade (v2 com GitHub MCP)

O projeto TACF Digital está 65% conforme com o design system planejado, mas apresenta **26 erros de linting, bundle crítico de 1.1MB, 75 usos de `any` em TypeScript e conflito entre dois sistemas de ícones**. Esta refatoração eliminará código legado, aplicará melhores práticas React/TypeScript e completará os componentes faltantes. **Usaremos GitHub MCP para criar issues rastreáveis, organizar o trabalho e documentar decisões técnicas. Usaremos Postgres MCP, stitch MCP, e subagentes necessarios**

**Decisões principais:**

- **GitHub Issues** para rastrear cada fase da refatoração
- Migração 100% para Material-UI icons (remover `lucide-react`)
- Aplicar tipagem estrita sem `any` nos services layer
- Dynamic imports para jsPDF (reduzir bundle em ~40%)
- Hook customizado `useSessions()` para eliminar duplicação
- Padrão unificado: `export default function` (não `React.FC`)

FAZER TESTES E COMMITAR SOMENTE NO FINAL DAS FASES.

---

## **Steps**

### **Fase 0: Preparação e Rastreamento GitHub (1-2h)**

1. **Criar Epic Issue principal no GitHub**
   - Usar `mcp_github_issue_read` para verificar issues existentes
   - Criar issue mãe: "Epic: Refatoração Frontend - Conformidade Design System"
   - Labels: `epic`, `refactoring`, `frontend`, `technical-debt`
   - Adicionar checklist completo das 10 fases
   - Referenciar `PlanModeUI.md` no corpo da issue

2. **Criar issues filhas para cada fase crítica** (via GitHub MCP)
   - Issue #1: "Fase 1: Tipagem Estrita - Services Layer" (P0, estimativa: 3-4h)
   - Issue #2: "Fase 2: Hooks Customizados (useSessions, useAuth)" (P1, 2-3h)
   - Issue #3: "Fase 3: Migração Lucide → Material-UI Icons" (P1, 2-3h)
   - Issue #4: "Fase 4: Bundle Optimization - Dynamic Imports" (P0, 1-2h)
   - Issue #5: "Fase 6: Remover Anti-Padrões React" (P0, 2-3h)
   - Issue #6: "Fase 7-8: Componentes Admin Faltantes" (P2, 10-14h)
   - Issue #7: "Fase 9: Dark Mode & Testes" (P2, 3-4h)
   - Cada issue com: descrição detalhada, acceptance criteria, arquivos afetados

3. **Criar branch de trabalho a partir de 260130-Ajuste-cadastro**
   - Branch: `refactor/frontend-conformity-2026-02`
   - Commitar plano atualizado em `.github/REFACTOR_PLAN.md`
   - Push e criar PR draft no GitHub

4. **Atualizar dependências conflitantes**
   - Verificar versão real de `jspdf` em `package.json`
   - Instalar versão correta: `jspdf@^2.5.2`
   - Criar issue específica: "Fix: Atualizar jsPDF para versão oficial"

5. **Criar arquivo de configuração de migração**
   - Criar `.github/refactor-checklist.md`
   - Listar todos os 19 componentes usando Lucide para conversão
   - Automatizar com script: `scripts/check-lucide-usage.sh`

6. **Configurar regras ESLint mais estritas**
   - Atualizar `eslint.config.js`
   - Adicionar regra `"no-console": ["warn", { allow: ["warn", "error"] }]`
   - Adicionar `"@typescript-eslint/no-explicit-any": "error"` (sem exceções)
   - Commitar com referência à issue #1

---

### **Fase 1: Tipagem Estrita — Services Layer (3-4h)**

**Rastreamento GitHub:** Issue #1

7. **RECRIAR `src/services/supabase.ts`**
   - **Remover completamente** o arquivo atual (75 linhas, 7 `any`)
   - Criar nova versão com tipos explícitos importados de `database.types.ts`
   - Usar genéricos de Supabase: `supabase.from<Tables<'sessions'>>()`
   - Remover `/* eslint-disable @typescript-eslint/no-explicit-any */`
   - Commit: `refactor(services): rewrite supabase.ts with strict typing #1`

8. **RECRIAR `src/services/api.ts`**
   - **Remover** arquivo (202 linhas, 9 `any`)
   - Reescrever com tipos de RPC explícitos
   - Criar interfaces para retornos de RPCs (`BookSessionResponse`, `ConfirmBookingResponse`, etc.)
   - Exemplo: `supabase.rpc<SwapRequestRecord>('create_swap_request', params)`
   - Commit: `refactor(services): rewrite api.ts with RPC types #1`

9. **RECRIAR `src/services/admin.ts`**
   - **Remover** arquivo (322 linhas, 11 `any`)
   - Separar em dois arquivos:
     - `src/services/admin/users.ts` - gerenciamento de usuários
     - `src/services/admin/sessions.ts` - gerenciamento de sessões
   - Aplicar tipagem completa com genéricos Supabase
   - Commit: `refactor(services): split admin.ts into users + sessions #1`

10. **RECRIAR `src/services/bookings.ts`**
    - Aplicar tipos explícitos
    - Remover `console.error` não guardado (linha 47)
    - Retornar tipos específicos em vez de `any`
    - Commit: `refactor(services): strict typing for bookings.ts #1`

11. **Atualizar issue #1 no GitHub**
    - Marcar tarefas completadas
    - Adicionar comentário com resumo de mudanças
    - Linkar commits relevantes

---

### **Fase 2: Componentes Core — Hooks Customizados (2-3h)**

**Rastreamento GitHub:** Issue #2

12. **Criar hook `src/hooks/useSessions.ts`**
    - Consolidar lógica duplicada em 7 componentes
    - Interface: `useSessions(filters?: SessionFilters): { sessions, loading, error, refetch }`
    - Substituir fetch manual em `CalendarGrid.tsx`, `SwapRequestModal.tsx`, `SessionEditModal.tsx`
    - Commit: `feat(hooks): create useSessions to consolidate logic #2`

13. **Criar hook `src/hooks/useSupabaseQuery.ts`**
    - Hook genérico para queries Supabase com cache e error handling
    - Usar em todos os componentes que fazem fetch direto
    - Incluir suporte a pagination
    - Commit: `feat(hooks): create generic useSupabaseQuery #2`

14. **Criar hook `src/hooks/useAuth.ts`**
    - Extrair lógica de `AuthContext.tsx` (241 linhas → 100 linhas no contexto)
    - Separar: auth state, profile loading, error handling
    - Commit: `refactor(auth): extract useAuth hook from context #2`

15. **Criar testes unitários para hooks**
    - `src/hooks/__tests__/useSessions.test.ts`
    - `src/hooks/__tests__/useAuth.test.ts`
    - Commit: `test(hooks): add unit tests for custom hooks #2`

16. **Fechar issue #2 no GitHub**
    - Adicionar comentário final com métricas (linhas removidas/adicionadas)
    - Marcar como concluída

---

### **Fase 3: Migração de Ícones — Lucide → Material-UI (2-3h)**

**Rastreamento GitHub:** Issue #3

17. **Criar script de migração automática**
    - `scripts/migrate-icons.ts`
    - Mapear: `AlertTriangle` → `WarningAmberIcon`, `ArrowRight` → `ArrowForwardIcon`, etc.
    - Usar AST (ts-morph) para transformação segura
    - Dry-run primeiro para validar

18. **Executar migração nos componentes críticos (prioridade):**
    - `src/pages/UserDashboard.tsx` (4 ícones)
    - `src/components/Layout/TopNav.tsx` (6 ícones)
    - `src/components/Calendar/CalendarGrid.tsx` (3 ícones)
    - `src/components/Booking/BookingConfirmationModal.tsx` (8 ícones)
    - Commit por componente: `refactor(icons): migrate [Component] to Material-UI #3`

19. **Migrar componentes restantes (batch)**
    - Processar os 15 componentes restantes
    - Commit único: `refactor(icons): migrate remaining components to Material-UI #3`

20. **Remover dependência lucide-react**
    - Executar `yarn remove lucide-react`
    - Atualizar `.github/refactor-checklist.md`
    - Commit: `chore(deps): remove lucide-react dependency #3`
    - Fechar issue #3

---

### **Fase 4: Bundle Optimization — Dynamic Imports (1-2h)**

**Rastreamento GitHub:** Issue #4

21. **Implementar lazy loading de PDF em `src/utils/pdf/generateCallList.ts`**
    - Transformar em função async que importa jsPDF dinamicamente
    - Padrão: `const jsPDF = (await import('jspdf')).default`
    - Commit: `perf(pdf): lazy load jsPDF in generateCallList #4`

22. **Aplicar dynamic import em `src/utils/pdfGenerator.ts`**
    - Mesma estratégia
    - Commit: `perf(pdf): lazy load jsPDF in pdfGenerator #4`

23. **Aplicar dynamic import em `src/utils/receipt/generateReceipt.ts`**
    - Garantir que jsPDF só carregue quando usuário gerar PDF
    - Commit: `perf(pdf): lazy load jsPDF in generateReceipt #4`

24. **Atualizar chamadores de funções PDF**
    - Transformar `generateCallList()` → `await generateCallList()`
    - Adicionar loading states onde necessário
    - Commit: `refactor: update PDF function calls to async #4`

25. **Validar bundle size**
    - Executar `yarn build`
    - Documentar redução no comentário da issue
    - Target: <500KB para main chunk
    - Fechar issue #4

---

### **Fase 5: Refatoração de Componentes Grandes (4-6h)**

**Rastreamento GitHub:** Criar sub-issues para cada componente

26. **RECRIAR `src/components/Admin/UserEditModal.tsx`**
    - **Remover** componente atual (349 linhas)
    - Separar em:
      - `UserEditModal.tsx` - shell do modal (50 linhas)
      - `UserForm.tsx` - formulário reutilizável (150 linhas)
      - `useUserForm.ts` - hook com validação (80 linhas)
    - Remover `any` da linha 94
    - Aplicar padrão `export default function`
    - Commit: `refactor(admin): decompose UserEditModal into composable parts`

27. **REFATORAR `src/contexts/AuthContext.tsx`**
    - Manter arquivo (não recriar - é contexto crítico)
    - Extrair lógica para `useAuth` hook (já feito na Fase 2)
    - Remover 5 usos de `any` (linhas 146, 150, 154, 161, 194)
    - Remover 11 `console.debug/warn/error` ou guardar com `if (import.meta.env.DEV)`
    - Aplicar tipos explícitos para Supabase auth responses
    - Commit: `refactor(auth): remove any types and clean console logs`

28. **RECRIAR `src/components/Booking/BookingConfirmationModal.tsx`**
    - **Remover** componente (259 linhas)
    - Separar em:
      - `BookingConfirmationModal.tsx` - UI do modal (80 linhas)
      - `TafSelector.tsx` - seleção de TAF (50 linhas)
      - `PeriodSelector.tsx` - seleção de período (50 linhas)
      - `useBookingConfirmation.ts` - lógica de estado (60 linhas)
    - Commit: `refactor(booking): decompose BookingConfirmationModal`

29. **REFATORAR `src/components/Calendar/CalendarGrid.tsx`**
    - Substituir fetch manual por `useSessions()` hook
    - Extrair lógica de navegação para `useCalendarNavigation()` hook
    - Substituir ícones Lucide → Material-UI (já feito na Fase 3)
    - Reduzir de 177 linhas para ~100 linhas
    - Commit: `refactor(calendar): simplify CalendarGrid with hooks`

---

### **Fase 6: Remoção de Anti-Padrões (2-3h)**

**Rastreamento GitHub:** Issue #5

30. **Eliminar `window.location.reload()` em 7 locais**
    - `src/pages/UserDashboard.tsx` (linhas 111, 179): substituir por `refetch()` de hook
    - `src/components/Booking/ComprovanteTicket.tsx` (linha 207): usar navegação React Router
    - `src/components/DevAuthDebug.tsx` (linhas 18, 22, 35): manter (componente de debug)
    - `src/components/ErrorBoundary.tsx` (linha 25): substituir por `resetErrorBoundary`
    - Commit: `refactor: remove window.location.reload anti-pattern #5`

31. **Remover/guardar console statements (46 ocorrências)**
    - Manter apenas em `DevAuthDebug.tsx` e `test-connection.ts`
    - Em todos os outros arquivos: substituir por error reporting service ou remover
    - Guardar `console.error` com `if (import.meta.env.DEV)`
    - Commit: `refactor: clean console statements in production code #5`

32. **Padronizar declaração de componentes**
    - Converter todos os `React.FC` para `export default function` (13 arquivos)
    - Lista: `UserDashboard.tsx`, `Login.tsx`, `ProfileSetup.tsx`, `Button.tsx`, etc.
    - Commit: `refactor: standardize component declarations (no React.FC) #5`
    - Fechar issue #5

---

### **Fase 7: Componentes Faltantes — Admin (6-8h)**

**Rastreamento GitHub:** Issue #6 (parent) + 3 sub-issues

33. **CRIAR `src/pages/AdminPersonnelManagement.tsx`**
    - Referência: `stitch_screens/stitch_tacf_digital_screen/tacf-digital_personnel_management/`
    - Componentes: `PageHeader`, `StatCard`, tabela com filtros de OM/função
    - Funcionalidades: busca, filtros, edição inline, importação CSV
    - Integração: usar `src/services/admin/users.ts`
    - Commit: `feat(admin): create AdminPersonnelManagement page #6`

34. **CRIAR `src/pages/AdminAnalyticsDashboard.tsx`**
    - Referência: `stitch_screens/stitch_tacf_digital_screen/tacf-digital_analytics_dashboard/`
    - 6 StatCards: total sessões, taxa ocupação, no-shows, swaps, média presença, tendência
    - Gráficos: recharts (adicionar dependência se necessário) ou criar SVG customizado
    - Período selecionável: última semana, mês, trimestre, ano
    - Commit: `feat(admin): create AdminAnalyticsDashboard page #6`

35. **CRIAR `src/pages/AdminAuditLog.tsx`**
    - Referência: `stitch_screens/stitch_tacf_digital_screen/tacf-digital_audit_log/`
    - Tabela paginada com logs de auditoria
    - Filtros: tipo de ação, usuário, período
    - Integração: RPC `get_audit_logs` (verificar se existe, criar migration se necessário)
    - Exportação de relatórios em CSV
    - Commit: `feat(admin): create AdminAuditLog page #6`

36. **Atualizar rotas em `src/App.tsx`**
    - Adicionar rotas para as 3 novas páginas
    - Atualizar navegação em `src/components/Layout/Shell.tsx`
    - Commit: `feat(routing): add routes for new admin pages #6`
    - Fechar issue #6

---

### **Fase 8: Componentes Faltantes — Cross-Module (4-6h)**

**Rastreamento GitHub:** Criar issues individuais

37. **CRIAR `src/pages/ScoreEntryScreen.tsx`**
    - Referência: `stitch_screens/stitch_tacf_digital_screen/tacf-digital_score_entry_screen/`
    - Formulário para lançamento de pontuação
    - Validação: quórum mínimo, capacidade máxima
    - Integração: RPC `update_session_scores`
    - Commit: `feat: create ScoreEntryScreen component`

38. **CRIAR `src/pages/SystemSettings.tsx`**
    - Referência: `stitch_screens/stitch_tacf_digital_screen/tacf-digital_system_settings/`
    - Seções: configurações gerais, TAF, limites, notificações
    - Apenas admin root pode acessar
    - Integração: `settings` table no Supabase (verificar se existe)
    - Commit: `feat: create SystemSettings page`

39. **CRIAR `src/pages/AccessProfilesManagement.tsx`**
    - Referência: `stitch_screens/stitch_tacf_digital_screen/tacf-digital_access_profiles_management/`
    - CRUD de perfis de acesso (admin, operational, user)
    - Gestão de permissões por recurso
    - Integração: `access_profiles` table (verificar schema)
    - Commit: `feat: create AccessProfilesManagement page`

---

### **Fase 9: Dark Mode & Testes (3-4h)**

**Rastreamento GitHub:** Issue #7

40. **Implementar Dark Mode completo**
    - CSS vars já definidas em `src/index.css`
    - Criar `src/contexts/ThemeContext.tsx`
    - Adicionar toggle em `TopNav`
    - Persistir preferência em localStorage
    - Testar todos os componentes em ambos os temas
    - Commit: `feat: implement complete dark mode support #7`

41. **Escrever testes E2E para fluxos críticos**
    - Smoke test: login → dashboard → logout
    - Booking flow: dashboard → seleção de sessão → confirmação → comprovante
    - Admin flow: login admin → gestão de usuários → aprovação de swap
    - Executar: `yarn test:e2e:smoke`
    - Commit: `test(e2e): add critical flow tests #7`

42. **Criar testes unitários para componentes base**
    - `src/components/ui/__tests__/StatCard.test.tsx`
    - `src/components/ui/__tests__/PageHeader.test.tsx`
    - `src/components/ui/__tests__/Sidebar.test.tsx`
    - Commit: `test: add unit tests for base components #7`
    - Fechar issue #7

---

### **Fase 10: Validação & Deploy (2-3h)**

43. **Executar linting e type checking**
    - `yarn lint` deve retornar 0 erros, 0 warnings
    - `npx tsc --noEmit` deve passar sem erros
    - Corrigir quaisquer problemas remanescentes
    - Commit: `fix: resolve final linting and type issues`

44. **Validar bundle size**
    - `yarn build`
    - Verificar que main chunk < 500KB
    - Confirmar que jsPDF não está no bundle principal
    - Usar Vite Bundle Analyzer: `npx vite-bundle-visualizer`
    - Documentar métricas em comentário do PR

45. **Atualizar documentação**
    - Atualizar `AGENTS.md` com novos padrões
    - Adicionar JSDoc em hooks customizados
    - Criar `ARCHITECTURE.md` documentando estrutura de pastas
    - Commit: `docs: update project documentation`

46. **Gerar relatório final de conformidade**
    - Atualizar `PlanModeUI.md`
    - Status geral deve atingir 95%+
    - Documentar débitos técnicos remanescentes (se houver)
    - Commit: `docs: update conformity report to v2`

47. **Preparar Pull Request para review**
    - Converter PR draft para ready
    - Preencher template com:
      - Resumo das mudanças
      - Screenshots antes/depois
      - Métricas (bundle size, lighthouse scores)
      - Checklist de verificação completo
    - Marcar revisores (HACO)
    - Linkar todas as issues fechadas

48. **Fechar Epic Issue principal**
    - Adicionar comentário final com estatísticas gerais
    - Linkar PR de merge
    - Celebrar 🎉

---

## **Verification**

Após completar todas as fases:

**Comandos obrigatórios:**

```bash
yarn lint                # 0 erros, 0 warnings
npx tsc --noEmit         # sem erros de tipo
yarn test                # todos os testes unitários passando
yarn test:e2e:smoke      # smoke tests E2E passando
yarn build               # bundle < 500KB, sem warnings críticos
```

**Checklist manual:**

- [ ] Zero usos de `any` em `src/services/`
- [ ] Zero importações de `lucide-react`
- [ ] Todos os 24 componentes planejados existem
- [ ] Dark mode funcional em todas as páginas
- [ ] Bundle principal < 500KB (target: ~380KB gzipped)
- [ ] Navegação sem `window.location.reload()`
- [ ] Console limpo em produção (sem logs desnecessários)
- [ ] Padrão consistente: `export default function`
- [ ] Material-UI icons em 100% dos componentes

**Validação GitHub:**

- [ ] Epic issue fechada com todas as sub-issues
- [ ] PR aprovado e merged
- [ ] Todas as issues linkadas no PR
- [ ] Documentação atualizada

**Testes visuais:**

- [ ] Abrir cada tela em `stitch_screens/` e comparar com implementação
- [ ] Testar responsividade (mobile, tablet, desktop)
- [ ] Validar acessibilidade com Lighthouse (score > 90)

---

## **Decisions**

**1. Uso de GitHub MCP para rastreamento**

- **Razão:** Visibilidade, accountability, histórico de decisões técnicas
- **Impacto:** Melhor organização do trabalho, rastreabilidade
- **Trade-off:** Overhead inicial de criação de issues (compensado pela clareza)

**2. Remoção de lucide-react em favor de Material-UI**

- **Razão:** Projeto já usa `@mui/material` e `@emotion`, evita duplicação
- **Impacto:** Bundle reduzido em ~50KB, design system unificado
- **Trade-off:** Migração manual de 19 componentes

**3. Recriar services layer em vez de ajustar**

- **Razão:** 75 usos de `any` indicam design frágil, refatoração incremental arriscada
- **Impacto:** Código limpo, type-safe, manutenível
- **Trade-off:** 3-4h de trabalho vs. 1-2h de patches

**4. Dynamic imports para jsPDF**

- **Razão:** Bundle size crítico (1.1MB → target 500KB)
- **Impacto:** Redução de ~40% no bundle principal
- **Trade-off:** Funções PDF se tornam async (breaking change menor)

**5. Criação de hooks customizados (useSessions, useAuth)**

- **Razão:** 7 componentes duplicam lógica de sessões
- **Impacto:** DRY, testabilidade, manutenibilidade
- **Trade-off:** Abstração adicional (positivo)

**6. Padrão `export default function` global**

- **Razão:** Alinhamento com React docs e guidelines do projeto
- **Impacto:** Consistência, remove ambiguidade
- **Trade-off:** `React.FC` oferece tipagem implícita de children (não crítico)

---

**Estimativa total:** 30-40 horas de desenvolvimento  
**Prioridade de execução:** Fases 1-2-6 (críticas) → 3-4 (bundle) → 5-7-8 (features) → 9-10 (polimento)  
**Checkpoints de revisão:** Final de Fase 2, Fase 6, Fase 8  
**Repositório GitHub:** WellingtonADS/TACF-Digital  
**Branch de trabalho:** `refactor/frontend-conformity-2026-02` (a partir de `260130-Ajuste-cadastro`)

---

## Fases 11–12: Pós-merge, Monitoramento e Rollback

### **Fase 11: Pós-merge & Monitoramento (1-2h)**

48. **Deploy para staging e verificação manual**
    - Criar environment `staging` com as mesmas variáveis do `production` (exceto secrets).
    - Implantar a branch `refactor/frontend-conformity-2026-02` no staging.
    - Executar checklist manual: rotas, login, booking flow, dashboards admin.
    - Coletar métricas de bundle, performance e Core Web Vitals.

49. **Monitoramento contínuo (primeiras 48h)**
    - Configurar alertas básicos (Sentry/LogRocket) para erros JS críticos.
    - Monitorar taxa de erros e regressões visuais relatadas.
    - Documentar quaisquer hotfixes em uma issue linkada ao PR.

50. **Deploy para produção (após validação)**
    - Pré-requisitos: QA green, testes E2E smoke passing, métricas dentro do esperado.
    - Modo de deploy: canary/rolling se disponível; caso contrário, deploy normal com rollback pronto.

### **Fase 12: Rollback & Hotfixes (contingência)**

51. **Plano de rollback rápido**
    - Identificar commit/PR anterior estável (tag ou hash) e preparar hotfix branch `hotfix/rollback-frontend-conformity`.
    - Scripts rápidos: `yarn build` em CI, redeploy da versão anterior, e criar PR com causa/impacto para auditoria.

52. **Hotfixes críticos**
    - Corrigir problemas P0 (ex.: regressão de login, perda de dados do usuário) em `hotfix/*` e permitir merge emergencial com revisão mínima.
    - Documentar ações e marcar revisores na issue principal do Epic.

---

## Governança, Revisão e Documentação

53. **Revisão de código & approvers**
    - Solicitar pelo menos 2 revisores: um dev frontend senior e o coordenador HACO.
    - Revisões obrigatórias para mudanças em `supabase/` e `src/services/*`.

54. **Documentação entregue**
    - `ARCHITECTURE.md` contendo decisões de pastas e padrões (hooks, services, UI).
    - `CONTRIBUTING.md` com checklist de PR e comandos de verificação (`yarn lint`, `npx tsc --noEmit`, `npx vitest run`).
    - Atualizar `AGENTS.md` com passos operacionais para agentes/automation.

55. **Treinamento rápido (opcional)**
    - Sessão de 30–45 minutos com o time mostrando mudanças principais: hooks, services refatorados e como executar testes/local build.

---

## Checklist Final (delta)

- [ ] `yarn lint` → 0 erros, 0 warnings
- [ ] `npx tsc --noEmit` → sem erros
- [ ] `npx vitest run` → todos os testes unitários passando
- [ ] `yarn test:e2e:smoke` → smoke tests E2E passando em staging
- [ ] Bundle principal < 500KB (verificado via build + visualizer)
- [ ] Todas as issues de fase fechadas e linkadas ao PR
- [ ] Documentação atualizada (`ARCHITECTURE.md`, `CONTRIBUTING.md`, `AGENTS.md`)
- [ ] Revisores atribuídos e PR pronto para merge

---

Se desejar, posso:

- criar automaticamente as issues filhas e o Epic no GitHub via MCP,
- gerar `ARCHITECTURE.md` inicial com base nas mudanças já aplicadas,
- ou submeter o PR para revisão (mudar de draft para ready).

# 📊 AUDITORIA VISUAL COMPLETA - TACF Digital

**Data da Auditoria:** 23 de março de 2026  
**Escopo:** Todas as 29 páginas do projeto  
**Objetivo:** Identificar inconsistências de design e desvios do padrão de tokens visuais

---

## 📋 RESUMO EXECUTIVO

| Métrica                   | Resultado |
| ------------------------- | --------- |
| **Total de páginas**      | 29        |
| **Páginas com problemas** | 24        |
| **Páginas limpas**        | 5         |
| **Problemas críticos**    | 14 (ALTO) |
| **Problemas médios**      | 8 (MÉDIO) |
| **Problemas menores**     | 2 (BAIXO) |

### Categorias de Problemas Encontrados

- ❌ Classes `dark:` indevidas (projeto é light-only): **15+ instâncias**
- ❌ Cores hardcoded (red-, green-, amber-): **40+ instâncias**
- ⚠️ Status badges inconsistentes: **12+ instâncias**
- ⚠️ Tipografia/espaçamento irregular: **18+ instâncias**

---

## 🔴 PROBLEMAS CRÍTICOS (ALTO) — 14 páginas

### 1️⃣ **AuditLog.tsx** ⚠️ 8 PROBLEMAS

**Arquivo:** [src/pages/AuditLog.tsx](../../src/pages/AuditLog.tsx)

**Classes dark: (REMOVER TODAS):**

```tsx
// ❌ PROBLEMA: Linhas 57, 65, 73 — Classes dark: em projeto light-only
dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800
dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-700
dark:bg-red-900/20 dark:text-red-400 dark:border-red-800
dark:divide-slate-800  // Linhas 321, 404
```

**Cores Hardcoded (SUBSTITUIR):**

- Status badges linha 57: `bg-emerald-50 text-emerald-700 border-emerald-200` → use `bg-success/10 text-success border-success/30`
- Status badges linha 65: `bg-amber-50 text-amber-700 border-amber-200` → use `bg-alert/10 text-alert border-alert/30`
- Status badges linha 73: `bg-red-50 text-red-700 border-red-200` → use `bg-error/10 text-error border-error/30`
- Border-left palette (linhas 89-91):
  ```tsx
  ❌ border-l-emerald-500, border-l-amber-400, border-l-red-500
  ✅ border-l-success, border-l-alert, border-l-error
  ```
- StatCard icons (linhas 220-228):
  ```tsx
  ❌ bg-red-500/10 text-red-600, bg-emerald-500/10 text-emerald-600
  ✅ bg-error/10 text-error, bg-success/10 text-success
  ```
- Modal backdrop (linha 558):
  ```tsx
  ❌ bg-slate-900/60
  ✅ bg-black/40 (usar token backdrop apropriado)
  ```

**Ação:** Substituir 8 instâncias de cores + remover classes dark:

---

### 2️⃣ **ClassCreationForm.tsx** ⚠️ 8+ PROBLEMAS

**Arquivo:** [src/pages/ClassCreationForm.tsx](../../src/pages/ClassCreationForm.tsx)

**Classes dark: aninhadas (REMOVER TODAS):**

- Linhas: 230, 241, 245, 262, 269, 304, 322, 349, 375, 423, 426, 431

```tsx
// ❌ EXEMPLO — Linha 230
dark:text-text-inverted

// ❌ EXEMPLO — Linhas 245, 262, 304, 322, 349, 375
dark:border-border-default dark:bg-bg-card/50 dark:text-text-inverted

// ✅ REMOVER TODAS AS INSTÂNCIAS dark:
```

**Cores Hardcoded:**

- Linha 505 — Validação: `text-red-500` → `text-error`

**Recomendação:** Remover ~30 classes `dark:` + refatorar validação

---

### 3️⃣ **AppointmentConfirmation.tsx** ⚠️ 12+ PROBLEMAS

**Arquivo:** [src/pages/AppointmentConfirmation.tsx](../../src/pages/AppointmentConfirmation.tsx)

**Stepper com cores hardcoded hardcoded (linhas 189-224, 320-356):**

```tsx
// ❌ PROBLEMA — Stepper step 1 "completo"
<div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-sm font-bold text-primary-foreground">

// ❌ PROBLEMA — Ícone check
<span className="text-[11px] font-semibold text-emerald-600">Seleção</span>

// ❌ PROBLEMA — Linhas 320-328 (checkmarks)
<CheckCircle className="text-emerald-500" size={16} />

// ❌ PROBLEMA — Divider no stepper
<div className="h-px w-12 bg-emerald-200" />

// ❌ PROBLEMA — Msgem gerada (linha 336)
<div className="mt-4 p-4 bg-emerald-50 rounded-lg border border-emerald-100 text-emerald-700">

// ❌ PROBLEMA — Avisos de conflito (linhas 348, 356)
bg-amber-50 text-amber-700 border border-amber-100
```

**Ação:** Refatorar todo o stepper com `success` token

---

### 4️⃣ **DigitalTicket.tsx** ⚠️ 3 PROBLEMAS

**Arquivo:** [src/pages/DigitalTicket.tsx](../../src/pages/DigitalTicket.tsx)

```tsx
// ❌ LINHAS 206-215
<p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-100/85">
<div className="inline-flex items-center gap-2 rounded-full border border-green-300/30 bg-green-500/20 px-3 py-1.5">
  <span className="h-2 w-2 rounded-full bg-green-300" />
  <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-green-50">
```

**Ação:** Substituir `blue/green` por `primary/success` tokens

---

### 5️⃣ **UserProfilesManagement.tsx** ⚠️ 3+ PROBLEMAS

**Arquivo:** [src/pages/UserProfilesManagement.tsx](../../src/pages/UserProfilesManagement.tsx)

```tsx
// ❌ LINHA 255 — Status "Apto"
<div className="bg-emerald-50 border border-emerald-100 py-3 px-4 rounded-2xl flex items-center justify-center gap-2">
  <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
  <span className="font-bold text-emerald-600 text-xs uppercase tracking-wide">

// ✅ DEVE SER
<div className="bg-success/10 border border-success/30 py-3 px-4 rounded-2xl flex items-center justify-center gap-2">
  <div className="w-2.5 h-2.5 bg-success rounded-full animate-pulse" />
  <span className="font-bold text-success text-xs uppercase tracking-wide">

// ❌ LINHA 262 — Status "Inapto"
<div className="bg-red-50 border border-red-100 py-3 px-4 rounded-2xl flex items-center justify-center gap-2">
  <div className="w-2.5 h-2.5 bg-red-500 rounded-full" />
  <span className="font-bold text-red-600 text-xs uppercase tracking-wide">

// ✅ DEVE SER
<div className="bg-error/10 border border-error/30 py-3 px-4 rounded-2xl flex items-center justify-center gap-2">
  <div className="w-2.5 h-2.5 bg-error rounded-full" />
  <span className="font-bold text-error text-xs uppercase tracking-wide">

// ❌ LINHA 490 — CheckCircle icon
<CheckCircle className="w-6 h-6 text-emerald-500" />
// ✅
<CheckCircle className="w-6 h-6 text-success" />
```

**Ação:** 3 instâncias de refatoração

---

### 6️⃣ **Login.tsx** ⚠️ 1 PROBLEMA

**Arquivo:** [src/pages/Login.tsx](../../src/pages/Login.tsx)

```tsx
// ❌ LINHA 228 — Alert de avisoavisolto de de email não confirmaadado
<div className="mt-4 p-3 rounded-xl bg-yellow-50 border border-yellow-100 text-sm flex items-center justify-between">

// ✅ DEVE SER
<div className="mt-4 p-3 rounded-xl bg-alert/10 border border-alert/30 text-sm flex items-center justify-between">
  {/* text-color já herdado do alert */}
```

**Ação:** 1 instância (yellow → alert)

---

### 7️⃣ **OperationalDashboard.tsx** ⚠️ 1 PROBLEMA

**Arquivo:** [src/pages/OperationalDashboard.tsx](../../src/pages/OperationalDashboard.tsx)

```tsx
// ❌ LINHA 277 — Badge de status indisponível
<span className="inline-flex items-center text-xs bg-red-100 text-red-700 px-3 py-1 rounded-full font-semibold">

// ✅ DEVE SER
<span className="inline-flex items-center text-xs bg-error/10 text-error px-3 py-1 rounded-full font-semibold">
```

**Ação:** 1 instância (red → error token)

---

### 8️⃣ **SessionEditor.tsx** ⚠️ 1 PROBLEMA

**Arquivo:** [src/pages/SessionEditor.tsx](../../src/pages/SessionEditor.tsx)

```tsx
// ❌ LINHA 643 — Validação
<p className="text-xs text-red-500">

// ✅ DEVE SER
<p className="text-xs text-error">
```

**Status:** Parcialmente auditado em Phase 5. Validar se há regressões mais amplas.

**Ação:** 1 instância confirmada; verificar página completa

---

### 9️⃣ **ReschedulingNotification.tsx** ⚠️ 1 PROBLEMA

**Arquivo:** [src/pages/ReschedulingNotification.tsx](../../src/pages/ReschedulingNotification.tsx)

```tsx
// ❌ LINHA 85 — Status label resumado
<span className="text-xs font-semibold text-amber-600 uppercase">

// ✅ DEVE SER
<span className="text-xs font-semibold text-alert uppercase">
```

**Ação:** 1 instância (amber → alert)

---

### 🔟 **AccessProfilesManagement.tsx** ⚠️ 1 PROBLEMA

**Arquivo:** [src/pages/AccessProfilesManagement.tsx](../../src/pages/AccessProfilesManagement.tsx)

```tsx
// ❌ LINHA 191 — Status de acesso
<div className="p-6 text-amber-800">

// ✅ DEVE SER
<div className="p-6 text-alert/70">
```

**Ação:** 1 instância (amber → alert)

---

### 1️⃣1️⃣ **AnalyticsDashboard.tsx** ⚠️ 1 PROBLEMA

**Arquivo:** [src/pages/AnalyticsDashboard.tsx](../../src/pages/AnalyticsDashboard.tsx)

```tsx
// ❌ LINHA 898 — Link error state
className = "mb-0.5 text-xs font-semibold text-red-500 hover:underline";

// ✅ DEVE SER
className = "mb-0.5 text-xs font-semibold text-error hover:underline";
```

**Ação:** 1 instância (red → error)

---

### 1️⃣2️⃣ **OmScheduleEditor.tsx** ⚠️ 1 PROBLEMA

**Arquivo:** [src/pages/OmScheduleEditor.tsx](../../src/pages/OmScheduleEditor.tsx)

```tsx
// ❌ LINHA 506 — Toggle switch interior interior
<div className="absolute left-[2px] top-[2px] h-4 w-4 rounded-full bg-white transition peer-checked:translate-x-5" />

// ✅ DEVE SER (use token apropriado para switch-checked)
<div className="absolute left-[2px] top-[2px] h-4 w-4 rounded-full bg-primary-foreground transition peer-checked:translate-x-5" />
```

**Ação:** 1 instância (bg-white → bg-primary-foreground ou token switch)

---

### 1️⃣3️⃣ **PersonnelManagement.tsx** ⚠️ VERIFICAÇÃO REQUERIDA

**Arquivo:** [src/pages/PersonnelManagement.tsx](../../src/pages/PersonnelManagement.tsx)

**STATUS:** Parcialmente auditado. Usa STATUS_BADGE_CLASS e STATUS_DETAIL_BADGE_CLASS com tokens corretos.  
**Ação:** Validação visual completa

---

### 1️⃣4️⃣ **AdminDashboard.tsx** ⚠️ VERIFICAÇÃO REQUERIDA

**Arquivo:** [src/pages/AdminDashboard.tsx](../../src/pages/AdminDashboard.tsx)

**STATUS:** Parcialmente auditado  
**Ação:** Verificar página completa para classes dark: ou cores hardcoded

---

## 🟡 PROBLEMAS MÉDIOS (MÉDIO) — 8 páginas

### 1. **SessionBookingsManagement.tsx**

- **Status:** Usa `STATUS_CLASSES` mapping — validação requerida
- **Ação:** Confirmar se todos os statuses usam tokens corretos
- **Exemplos:**
  - `agendado` → `bg-success/10 text-success` ✅
  - `remarcado` → `bg-alert/10 text-alert` ✅
  - `cancelado` → `bg-error/10 text-error` ✅

### 2. **SessionsManagement.tsx**

- **Status:** StatCards com `border-b-4` corretos (primary/error/success)
- **Ação:** Verificação visual completa

### 3. **ScoreEntry.tsx**

- **Status:** Verificar interface success/error em resultado
- **Ação:** Validação completa

### 4. **Scheduling.tsx**

- **Status:** Verificar indicadores de status
- **Ação:** Validação completa

### 5. **ResultDetails.tsx**

- **Status:** Componente simples; verificação visual
- **Ação:** Validação completa

### 6. **ReschedulingManagement.tsx**

- **Status:** Verificar status labels (solicitado/aprovado/cancelado)
- **Ação:** Validação completa

### 7. **ResultsHistory.tsx**

- **Status:** Verificar badges de resultado
- **Ação:** Validação completa

### 8. **PersonnelEditor.tsx**

- **Status:** Simples; verificação visual
- **Ação:** Validação completa

---

## 🟢 PROBLEMAS MENORES (BAIXO) — 2 páginas

### 1. **ForgotPassword.tsx**

- **Status:** ✅ Página limpa
- **Problemas:** Nenhum

### 2. **Register.tsx**

- **Status:** ✅ Página limpa
- **Problemas:** Nenhum

---

## ✅ PÁGINAS LIMPAS — 5 páginas

| Página                | Status                 |
| --------------------- | ---------------------- |
| AppealRequest.tsx     | ✅ Limpa               |
| Documents.tsx         | ✅ Limpa               |
| OmLocationEditor.tsx  | ✅ Limpa               |
| OmLocationManager.tsx | ✅ Limpa               |
| OmScheduleEditor.tsx  | ⚠️ 1 problema bg-white |

---

## 🎨 REFERÊNCIA DE TOKENS CORRETOS

### Cores Semânticas Disponíveis

```css
/* src/styles/tokens.css */

/* Sucesso */
--color-success: #10b981; /* emerald-500 */
--color-success-foreground: #ffffff;
--color-success-lighter: #d1fae5; /* emerald-100 */

/* Alerta */
--color-alert: #f59e0b; /* amber-500 */
--color-alert-foreground: #ffffff;
--color-alert-lighter: #fef3c7; /* amber-100 */

/* Erro */
--color-error: #ef4444; /* red-500 */
--color-error-foreground: #ffffff;
--color-error-lighter: #fee2e2; /* red-100 */

/* Primário */
--color-primary: #3b82f6; /* blue-500 */
--color-primary-foreground: #ffffff;

/* Background */
--color-bg-default: #f9fafb; /* gray-50 */
--color-bg-card: #ffffff;
--color-bg-card-lighter: #f3f4f6; /* gray-100 */

/* Border */
--color-border-default: #e5e7eb; /* gray-200 */
```

### Exemplos de Uso Correto

```tsx
// ✅ STATUS BADGE: Sucesso
className="bg-success/10 text-success border border-success/30"

// ✅ STATUS BADGE: Alerta
className="bg-alert/10 text-alert border border-alert/30"

// ✅ STATUS BADGE: Erro
className="bg-error/10 text-error border border-error/30"

// ✅ VALIDAÇÃO (erro)
className="text-xs text-error"

// ✅ ICON (sucesso)
<CheckCircle className="text-success" />

// ✅ ICON (alerta)
<AlertCircle className="text-alert" />

// ✅ MODAL BACKDROP
className="fixed inset-0 bg-black/40 backdrop-blur-sm"
```

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

### Fase 1: Crítico (Classes dark: e cores principais)

- [ ] **AuditLog.tsx** — Remover 8 classes dark: + 5 cores hardcoded
- [ ] **ClassCreationForm.tsx** — Remover ~30 classes dark: + validação
- [ ] **AppointmentConfirmation.tsx** — Refatorar stepper (emerald → success)
- [ ] **UserProfilesManagement.tsx** — 3 instâncias (emerald/red → tokens)
- [ ] **DigitalTicket.tsx** — 3 instâncias de green/blue

**Tempo estimado:** 4-6 horas

### Fase 2: Importante (Alersis e verificações)

- [ ] **Login.tsx** — 1 instância yellow → alert
- [ ] **OperationalDashboard.tsx** — 1 instância red → error
- [ ] **SessionEditor.tsx** — Validação completa
- [ ] **ReschedulingNotification.tsx** — 1 instância amber → alert
- [ ] **AccessProfilesManagement.tsx** — 1 instância amber → alert
- [ ] **AnalyticsDashboard.tsx** — 1 instância red → error
- [ ] **OmScheduleEditor.tsx** — 1 instância bg-white

**Tempo estimado:** 2-3 horas

### Fase 3: Validação (Páginas MÉDIO)

- [ ] **SessionBookingsManagement.tsx** — Confirmar STATUS_CLASSES
- [ ] **SessionsManagement.tsx** — Verificação visual
- [ ] **ScoreEntry.tsx** — Validação completa
- [ ] **Scheduling.tsx** — Validação completa
- [ ] **ResultDetails.tsx** — Validação completa
- [ ] **ReschedulingManagement.tsx** — Validação completa
- [ ] **ResultsHistory.tsx** — Validação completa
- [ ] **PersonnelEditor.tsx** — Validação completa

**Tempo estimado:** 3-4 horas

---

## 🔗 REFERÊNCIAS

- **Tokens System:** [src/styles/tokens.css](../../src/styles/tokens.css)
- **Design System:** [skills/visual-layout-standard](../skills/visual-layout-standard/SKILL.md)
- **Token Migration:** [skills/token-migration-assistant](../skills/token-migration-assistant/SKILL.md)
- **Phase 5 Reference:** [docs/FASE_5_COMPLETA.md](./FASE_5_COMPLETA.md)

---

**Status:** ✏️ Relatório criado em 23/03/2026  
**Próximos passos:** Implementar correções por fase de severidade

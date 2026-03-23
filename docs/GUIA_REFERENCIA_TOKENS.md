# 🎨 GUIA DE REFERÊNCIA RÁPIDA - Tokens Visuais TACF Digital

**Uso:** Consulte este guia enquanto implementa as correções de design

---

## 1️⃣ SUBSTITUIÇÕES RÁPIDAS

### Cores de Status

| Problema ❌                                 | Solução ✅                     | Caso de Uso              |
| ------------------------------------------- | ------------------------------ | ------------------------ |
| `text-red-500` / `text-red-600`             | `text-error`                   | Texto de erro, validação |
| `bg-red-50` / `bg-red-100`                  | `bg-error/10`                  | Fundo de mensagem erro   |
| `border-red-200` / `border-red-300`         | `border-error/30`              | Borda de alerta erro     |
| `text-emerald-500` / `text-emerald-600`     | `text-success`                 | Ícone/texto sucesso      |
| `bg-emerald-50` / `bg-emerald-100`          | `bg-success/10`                | Fundo sucesso            |
| `border-emerald-200` / `border-emerald-300` | `border-success/30`            | Borda sucesso            |
| `text-amber-600` / `text-amber-700`         | `text-alert`                   | Texto alerta             |
| `bg-amber-50` / `bg-amber-100`              | `bg-alert/10`                  | Fundo alerta             |
| `border-amber-200` / `border-amber-300`     | `border-alert/30`              | Borda alerta             |
| `bg-yellow-50` / `bg-yellow-100`            | `bg-alert/10`                  | Fundo de aviso           |
| `bg-blue-500` / `bg-blue-50`                | `bg-primary` / `bg-primary/10` | Primário                 |
| `text-blue-500`                             | `text-primary`                 | Texto primário           |
| `bg-slate-900/60`                           | `bg-black/40`                  | Modal/backdrop           |
| `bg-white` (toggles)                        | `bg-primary-foreground`        | Switch interior          |

---

### Ícones Coloridos

| Problema ❌                                    | Solução ✅                                 | Exemplo           |
| ---------------------------------------------- | ------------------------------------------ | ----------------- |
| `<CheckCircle className="text-emerald-500" />` | `<CheckCircle className="text-success" />` | Ícone confirmação |
| `<AlertCircle className="text-red-600" />`     | `<AlertCircle className="text-error" />`   | Ícone aviso       |
| `<AlertTriangle className="text-amber-600" />` | `<AlertTriangle className="text-alert" />` | Ícone alerta      |

---

### Status Badges (Padrão)

```tsx
// ❌ ANTES (Inconsistente)
<span className="bg-emerald-50 text-emerald-600 border border-emerald-200 px-3 py-1 rounded-full">
  Sucesso
</span>

// ✅ DEPOIS (Consistente)
<span className="bg-success/10 text-success border border-success/30 px-3 py-1 rounded-full">
  Sucesso
</span>
```

---

## 2️⃣ PADRÕES DE COMPONENTES

### Status Indicator Circulado

```tsx
// ✅ CORRETO — success
<div className="w-2.5 h-2.5 rounded-full bg-success animate-pulse" />

// ✅ CORRETO — alert
<div className="w-2.5 h-2.5 rounded-full bg-alert" />

// ✅ CORRETO — error
<div className="w-2.5 h-2.5 rounded-full bg-error" />
```

### Botões Status

```tsx
// ✅ CORRETO — Estado ativo success
className = "border-success/40 bg-success/10 text-success";

// ✅ CORRETO — Estado inativo
className = "border-border-default text-text-muted";

// ❌ EVITAR — Dark mode
className = "dark:bg-success-900/20 dark:text-success-400";
```

### Alerts/Toasts

```tsx
// ✅ CORRETO — Mensagem erro
<div className="bg-error/10 border border-error/30 text-error rounded-lg p-4">
  Ocorreu um erro
</div>

// ✅ CORRETO — Mensagem alerta
<div className="bg-alert/10 border border-alert/30 text-alert rounded-lg p-4">
  Aviso importante
</div>

// ✅ CORRETO — Mensagem sucesso
<div className="bg-success/10 border border-success/30 text-success rounded-lg p-4">
  Operação concluída
</div>
```

---

## 3️⃣ CLASSES PARA REMOVER (dark:)

Lista completa de classes que **DEVEM SER REMOVIDAS** (projeto é light-only):

```
❌ dark:bg-slate-800/20
❌ dark:bg-emerald-900/20
❌ dark:bg-amber-900/20
❌ dark:bg-red-900/20
❌ dark:text-emerald-400
❌ dark:text-amber-400
❌ dark:text-red-400
❌ dark:text-text-inverted
❌ dark:text-text-muted
❌ dark:border-border-default
❌ dark:bg-bg-card/50
❌ dark:divide-slate-800
❌ dark:border-border-default
❌ dark:hover:bg-hover
❌ dark:divide-border-default
```

**Atalho:** Procure por `dark:` e remova todas as instâncias.

---

## 4️⃣ MAPEAMENTO DE ENUMS/TIPOS

### Booking Status

| Valor BD    | Componente | Badge                        |
| ----------- | ---------- | ---------------------------- |
| `agendado`  | Confirmado | `bg-success/10 text-success` |
| `remarcado` | Reagendado | `bg-alert/10 text-alert`     |
| `cancelado` | Cancelado  | `bg-error/10 text-error`     |

### Apt Status

| Valor    | Icon                                        | Badge                        |
| -------- | ------------------------------------------- | ---------------------------- |
| `apto`   | `<CheckCircle2 className="text-success" />` | `bg-success/10 text-success` |
| `inapto` | `<XCircle className="text-error" />`        | `bg-error/10 text-error`     |

### Session Status

| Valor       | Badge                        | Descrição                    |
| ----------- | ---------------------------- | ---------------------------- |
| `open`      | `bg-primary/10 text-primary` | Sessão aberta para inscrição |
| `closed`    | `bg-error/10 text-error`     | Sessão fechada               |
| `completed` | `bg-success/10 text-success` | Sessão concluída             |

---

## 5️⃣ FERRAMENTAS PARA VERIFICAÇÃO

### Após editar, execute:

```bash
# 1. Validar tipagem
npx tsc --noEmit

# 2. Validar linting
yarn lint

# 3. Build test
yarn build

# 4. Iniciar dev server
yarn dev
```

### Verificação Visual Local

```bash
yarn dev
# Acesse: http://localhost:5173
# Navegue pelas páginas corrigidas
# Abra DevTools > Console para ver warnings
```

---

## 6️⃣ CHECKLIST POR PÁGINA

### AuditLog.tsx

- [ ] Remover classe `dark:` de linhas 57, 65, 73, 321, 404, 558
- [ ] Substituir `bg-emerald-50 text-emerald-700` → `bg-success/10 text-success`
- [ ] Substituir `bg-amber-50 text-amber-700` → `bg-alert/10 text-alert`
- [ ] Substituir `bg-red-50 text-red-700` → `bg-error/10 text-error`
- [ ] Borders: `border-l-emerald-500` → `border-l-success`, etc
- [ ] Icons: `bg-red-500/10 text-red-600` → `bg-error/10 text-error`
- [ ] Modal: `bg-slate-900/60` → `bg-black/40`

### ClassCreationForm.tsx

- [ ] Remover ~30 instâncias de `dark:`
- [ ] Validação: `text-red-500` → `text-error`

### AppointmentConfirmation.tsx

- [ ] Stepper: `bg-emerald-500` → `bg-success`
- [ ] Steps: `text-emerald-600` → `text-success`
- [ ] Icons: `text-emerald-500` → `text-success`
- [ ] Dividers: `bg-emerald-200` → `bg-success/30`
- [ ] Container: `bg-emerald-50` → `bg-success/10`

### DigitalTicket.tsx

- [ ] `text-blue-100/85` → `text-primary-foreground/85`
- [ ] `bg-green-500/20` → `bg-success/20`
- [ ] `border-green-300/30` → `border-success/30`
- [ ] `bg-green-300` → `bg-success`

### UserProfilesManagement.tsx

- [ ] "Apto": `bg-emerald-50` → `bg-success/10`, `text-emerald-600` → `text-success`
- [ ] "Inapto": `bg-red-50` → `bg-error/10`, `text-red-600` → `text-error`
- [ ] Icon: `text-emerald-500` → `text-success`

### Outros (uma instância cada)

- [ ] Login (linha 228): `bg-yellow-50` → `bg-alert/10`
- [ ] OperationalDashboard (linha 277): `bg-red-100` → `bg-error/10`
- [ ] SessionEditor (linha 643): `text-red-500` → `text-error`
- [ ] ReschedulingNotification (linha 85): `text-amber-600` → `text-alert`
- [ ] AccessProfilesManagement (linha 191): `text-amber-800` → `text-alert/70`
- [ ] AnalyticsDashboard (linha 898): `text-red-500` → `text-error`
- [ ] OmScheduleEditor (linha 506): `bg-white` → `bg-primary-foreground`

---

## 7️⃣ TOKENS DISPONÍVEIS (Arquivo: src/styles/tokens.css)

```css
/* Cores Semânticas */
--color-success: #10b981;
--color-alert: #f59e0b;
--color-error: #ef4444;
--color-primary: #3b82f6;

/* Foreground */
--color-success-foreground: #ffffff;
--color-alert-foreground: #ffffff;
--color-error-foreground: #ffffff;
--color-primary-foreground: #ffffff;

/* Background */
--color-bg-default: #f9fafb;
--color-bg-card: #ffffff;

/* Text */
--color-text-body: #111827;
--color-text-muted: #6b7280;

/* Border */
--color-border-default: #e5e7eb;
```

**Usar em Tailwind:**

```tsx
bg - success; // #10b981
bg - success / 10; // rgba com 10% opacity
text - success; // #10b981
border - success; // #10b981
border - success / 30; // rgba com 30% opacity
```

---

## 8️⃣ EXEMPLO DE REFATORAÇÃO PRONTO

### Antes ❌

```tsx
<div className="bg-emerald-50 border border-emerald-100 py-3 px-4 rounded-2xl flex items-center justify-center gap-2">
  <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
  <span className="font-bold text-emerald-600 text-xs uppercase tracking-wide">
    Apto para o TACF
  </span>
</div>
```

### Depois ✅

```tsx
<div className="bg-success/10 border border-success/30 py-3 px-4 rounded-2xl flex items-center justify-center gap-2">
  <div className="w-2.5 h-2.5 bg-success rounded-full animate-pulse" />
  <span className="font-bold text-success text-xs uppercase tracking-wide">
    Apto para o TACF
  </span>
</div>
```

---

## 9️⃣ DÚVIDAS FREQUENTES

**P: Por que remover `dark:`?**  
R: O projeto não suporta dark mode. Todos os estilos são para light mode apenas.

**P: E se eu usar `bg-success` sem `/10`?**  
R: Funciona, mas use `/10` para backgrounds mais suaves e legíveis (padrão do projeto).

**P: Como saber qual token usar?**  
R: Veja a tabela na seção 1️⃣. Verde/ok = `success`, Vermelho/erro = `error`, Amarelo/aviso = `alert`.

**P: Posso mesclar tokens antigos com novos?**  
R: Não, sempre use os novos tokens. Após esta auditoria, refatore 100% para tokens.

**P: Onde reportar problemas encontrados durante refatoração?**  
R: Documente em session memory ou na aba Issues do repo.

---

## 🔟 RECURSOS EXTERNOS

- **Sistema de Design:** [src/styles/tokens.css](../src/styles/tokens.css)
- **Auditoria Completa:** [docs/AUDITORIA_VISUAL_COMPLETA.md](./AUDITORIA_VISUAL_COMPLETA.md)
- **Resumo Executivo:** [docs/AUDITORIA_RESUMO_EXECUTIVO.md](./AUDITORIA_RESUMO_EXECUTIVO.md)
- **Phase 5 Docs:** [docs/FASE_5_COMPLETA.md](./FASE_5_COMPLETA.md)

---

**Última atualização:** 23 de março de 2026  
**Status:** ✅ Pronto para usar  
**Criado por:** GitHub Copilot Design Audit Agent

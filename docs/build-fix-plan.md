# Plano de Correção — Build Errors (95 erros)

**Data:** 2026-03-02  
**Comando:** `yarn build` (tsc -b && vite build)  
**Causa raiz:** Tipos Supabase incompletos + padrões de API deprecated do supabase-js v2.

---

## Raiz dos problemas

### 1. `database.types.ts` desatualizado

O tipo `Database` em `src/types/database.types.ts` **não contém**:

- `swap_requests` (tabela) → causa `never` em `ResultsHistory.tsx` e `services/bookings.ts`
- `Functions` (RPCs) → `.rpc<T>()` não encontra assinatura → causa `"T must extend string"` em `useDashboard.ts`, `usePaginatedQuery.ts`, `useSessions.ts`, `supabase.ts`, `SystemSettings.tsx`

**Fix:** Adicionar `swap_requests` e a seção `Functions` ao arquivo de tipos.

### 2. `.from<T>()` com um argumento — padrão Supabase v1 (deprecated)

Padrão: `supabase.from<Database["..."]["Row"]>("tabela")`  
O supabase-js v2 espera **dois** argumentos de tipo. Usar `.from()` sem genérico e fazer cast é o padrão correto.

**Arquivos afetados:**

- `src/hooks/useAuth.ts` (linhas 34, 57, 65, 115)
- `src/pages/SessionBookingsManagement.tsx` (linhas 80, 90, 111, 172, 194)
- `src/services/bookings.ts` (linha 15)
- `src/pages/ResultsHistory.tsx` (linha 83)

**Fix:** Remover o genérico, manter `as` cast no resultado.

### 3. `.rpc<T>()` — constraint mudou para `T extends string`

Padrão antigo: `supabase.rpc<MinhaInterface[]>("funcao")`  
No supabase-js v2 recente, o genérico deve ser `string` (nome da função). Resultado é inferido pelo tipo `Functions`.

**Arquivos afetados:**

- `src/hooks/useDashboard.ts` (linha 56)
- `src/hooks/usePaginatedQuery.ts` (linha 38)
- `src/hooks/useSessions.ts` (linha 25)
- `src/services/supabase.ts` (linha 29)
- `src/pages/SystemSettings.tsx` (linha 63)

**Fix:** Remover genérico do `.rpc<>()` e usar `as` cast ou deixar inferência após adicionar `Functions` ao tipo.

### 4. `publicURL` → `publicUrl` (Supabase Storage v2)

- `src/services/bookings.ts` linha 51: `publicURL` → `publicUrl`

### 5. `@ts-expect-error` desnecessários (erros que não existem mais)

- `src/components/AutoRedirect.tsx` linha 36
- `src/components/ProtectedRoute.tsx` linha 36
- `src/hooks/useAuth.ts` linha 143

**Fix:** Remover as diretivas ou trocar pela tipagem correta do `subscription`.

### 6. Isolados — componentes/pages

| Arquivo                    | Linha    | Erro                                                          | Fix                                                               |
| -------------------------- | -------- | ------------------------------------------------------------- | ----------------------------------------------------------------- |
| `AuditLog.tsx`             | 357, 387 | `string \| undefined` não atribuível a `string \| null`       | `r.action ?? null`                                                |
| `OperationalDashboard.tsx` | 28, 31   | `name` e `inspsau_valid_until` ausentes no tipo Profile       | Usar `full_name` só ou estender tipo local                        |
| `ForgotPassword.tsx`       | 100      | `Mail` (Lucide) não bate com `ComponentType<{size?: number}>` | Passar `icon` como `ComponentType<LucideProps>`                   |
| `PersonnelManagement.tsx`  | 149      | Spread em `never`                                             | Cast para `Record<string, unknown>` antes do spread               |
| `SystemSettings.tsx`       | 303, 317 | `variant` não existe em `Button`                              | Verificar o componente `Button` e adicionar prop ou remove a prop |
| `SessionEditor.tsx`        | 139, 166 | `.update()` com `unknown`                                     | Cast explícito ou refatorar o update                              |

---

## Ordem de execução

```
[1] Atualizar database.types.ts — adicionar swap_requests + Functions
    → Desbloqueará ~40–50 erros de "never"

[2] Remover genéricos de .from<T>() — usar from() sem genérico + cast
    → Desbloqueará erros TS2558 (Expected 2 type arguments, got 1)

[3] Remover genéricos de .rpc<T>() — usar cast ou inferência via Functions
    → Desbloqueará erros TS2344

[4] publicURL → publicUrl
    → 1 linha

[5] Remover @ts-expect-error desnecessários
    → 3 linhas

[6] Correções pontuais de componentes
    → AuditLog, OperationalDashboard, ForgotPassword, PersonnelManagement, SystemSettings, SessionEditor
```

---

## Estimativa de erros restantes por etapa

| Após etapa | Erros restantes (estimado) |
| ---------- | -------------------------- |
| 1          | ~45                        |
| 2          | ~25                        |
| 3          | ~10                        |
| 4–5        | ~7                         |
| 6          | 0                          |

---

## Verificação final

```bash
npx tsc --noEmit   # deve retornar 0 erros
yarn build         # deve gerar dist/ sem falhar
```

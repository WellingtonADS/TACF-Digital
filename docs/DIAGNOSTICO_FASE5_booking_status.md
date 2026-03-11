# Diagnóstico Fase 5: Mix de booking.status EN/PT-BR

**Data:** 11 de março de 2026  
**Status:** ⚠️ Requer ação humana (HACO)  
**Prioridade:** Alta

---

## Problema

O banco de dados define `booking.status` com enum PT-BR:

```sql
CREATE TYPE booking_status AS ENUM ('agendado', 'cancelado', 'remarcado');
```

Mas o código frontend usa valores EN em pelo menos **4 arquivos críticos**, e pode haver dados antigos em EN no banco:

| Arquivo                                   | Ocorrências | Valores EN usados                              |
| ----------------------------------------- | ----------- | ---------------------------------------------- |
| `src/pages/SessionBookingsManagement.tsx` | 15+         | `"confirmed"`, `"pending"`, `"cancelled"`      |
| `src/pages/ReschedulingManagement.tsx`    | 12+         | `"confirmed"`, `"pending_swap"`, `"cancelled"` |
| `src/pages/AdminDashboard.tsx`            | 2           | `"confirmed"` (query)                          |
| `src/pages/ResultsHistory.tsx`            | 1           | `"pending"` (query swap_requests)              |

---

## Root Cause

1. **Dados antigos no banco** — dados migrados antes do schema PT-BR ficar final
2. **Código divergente** — páginas usam EN para filtrar/comparar, desconexão com tipos
3. **ResultsHistory bug** — usa `"pending"` em `swap_requests` quando o enum é `swap_status` = `"solicitado"|"aprovado"|"cancelado"`

---

## Mapeamento Correto

### booking.status (atual: PT-BR)

```
DB enum:     agendado    | cancelado    | remarcado
Código usa:  confirmed   | cancelled    | pending    (ERRADO)
```

### swap_requests.status

```
DB enum:     solicitado  | aprovado     | cancelado
Código usa:  pending_swap (booking atr) | confirmed | cancelled (ERRADO)
```

---

## Ação Necessária

### 1. Data Migration (SQL prep — não executar sem aprovação)

```sql
-- Se há dados EN no banco:
UPDATE bookings SET status = 'agendado'::booking_status WHERE status ~ '^confirmed';
UPDATE bookings SET status = 'cancelado'::booking_status WHERE status ~ '^cancelled';
UPDATE bookings SET status = 'remarcado'::booking_status WHERE status ~ '^pending';
```

### 2. Código Frontend (pós-migration ou se banco já está limpo)

- [ ] `SessionBookingsManagement.tsx` — mapear `confirmed→agendado`, `cancelled→cancelado`, `pending→?` (inexistente em PT-BR)
- [ ] `ReschedulingManagement.tsx` — mapear status PT-BR + remover lógica EN
- [ ] `AdminDashboard.tsx` — corrigir query filter
- [ ] `ResultsHistory.tsx` — usar `swap_status` enum correto, não `booking.status`

### 3. Verificação de Integridade

1. Auditar todos os bookings — confirmar que status é sempre PT-BR
2. Testar SessionBookingsManagement, ReschedulingManagement com dados reais
3. Verificar se `swap_requests` usa o enum correto

---

## Documentação Atual (após Fases 1-3)

✅ **Fase 1** — tipos.ts sincronizados:

- Aliases de enum (DRY)
- Removidas colunas fantasma
- Sessions, bookings, locations com tipos corretos
- Tabelas dropadas removidas dos tipos

✅ **Fase 2** — index.ts limpo

- Removidos imports de tabelas inexistentes

✅ **Fase 3** — period uniformizado PT-BR

- OmScheduleEditor, SessionEditor, ClassCreationForm
- booking.ts fallbacks removidos

✅ **Fase 4** — Migration DB criada

- Arquivo: `supabase/migrations/20260311_fix_location_schedules_period_ptbr.sql`
- Aguardando aplicação + validação

⏳ **Fase 5** — Este diagnóstico

---

## Próximos Passos

1. **HACO** revisa este documento
2. **DBA** valida estado do banco (há dados EN em booking.status?)
3. **SE escolhe caminho:**
   - **Se banco limpo (só PT-BR):** Refatorar código frontend direto (2-4h)
   - **Se banco misto:** Data migration primeiro, depois refator frontend (4-6h + testes)
4. **QA** testa SessionBookingsManagement, ReschedulingManagement em staging

---

## Referências

- [SessionBookingsManagement.tsx](../../src/pages/SessionBookingsManagement.tsx#L66-L169)
- [ReschedulingManagement.tsx](../../src/pages/ReschedulingManagement.tsx#L50-L250)
- [database.types.ts — BookingStatus](../../src/types/database.types.ts#L16)
- [database.types.ts — SwapStatus](../../src/types/database.types.ts#L17)

---

**Criado:** 11 de março de 2026  
**Autor:** Análise automática (Copilot)  
**Requer:** Aprovação HACO + análise DBA

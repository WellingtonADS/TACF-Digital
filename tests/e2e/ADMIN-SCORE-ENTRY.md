# E2E Score Entry Admin - Guia de Execução

## Arquivo Criado

- **[tests/e2e/admin-score-entry.spec.ts](tests/e2e/admin-score-entry.spec.ts)** — Teste E2E completo para lançamento de índices de avaliação (Item 5.3 do Manual)

## Overview

O teste implementa um fluxo E2E **sem mocks**, contra banco de desenvolvimento real (Supabase), validando:

1. **Preparação**: Busca sessão com bookings Pendente via query SQL
2. **Navegação Real**: Login → Turmas → Lançar índices (ScoreEntry)
3. **Lançamento**: Seleciona militar Pendente → clica Apto → salva
4. **Validação**:
   - Badge muda Pendente → Apto imediatamente
   - Reload da página mantém estado (persistência real)
   - Query ao banco confirma `result_details = 'apto'`
5. **Teardown**: Restaura `result_details` original via conexão PG (sem poluição do dev)

## Pré-requisitos para Execução

### 1. Variáveis de Ambiente (`.env.local` ou `.env`)

```bash
# Credenciais Admin
E2E_ADMIN_EMAIL=seu_email_admin@example.com
E2E_ADMIN_PASSWORD=sua_senha_admin

# Conexão Banco (um dos pairs abaixo)
DATABASE_URL=postgresql://user:pass@host:5432/tacf_dev
# OU
SUPABASE_DB_URL=postgresql://user:pass@db.xxx.supabase.co:5432/postgres
# OU (se usar variáveis separadas)
PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=sua_senha
PGDATABASE=tacf_dev
```

### 2. Estado do Banco Dev

O teste requer **pelo menos uma sessão com bookings Pendente** (status `result_details IS NULL`):

```sql
-- Verificar antes de rodar
SELECT s.id, s.date, s.period, COUNT(b.id) as pending
FROM public.sessions s
LEFT JOIN public.bookings b ON b.session_id = s.id AND b.result_details IS NULL
WHERE s.date >= CURRENT_DATE
GROUP BY s.id, s.date, s.period
HAVING COUNT(b.id) > 0;
```

Se não houver sessões pendentes, criar uma via seed ou admin UI.

## Como Rodar

### Execução Padrão (headless)

```bash
yarn test:e2e admin-score-entry
```

### Execução com Navegador Visível (debugging)

```bash
yarn test:e2e admin-score-entry --headed
```

### Execução de Arquivo Específico

```bash
yarn test:e2e tests/e2e/admin-score-entry.spec.ts
```

### Relatório Após Execução

```bash
yarn test:e2e admin-score-entry
playwright show-report  # Abre html report
```

## Saída Esperada ✅

```
Admin score entry
  ✓ deve lançar índices (Apto) para um militar, validar persistência e limpar
    - ✓ Admin autenticado
    - ✓ Turmas carregadas
    - ✓ Sessão encontrada: 2025-03-15 • Tarde
    - ✓ Clicado em Lançar índices
    - ✓ ScoreEntry carregado
    - ✓ Filtro aplicado: "Silva, João"
    - ✓ Militar selecionado: Silva, João
    - ✓ Clicado em Apto
    - ✓ Salvo (latência: 342ms)
    - ✓ Badge atualizado para Apto
    - ✓ Persistência validada (Apto mantém após reload)
    - ✓ Banco confirma: result_details = apto
    - ✓ Teardown concluído
```

## Pontos Técnicos

### Helpers de Banco Adicionados em `tests/e2e/support/db.ts`

1. **`listSessionsWithPendingBookings()`** — Retorna sessões com `pending_count > 0`
2. **`listPendingBookingsInSession(sessionId)`** — Lista bookings Pendente de uma sessão
3. **`getBookingResultDetails(bookingId)`** — Busca valor atual de `result_details`
4. **`updateBookingResultDetails(bookingId, value)`** — Restaura valor para teardown

### Fluxo de Teardown

- No `test.afterEach()`, restaura **exatamente** o valor original de `result_details`
- Não deleta o booking (apenas reverte a mudança)
- Query verificada: `UPDATE public.bookings SET result_details = $2 WHERE id = $1`

### Seletores Utilizados

- **Sessão na tabela**: `button, tr` filtered por data + período
- **Lançar índices**: `getByRole('button').filter(hasText: /lançar/i)`
- **Campo busca militar**: `input[placeholder*='Buscar']`
- **Militar Pendente**: `button.filter(hasText: militar_name).filter(hasText: /Pendente/)`
- **Botão Apto**: `getByRole('button', {name: /Apto/}).filter(hasText: 'Apto')`
- **Botão Salvar**: `getByRole('button', {name: /Salvar/}).filter(hasText: /Salvar/)`

## Diagnósticos & Troubleshooting

### Credenciais Ausentes

```
✗ Credenciais E2E de admin ausentes: defina E2E_ADMIN_EMAIL e E2E_ADMIN_PASSWORD.
```

**Solução**: Definir `E2E_ADMIN_EMAIL` e `E2E_ADMIN_PASSWORD` em `.env`

### Conexão de Banco Ausente

```
✗ Conexão de banco ausente: defina DATABASE_URL, SUPABASE_DB_URL ou variáveis PG*.
```

**Solução**: Definir `DATABASE_URL` ou `SUPABASE_DB_URL` em `.env`

### Nenhuma Sessão com Bookings Pendente

```
Expected 0 to be greater than 0
```

**Solução**: Verificar se existem bookings com `result_details IS NULL` no banco dev. Se não, criar via admin UI ou seed.

### RLS Error (401/403)

Se houver erro de Row Level Security ao tentar atualizar `result_details`:

```
expect(saveResponse.ok()).toBeTruthy()  // Falha com 403
```

**Causas**:

- Conta admin não tem permissão de update em `bookings` (revisar `supabase/policies/rls.sql`)
- Sessão/booking não pertence ao `current_user_id` (políticas RLS podem estar bloqueando writes)

**Debug**: Ver console do test ou network tab do report para HTTP 403

### Latência Excessiva (>3s no RPC)

Se salvar demorar muito, annotations aparecerão no report:

```
rpc-latency: Salvar resultado latência: 2847ms
```

**Causas**: Load do Supabase, network lenta, ou query complexa. Revisar índices no banco se persistir.

### Timeout na Busca de Sessão

```
Timeout 10s exceeded waiting for sessionRow to be visible
```

**Causas**:

- Tabela de Turmas não carregou (network lento)
- Sessão não está em viewport (scroller)
- Data/período formatados diferente no HTML

**Debug**: Usar `--headed` para ver UI e confirmar que Turmas carregaram

## Integridade & Segurança

### Sem Dados Residuais

- Teste restaura estado original **sempre**, even em falha (via `afterEach`)
- Ambiente dev fica limpo para próximos testes
- Score/índice não é "deletado", apenas **revertido para NULL** (auditável)

### Row Level Security

- Admin deve ter `INSERT/UPDATE` em `bookings`
- Políticas RLS respeitadas: se falhar, erro será capturado em test assertions
- Sem bypass de segurança (queries via Supabase SDK, não raw SQL)

## Próximos Passos Opcionais

1. **Teste com Inapto**: Duplicar teste para validar `result_details = 'inapto'`
2. **Avanço Automático**: Validar que teste avança automaticamente para próximo Pendente após salvamento
3. **Histórico**: Se houver coluna de histórico, validar que registro aparece ali após save
4. **Mobile Responsividade**: Rodar em viewport mobile (400x600) para validar KISS requirement

---

**Documentação**: Versão 1.0 | 2025-02-04

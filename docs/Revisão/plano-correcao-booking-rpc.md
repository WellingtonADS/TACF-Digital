# Plano de Implantacao - Correcao de consulta de agendamentos via RPC

## Objetivo

Migrar a consulta de datas agendadas do frontend (query direta em `bookings`) para RPC no banco, mantendo simplicidade, reaproveitamento e aderencia ao padrao do projeto.

## Escopo

- Alterar somente o que ja e usado hoje em producao:
  - `src/utils/booking.ts` (`fetchBookedDatesForUser`).
  - Novo RPC SQL em `supabase/rpc/`.
- Nao criar testes novos (nao solicitado).
- Nao alterar regras de negocio no frontend.

## Motivacao

- Centralizar regra/autorizacao no banco (`auth.uid()`).
- Evitar duplicacao de logica de seguranca no cliente.
- Reduzir risco de divergencia entre telas/fluxos.

## Plano detalhado (execucao)

### Fase 1 - Preparacao e verificacao

1. Confirmar nome/estrutura da tabela `bookings` e coluna `test_date` no schema atual.
2. Confirmar padrao de parametros nomeados usado nos RPCs existentes (`p_*`).
3. Confirmar que `fetchBookedDatesForUser` e usado por `Scheduling.tsx` (sem outros consumidores ocultos).

Saida esperada:

- Lista dos campos usados pelo RPC validada.

### Fase 2 - Criacao do RPC no banco

1. Criar `supabase/rpc/get_booked_dates.sql` com assinatura:
   - Entrada: `p_start date`, `p_end date`.
   - Saida: `table(test_date date)`.
2. Implementar filtro por usuario autenticado:
   - `where b.user_id = auth.uid()`.
3. Implementar filtro de periodo:
   - `and b.test_date between p_start and p_end`.
4. Ordenar retorno:
   - `order by b.test_date`.
5. Marcar funcao como `stable`.

Saida esperada:

- RPC pronto para uso pelo frontend com autorizacao no banco.

### Fase 3 - Refactor minimo no frontend

1. Em `src/utils/booking.ts`, substituir query direta por:
   - `supabase.rpc("get_booked_dates", { p_start: startStr, p_end: endStr })`.
2. Manter contrato atual da funcao:
   - Retorno `Promise<Set<string>>`.
3. Manter fallback simples:
   - Em erro/ausencia de dados, retornar `new Set()`.
4. Nao introduzir abstrações novas sem uso imediato.

Saida esperada:

- Mesmo comportamento externo, com fonte de dados via RPC.

### Fase 4 - Validacao tecnica

1. Rodar lint:

```bash
yarn lint
```

2. Rodar checagem de tipos:

```bash
npx tsc --noEmit
```

3. Validar fluxo funcional manual:

- Tela de agendamento carrega datas bloqueadas corretamente no intervalo.
- Usuario sem autenticacao nao recebe dados.

Saida esperada:

- Sem erro de lint/tipos e fluxo de agendamento preservado.

## Criterios de aceite

- `fetchBookedDatesForUser` nao usa mais `.from("bookings")` diretamente.
- Consulta de datas agendadas ocorre via `rpc("get_booked_dates", ...)`.
- Resultado funcional da tela permanece igual para usuario final.
- Sem criacao de codigo nao utilizado.

## Riscos e mitigacao

- Risco: nome de coluna/tipo divergente no banco.
  - Mitigacao: validar schema antes de aplicar SQL.
- Risco: formato de retorno do RPC diferente do esperado no TS.
  - Mitigacao: tipar retorno `{ test_date: string }[]` e validar no fluxo manual.
- Risco: permissao/RLS bloquear retorno.
  - Mitigacao: testar com usuario autenticado real no ambiente local.

## Rollback simples

1. Reverter alteracao em `src/utils/booking.ts` para query direta temporariamente.
2. Manter RPC no banco sem uso (nao quebra comportamento existente).

## Ordem recomendada de implementacao

1. SQL RPC.
2. Refactor do utilitario.
3. Lint + tipos.
4. Validacao manual do fluxo.

## Arquivos impactados

- `supabase/rpc/get_booked_dates.sql` (novo)
- `src/utils/booking.ts` (edicao minima)

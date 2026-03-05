Playwright/E2E tests do projeto TACF Digital.

Execução:

```bash
yarn test:e2e
```

Execução com browser visível:

```bash
yarn test:e2e:headed
```

Variáveis de ambiente obrigatórias (login real via Supabase):

- `E2E_USER_EMAIL`
- `E2E_USER_PASSWORD`
- `E2E_ADMIN_EMAIL`
- `E2E_ADMIN_PASSWORD`

Para o cenário E2E real de agendamento com validação de persistência e teardown em banco (`military-scheduling.spec.ts`), também é necessário configurar uma conexão PostgreSQL de desenvolvimento:

- `DATABASE_URL` **ou** `SUPABASE_DB_URL`
- alternativamente: `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`

Modo determinístico opcional (quando não houver horários disponíveis):

- `E2E_SCHEDULING_CREATE_SESSION_IF_EMPTY=true`
- `E2E_SCHEDULING_RESET_USER_BOOKINGS=true` (opcional, para ambiente de desenvolvimento)

Quando habilitado, o teste cria uma sessão temporária no banco apenas para execução do cenário e remove essa sessão no teardown.

Com `E2E_SCHEDULING_RESET_USER_BOOKINGS=true`, o teste remove agendamentos existentes do usuário de teste antes do fluxo para contornar bloqueios de regra de domínio (ex.: já possui agendamento no semestre).

Execução apenas do fluxo real de agendamento:

```bash
yarn test:e2e tests/e2e/military-scheduling.spec.ts
```

Os testes foram organizados com Page Objects para evitar repetição (DRY) e cobrem viewports de 375px e 1440px via projetos do Playwright.

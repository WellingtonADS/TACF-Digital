## Plan: Testes E2E reais + Admin

TL;DR — Implementar testes E2E reais (Playwright) sem mocks cobrindo fluxos de usuário e administrador (booking, confirmação, geração de PDF, gestão admin). Adicionar scripts de seed/teardown que usam `SUPABASE_SERVICE_ROLE_KEY` para preparar/limpar dados, fixtures Playwright para autenticação (user/admin), Page Objects para fluxos e testes Vitest complementares para hooks/services. Referências principais: [package.json](package.json), [playwright.config.ts](playwright.config.ts), [vitest.config.ts](vitest.config.ts), [src/services/supabase.ts](src/services/supabase.ts), `.env`.

**Steps**
1. Preparação do ambiente
- **Verificar env**: confirme variáveis em [`.env`](.env): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `PLAYWRIGHT_BASE_URL`, `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`.
- **Proteção de segredos**: confirme `.gitignore` bloqueando `.env`; nunca commitar `SUPABASE_SERVICE_ROLE_KEY`.
2. Scripts de seed / teardown
- **Criar**: `e2e/scripts/seed.ts` e `e2e/scripts/teardown.ts`.
- **Funcionalidade**: usar `@supabase/supabase-js` com `SUPABASE_SERVICE_ROLE_KEY` para:
  - criar/atualizar usuários de teste (admin e user),
  - criar sessions e dados necessários (marcar todos com `test_run_id`),
  - prover um endpoint/script para limpeza por `test_run_id`.
- **Local**: `e2e/scripts/` e documentar uso em `docs/E2E_RUN.md`.
3. Fixtures Playwright & helpers de serviço
- **Supabase client Node**: `e2e/fixtures/supabaseClient.ts` — instancia com service role.
- **Auth fixture**: `e2e/fixtures/auth.ts` — funções `createTestUser(type)`, `signInAs(type)` retornando cookies/headers para `page.context().addCookies()` ou uso de REST.
- **Index de fixtures**: `e2e/fixtures/index.ts`.
4. Page Objects
- **Criar**: `e2e/pages/bookingPage.ts`, `e2e/pages/adminPage.ts`, `e2e/pages/pdfPage.ts`.
- Encapsular ações e asserts reutilizáveis (ex.: `bookingPage.reserve(sessionId)`, `adminPage.approveUser(userId)`).
5. Testes E2E (fluxos reais)
- **Arquivos**:
  - `e2e/tests/smoke/booking.spec.ts` — seed session, login user, reservar via UI, verificar `booking_id`/número de ordem/QR/comprovante.
  - `e2e/tests/smoke/admin.spec.ts` — login admin (`SEED_ADMIN_EMAIL`), navegar para gestão, aprovar/rejeitar usuários, verificar audit log.
  - `e2e/tests/smoke/pdf.spec.ts` — acionar geração de PDF e verificar artefato (download ou endpoint).
- **Estratégia**: cada teste executa seed específico com `test_run_id` e chama teardown ao final; usar fixtures para autenticação.
6. Vitest — Unit & Component tests complementares
- **Alvos**: `useAuth`, `useBooking`, `confirmarAgendamentoRPC` (em `src/services/supabase.ts`), `src/utils/pdf/generateCallList.ts`.
- **Local**: `src/hooks/__tests__/*`, `src/services/__tests__/*`, `src/utils/pdf/__tests__/*`.
- **Mocks**: apenas para isolar unidades — NÃO para E2E.
7. Confiabilidade / Observabilidade
- **Playwright**: habilitar traces/screenshots/artifacts; configurar retries em CI (`trace: on-first-retry`).
- **Espera robusta**: usar `waitForResponse`, `waitForSelector`, evitar `sleep`.
- **Isolamento**: usar `test_run_id` por execução para identificar e limpar dados.
8. CI / Pipeline
- **Job**:
  1. carregar `.env` seguro (ou usar variáveis de CI),
  2. executar `e2e/scripts/seed`,
  3. iniciar app (`yarn dev` ou confiar em `webServer` do Playwright),
  4. `npx playwright test e2e/tests/smoke --project=chromium`,
  5. `e2e/scripts/teardown`.
- **Recomendação**: preferir projeto Supabase de teste (variável CI `USE_TEST_PROJECT=true`) e snapshots DB.
9. Documentação e comandos
- **Criar**: `docs/E2E_RUN.md` com passos e riscos.
- **Comandos úteis**:
```bash
# dev + smoke e2e
yarn dev
yarn test:e2e:smoke
```

**Verification**
- Local:
  - executar `e2e/scripts/seed` → verificar via UI/Supabase console que dados foram criados;
  - `yarn dev` → `yarn test:e2e:smoke` → todos os specs passam;
  - `e2e/scripts/teardown` → confirmar limpeza por `test_run_id`.
- CI:
  - job executa seed → testes → teardown; artifacts salvos em falhas.

**Decisions**
- Usar `SUPABASE_SERVICE_ROLE_KEY` em scripts Node para seed/teardown (NUNCA para frontend).
- Você escolheu rodar contra o `.env` local atual; recomendação técnica: usar projeto de teste isolado sempre que possível.
- Marcar todos registros criados com `test_run_id` para garantir teardown seguro.

**Riscos / Blockers**
- RLS/RPCs podem impedir operações de seed se as políticas forem restritivas.
- Uso indevido da service role pode causar exposição de segredos; mantenha essas chaves apenas em variáveis de ambiente seguros.
- Ausência de scripts/migrations atuais para alguns fluxos → necessário criar.

Arquivos mínimos a criar/atualizar
- `e2e/scripts/seed.ts`, `e2e/scripts/teardown.ts`
- `e2e/fixtures/supabaseClient.ts`, `e2e/fixtures/auth.ts`, `e2e/fixtures/index.ts`
- `e2e/pages/bookingPage.ts`, `e2e/pages/adminPage.ts`, `e2e/pages/pdfPage.ts`
- `e2e/tests/smoke/booking.spec.ts`, `e2e/tests/smoke/admin.spec.ts`, `e2e/tests/smoke/pdf.spec.ts`
- `docs/E2E_RUN.md`
- (opcional) `src/hooks/__tests__/*`, `src/services/__tests__/*`, `src/utils/pdf/__tests__/*` para testes unitários complementares.
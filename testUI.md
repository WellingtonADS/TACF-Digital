## Plan: Testes E2E reais + Admin

TL;DR — Implementar testes E2E reais (Playwright) sem mocks cobrindo fluxos de usuário e administrador (booking, confirmação, geração de PDF, gestão admin). Adicionar scripts de seed/teardown que usam `SUPABASE_SERVICE_ROLE_KEY` para preparar/limpar dados, fixtures Playwright para autenticação (user/admin), Page Objects para fluxos e testes Vitest complementares para hooks/services. Referências principais: [package.json](package.json), [playwright.config.ts](playwright.config.ts), [vitest.config.ts](vitest.config.ts), [src/services/supabase.ts](src/services/supabase.ts), `.env`.

**Steps**

1. Preparação do ambiente
2. Scripts de seed / teardown

- criar/atualizar usuários de teste (admin e user),
- criar sessions e dados necessários (marcar todos com `test_run_id`),
- prover um endpoint/script para limpeza por `test_run_id`.

3. Fixtures Playwright & helpers de serviço
4. Page Objects
5. Testes E2E (fluxos reais)

- `e2e/tests/smoke/booking.spec.ts` — seed session, login user, reservar via UI, verificar `booking_id`/número de ordem/QR/comprovante.
- `e2e/tests/smoke/admin.spec.ts` — login admin (`SEED_ADMIN_EMAIL`), navegar para gestão, aprovar/rejeitar usuários, verificar audit log.
- `e2e/tests/smoke/pdf.spec.ts` — acionar geração de PDF e verificar artefato (download ou endpoint).

6. Vitest — Unit & Component tests complementares
7. Confiabilidade / Observabilidade
8. CI / Pipeline
9. carregar `.env` seguro (ou usar variáveis de CI),
10. executar `e2e/scripts/seed`,
11. iniciar app (`yarn dev` ou confiar em `webServer` do Playwright),
12. `npx playwright test e2e/tests/smoke --project=chromium`,
13. `e2e/scripts/teardown`.
14. Documentação e comandos

```bash
# dev + smoke e2e
yarn dev
yarn test:e2e:smoke
```

**Verification**

- executar `e2e/scripts/seed` → verificar via UI/Supabase console que dados foram criados;
- `yarn dev` → `yarn test:e2e:smoke` → todos os specs passam;
- `e2e/scripts/teardown` → confirmar limpeza por `test_run_id`.
- job executa seed → testes → teardown; artifacts salvos em falhas.

**Decisions**

**Riscos / Blockers**

Arquivos mínimos a criar/atualizar

- (opcional) `src/hooks/__tests__/*`, `src/services/__tests__/*`, `src/utils/pdf/__tests__/*` para testes unitários complementares.

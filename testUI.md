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
  1. carregar `.env` seguro (ou usar variáveis de CI),
  2. executar `e2e/scripts/seed`,
  3. iniciar app (`yarn dev` ou confiar em `webServer` do Playwright),
  4. `npx playwright test e2e/tests/smoke --project=chromium`,
  5. `e2e/scripts/teardown`.
9. Documentação e comandos
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


---

Relatório curto — Planejamento de Testes

Objetivo

Validar fluxos críticos (booking, confirmação, geração de PDF, gestão admin) com E2E reais (Playwright) e cobertura unitária/comp. (Vitest). Referência: testUI.md.
Escopo prioritário

E2E smoke (real backend): booking, admin, PDF

Specs: booking.spec.ts, admin.spec.ts, pdf.spec.ts
Page Object: BookingPage
Fixtures/auth: createTestUser, signInViaUI
Seed / teardown: seed.ts, teardown.ts
Config Playwright: playwright.config.ts
Unit / Component (Vitest + Testing Library)

Hooks/services/utils: exemplos e padrões: useSessions.spec.tsx, supabase.spec.ts, generateCallList.test.ts
Setup: setupTests.ts
Config Vitest: vitest.config.ts
Dependências técnicas e pontos de integração

Mock/real: unit tests mockam supabase.ts; E2E usam SUPABASE_SERVICE_ROLE_KEY via seed.ts / fixtures.
RPCs e serviços críticos: confirmarAgendamentoRPC (usar em testes unitários/integração); gerador de PDFs: generateCallList.
Comandos & CI

Locais:
Unit: yarn test (ver package.json)
E2E smoke: yarn test:e2e:smoke (ver package.json)
Dev server: yarn dev (Playwright webServer em playwright.config.ts)
Gates CI recomendados (pré-merge):
yarn lint && npx tsc --noEmit
yarn test (Vitest)
e2e job (opcional em PRs longos): npx playwright test e2e/tests/smoke --project=chromium
Referência checklist: VALIDATION_CHECKLIST.md, README.md
Métricas e metas

Meta inicial: cobertura unitária crítica ≥ 80% em services/hooks/utils; 3 E2E smoke verdes (booking, admin, pdf).
Tempo alvo por run E2E smoke: < 5 min (seed + tests + teardown).
Riscos e mitigações

Risco: flakiness por ambiente Supabase (rede/auth) — Mitigação: usar tags test_run_id em seed/teardown (seed.ts, teardown.ts); retries limitados no Playwright.
Risco: exposição de chaves — Mitigação: exigir variáveis CI/.env seguras e documentadas (ver PLAYBOOK_CLIENT_PROFILE_ROLLOUT.md).
Plano de execução (curto)

Criar/validar scripts: seed + teardown — seed.ts, teardown.ts — 2h
Implementar fixtures & Page Objects (e2e/fixtures/*, BookingPage) — 2h
Escrever E2E smoke: booking.spec.ts, admin.spec.ts, pdf.spec.ts — 4h
Adicionar/ajustar unit tests críticos (hooks/services/pdf) — 4h
Configurar job CI para smoke e reporting — 2h
Próximos passos imediatos

Implementar seed+teardown e rodar manualmente: yarn dev + yarn test:e2e:smoke.
Escrever primeiro spec: booking.spec.ts usando BookingPage e fixtures em auth.ts.
Criar CI job que executa seed → tests → teardown e publica artifacts.
Referências rápidas

Configs: playwright.config.ts, vitest.config.ts, package.json
Seeds/fixtures: seed.ts, teardown.ts, auth.ts
Page Object: BookingPage
Serviços/RPCs: confirmarAgendamentoRPC, generateCallList
Exemplos de testes: useSessions.spec.tsx, supabase.spec.ts, generateCallList.test.ts

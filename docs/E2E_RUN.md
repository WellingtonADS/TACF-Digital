# E2E Run Guide (Real-backend tests)

Este documento descreve como executar os testes E2E que usam o backend real (Supabase).

Pré-requisitos

- Ter um arquivo `.env` local com as variáveis necessárias (NUNCA commitar este arquivo):
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY` (apenas para scripts de seed/teardown)
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `PLAYWRIGHT_BASE_URL` (opcional, default é `http://127.0.0.1:5173`)
  - `SEED_ADMIN_EMAIL` e `SEED_ADMIN_PASSWORD` (opcional, usados nos testes de admin)

Arquivos importantes

- `e2e/scripts/seed.ts` — cria dados iniciais (usuários e sessões) marcados com `test_run_id`.
- `e2e/scripts/teardown.ts` — remove dados marcados por `test_run_id`.
- `e2e/fixtures` — helpers para supabase e autenticação.
- `e2e/pages` — Page Objects para fluxos (booking, admin, pdf).
- `e2e/tests/smoke` — specs E2E (booking, admin, pdf).

Executando localmente (passo a passo)

1. Configurar `.env` com as variáveis acima.
2. (Opcional) rodar o script de seed para criar dados iniciais e capturar o `test_run_id` retornado:

```bash
node ./e2e/scripts/seed.js
# ou com ts-node: npx ts-node ./e2e/scripts/seed.ts
```

3. Iniciar a aplicação em modo dev:

```bash
yarn dev
```

4. Rodar os testes smoke (Playwright):

```bash
# executa apenas os testes de smoke
yarn test:e2e:smoke

# rodar todos os testes e2e
npx playwright test
```

5. Após a execução, rodar o teardown (se você tiver o `test_run_id`):

```bash
node ./e2e/scripts/teardown.js <test_run_id>
# ou npx ts-node ./e2e/scripts/teardown.ts <test_run_id>
```

Boas práticas

- Não rode estes testes contra um ambiente de produção sem backups e autorização.
- Prefira um projeto Supabase de teste isolado para CI.
- Marque todos os registros criados com `test_run_id` para facilitar limpeza.
- Habilite artifacts em CI (traces, screenshots, downloads) para depuração de falhas.

CI

- Job sugerido:
  1. exportar variáveis de ambiente (secure vars)
  2. `node e2e/scripts/seed.js` → salvar `test_run_id`
  3. `yarn dev` (em background) ou confiar em `webServer` do Playwright
  4. `npx playwright test e2e/tests/smoke --project=chromium`
  5. `node e2e/scripts/teardown.js <test_run_id>`

Observações

- Os scripts em `e2e/scripts` usam a `SUPABASE_SERVICE_ROLE_KEY` e portanto devem ser executados apenas em ambientes controlados.
- Ajuste queries de seed/teardown conforme o schema do banco (colunas e JSON metadata).

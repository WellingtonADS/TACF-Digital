Playbook: Rollout / Rollback — Cliente cria `profiles` no signUp

Resumo

- Objetivo: migrar criação mínima de `profiles` do trigger server-side para upsert client-side após `signUp`.
- Estratégia: apply migrations que tornam trigger não sobrescritor + policy hardening → deploy backend migrations → deploy frontend com feature flag → monitorar → remover trigger quando estável.

Pré-requisitos

- Backup/snapshot do banco de dados (export ou snapshot) antes de qualquer migration.
- Aprovação do coordenador HACO para alterações de RLS/policies.
- CI/CD com capacidade de aplicar migrations e rodar testes E2E com DB de teste.

Comandos úteis

- Aplicar migrations locais (projeto fornece script):

```bash
# aplicar migrations (ajuste conforme seu ambiente)
yarn db:apply
```

- Rodar dev frontend:

```bash
yarn dev
```

- Rodar testes E2E (local):

```bash
# certifique-se de exportar SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY apontando para DB de teste
yarn test:e2e
```

Sequência de rollout (detalhada)

1. Backup
   - Gerar snapshot/export do banco de produção.
2. Criar e aplicar migrations - fase 1 (hardening + non-overwriting trigger)
   - Aplicar migration `supabase/migrations/20260224_client_profile_upsert.sql`.
   - Verificar que migration aplicou sem erros.
3. Deploy backend
   - Garantir que todas as migrations foram aplicadas.
   - Validar logs de `sync_auth_user_to_profile` e erros em `public.sync_auth_user_errors` (se existir).
4. Deploy frontend (behind feature flag)
   - Ativar código client-side upsert sob feature flag (default: off).
   - Deploy frontend com flag OFF.
   - Em staging, ligar flag e validar criação de profiles via cliente.
5. Monitoração (1–2 releases)
   - Métricas: taxa de criação de profile, falhas de upsert, chamadas `book_session` com profile ausente.
   - Logs: auth failures, RLS denials.
6. Gradual enable
   - Habilitar feature flag em produção para uma % pequena de tráfego ou para um conjunto de domínios/testers.
   - Aumentar gradualmente até 100% se estável.
7. Remoção do trigger (após estabilidade)
   - Quando 100% do tráfego usa upsert client-side e não há erros por 2 releases, aplicar migration para remover trigger e função `sync_auth_user_to_profile()`.

Rollback

- Em caso de problemas após aplicar a migration fase 1:
  1. Desligar feature flag no frontend (navegação volta a depender do trigger).
  2. Reverter deploy frontend para versão anterior (se necessário).
  3. Reverter migration (se necessário): aplique migration reversa que restaura a versão anterior da função/trigger. Teste reversão em staging antes de aplicar em produção.

Notas de segurança

- O cliente NUNCA deve enviar `role` ou campos sensíveis. Policies server-side foram endurecidas para bloquear essa possibilidade.
- As funções devem permanecer `SECURITY DEFINER` com owner `postgres`.

Checklist pré-deploy

- [ ] Backup do DB
- [ ] Aprovação do coordenador HACO
- [ ] CI verde com migrations aplicadas
- [ ] Playbook de rollback disponível
- [ ] Telemetria/alertas configurados

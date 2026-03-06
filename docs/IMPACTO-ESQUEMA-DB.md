# Impacto das mudanças no esquema de banco de dados

Data: 06 de março de 2026
Autor: Equipe TACF Digital (analista automático)

Resumo executivo

Este documento analisa o impacto funcional, técnico, operativo e de segurança das alterações recomendadas ao esquema do projeto (introdução de RPC transacional para booking, contador seguro de ordem, habilitação de RLS completa, gravação de auditoria e endurecimento de permissões). Fornece estimativas de esforço, riscos, mitigações e plano de rollout.

1. Mudanças propostas (recapitulação)

- Inserir RPC transacional `book_session` / `book_shift` (SECURITY DEFINER) que:
  - faz `SELECT ... FOR UPDATE` na linha de `sessions`/`shifts`;
  - conta reservas ativas;
  - verifica capacidade e regras de duplicidade por ciclo;
  - gera `order_number` seguro usando `order_counters`;
  - insere registro em `bookings/schedules` e escreve `audit_log` na mesma transação.
- Criar tabela `order_counters` + `fn_next_order_number` para evitar COUNT(\*) concorrente.
- Habilitar RLS e criar policies para `profiles`, `sessions`, `bookings`, `swap_requests` e `audit_logs`.
- Revogar `INSERT/UPDATE` diretos para `bookings`/`schedules` e `GRANT EXECUTE` ao RPC para `authenticated`.
- Adicionar índices e triggers de `updated_at` (já existentes) e garantir que audit_log receba eventos críticos.
- Atualizar documentação e criar migrations versionadas em `supabase/migrations/`.

2. Impacto técnico

2.1 Banco de dados

- Migrations: será necessário aplicar migrations que criam `order_counters`, funções RPC, policies RLS e possivelmente alterar constraints. Isso requer versão controlada e revisão.
- Tempo de aplicação: geralmente rápido (segundos-minutos), exceto se for necessário backfill de `order_number`/dados históricos — nesse caso, janela de manutenção ou job de backfill assíncrono.
- Locks e performance: `SELECT ... FOR UPDATE` sobre uma linha de `sessions` criará lock exclusivo por linha durante a transação — a operação é curta e deve escalar bem, mas pontos de contenção podem ocorrer em sessões muito concorridas (picos de agendamento). Monitorar e, se necessário, aplicar filas ou rate limiting.
- Reversibilidade: as alterações em tabelas e funções são reversíveis via migrations (rollback), porém políticas RLS e revogação de privilégios podem bloquear acessos se revertidas incorretamente. Testes em staging são obrigatórios.

  2.2 Backend / RPCs

- Código: adicionar camada que consome a RPC (`src/services/supabase.ts`) e remover/alterar rotas que inseriam `bookings` diretamente.
- Erros: o front deve tratar exceções retornadas pela RPC (ex.: "Capacidade atingida", "Já possui agendamento no ciclo"). Mensagens devem ser traduzidas para UX.
- Security Definer: a função RPC deve ser `security definer` e o dono (owner) deve ser um role com privilégios limitados; revisar quem é o owner na migration.

  2.3 Frontend

- Mudança de chamadas: substituir fluxos que executam INSERTs diretos por chamadas ao RPC. Provavelmente 1–2 componentes principais afetados (`Scheduling`, `BookingContainer`, etc.).
- UX: adaptar fluxo para feedback imediato (loading + erro) e tratamento de conflitos (retry recomendado ao usuário).
- Testes: atualizar testes unitários e E2E para cobrir fluxo via RPC.

  2.4 CI/CD e Deploy

- Incluir migration no pipeline (`supabase/migrations/`) e rodar `yarn db:apply` em ambientes controlados (staging primeiro).
- Adicionar job de smoke-test pós-migration verificando RLS basics e criação de booking via RPC.

  2.5 Tests e QA

- Novos testes necessários:
  - Unitários para a função RPC (mock do banco) e para a camada de serviço frontend.
  - Testes de integração em staging que executem cenários concorrentes e verifiquem ausência de overbooking.
  - Testes de RLS (simular perfis militar/coordenador/admin) para garantir visibilidade correta.

3. Impacto operacional e de processo

- Revisão por HACO: mudanças em RLS e migrations devem ser revisadas pelo coordenador HACO (requisito do projeto).
- Janela de deploy: preferir deploy em horário de baixa atividade caso seja necessário backfill ou alteração de constraints que impactem escrita direta.
- Backup: criar snapshot do DB antes da migration (essencial).
- Treinamento: comunicar coordenadores/administradores sobre novos logs e possíveis mudanças no painel.

4. Esforço estimado (estimativas de alto nível)

Notas: estimativas em pessoa-dias (PD) para uma equipe com conhecimento do codebase.

- Preparar migrations (order_counters + fn_next_order_number + RPC book): 1.5–2 PD
- Implementar e testar RLS policies completas: 1–2 PD
- Ajustar `src/services/supabase.ts` e chamadas frontend para usar RPC: 1–2 PD
- Atualizar testes (unit + integração + RLS checks): 1.5–2 PD
- Pipeline/CI: adicionar migration e smoke tests: 0.5–1 PD
- Documentação, revisão HACO e merge: 0.5–1 PD

Total aproximado: 6.0–10.0 PD (dependendo do backfill e da complexidade de testes E2E).

5. Riscos e mitigações

- Risco: Overbooking durante janela de transição (se clientes ainda escreverem diretamente na tabela).
  - Mitigação: revogar `INSERT` direto imediatamente após deploy das migrations e publicar o RPC; aplicar feature-flag para bloquear caminho antigo.
- Risco: Locks em picos podem aumentar latência de booking.
  - Mitigação: medir latência e, se necessário, usar fila assíncrona com confirmação eventual ou throttling.
- Risco: RLS bloqueando acessos legitimos por erro de policy.
  - Mitigação: criar testes de permissão e executar em staging com amostras de contas (militar/coordenador/admin) antes do deploy.
- Risco: Falha no backfill de `order_number` histórico.
  - Mitigação: criar script de backfill idempotente e rodar em staging; se for caro, aceitar gerar `order_number` apenas para novos registros.

6. Plano de rollout (passo-a-passo)

1) Criar branch com migrations e código cliente atualizado para usar RPC (PR separado para infra/migrations e outro para frontend/backend se preferir).
2) Revisao interna + testes automatizados e manuais em ambiente `staging`.
3) Criar snapshot/backup do banco de produção.
4) Aplicar migrations em staging e validar.
5) Depois de aprovado, aplicar migrations em produção durante janela de baixa atividade.
6) Revogar `INSERT` direto em `bookings`/`schedules` e `GRANT EXECUTE` somente ao RPC.
7) Monitorar métricas (taxa de bookings, latencia da RPC, erros de policy) por 24–48h.
8) Se necessário, ativar mitigações (rollback migration ou ajustes de policy).

7. Rollback e emergências

- Rollback das migrations: escrever down-scripts que revertam alterações estruturais. Polices RLS precisam ser revertidas com cuidado para não abrir dados indevidos.
- Plano de emergência: se a RPC falhar em produção, reverter para snapshot e restaurar banco, ou habilitar um fallback que rejeite novas reservas com mensagem amigável até correção.

8. Checklist para PR de migration

- [ ] Migration SQL revisada e versionada em `supabase/migrations/`.
- [ ] Funções RPC marcadas `SECURITY DEFINER` e propriedade do owner revisada.
- [ ] Testes unitários/integracao atualizados.
- [ ] Smoke tests de RLS e booking adicionados ao CI.
- [ ] Backup criado e janela de deploy planejada.
- [ ] Documento de rollback anexado.

9. Impacto em curto prazo vs longo prazo

- Curto prazo: trabalho de engenharia (6–10 PD), atualizações em frontend/backend, ajustes em CI e validações em staging.
- Longo prazo: reduz risco operacional, melhora segurança e auditabilidade, facilita conformidade LGPD e reduz incidentes de overbooking.

10. Próximos passos sugeridos

- Confirmar se deseja que eu gere as migrations SQL completas (incluindo `fn_next_order_number`, `book_shift` RPC, e RLS policies) — posśivel opcão para gerar arquivos em `supabase/migrations/`.
- Preparar scripts de teste de concorrencia (simular N clientes tentando reservar a mesma sessao).
- Planejar janela de deploy e preparar backup.

---

Anexo: estimativas detalhadas e snippets (sob demanda)

Se quiser, gero agora as migrations prontas e os snippets de `GRANT/REVOKE` e o PR template sugerido para aplicar estas mudanças.

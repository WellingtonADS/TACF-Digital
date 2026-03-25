# Plano de Criacao do Fluxo de Notificacao

Plano tatico para introduzir notificacoes operacionais no TACF Digital com foco em rastreabilidade, baixo custo inicial, evolucao incremental e preservacao das regras de negocio no backend.

## 1. Objetivo

- Garantir que o militar seja informado quando ocorrer evento operacional relevante.
- Permitir que o sistema notifique sem depender de consulta manual constante do usuario.
- Centralizar os gatilhos no backend para evitar divergencia entre regra de negocio e interface.
- Viabilizar uma primeira entrega compativel com o uso do Supabase em plano gratuito.

## 2. Problema Atual

- O sistema hoje informa principalmente por telas internas e avisos na interface.
- Nao existe fluxo formal de notificacao ativa para mudanca de resultado, cancelamento de turma ou alteracao de local.
- Nao ha camada dedicada para inbox do usuario, fila de envio ou historico de entrega.
- O usuario depende de abrir o app para perceber parte relevante das mudancas.

## 3. Principios da Solucao

- Regras de disparo pertencem ao backend/RPC.
- Frontend apenas consome, exibe e confirma leitura.
- Toda notificacao deve nascer de um evento de negocio auditavel.
- O envio deve ser idempotente e rastreavel.
- A implementacao deve comecar por notificacao interna no app e evoluir para e-mail e canais de urgencia.
- O Supabase deve atuar como orquestrador de eventos, persistencia e leitura, nao como provedor final de mensageria externa.

## 4. Eventos que Devem Gerar Notificacao

### 4.1 Resultado publicado

- Quando o resultado final do militar for definido como apto ou inapto.
- A notificacao deve indicar status final, data da avaliacao e proxima acao disponivel.

### 4.2 Turma cancelada

- Quando uma sessao for cancelada apos haver militares vinculados.
- A notificacao deve informar impacto e orientar reacondicionamento do fluxo: novo agendamento ou reagendamento, conforme regra de negocio.

### 4.3 Data ou horario alterados

- Quando uma sessao ja vinculada a bookings ativos sofrer mudanca de data, turno ou horario.
- A notificacao deve mostrar valor anterior e novo valor, quando permitido.

### 4.4 Local alterado

- Quando o local da prova for alterado para uma sessao com participantes vinculados.
- A notificacao deve destacar novo local e orientar o usuario a revisar o comprovante.

### 4.5 Reagendamento solicitado, deferido ou indeferido

- Quando o usuario solicitar reagendamento.
- Quando a solicitacao for aprovada.
- Quando a solicitacao for indeferida.
- O fluxo deve apresentar justificativa resumida e acao seguinte.

### 4.6 Presenca/falta com impacto operacional

- Quando a falta confirmada liberar elegibilidade de reagendamento.
- Quando eventual regra equivalente exigir comunicacao formal ao militar.

## 5. Canais de Notificacao

## Fase 1 - Inbox interna no app

- Canal principal da primeira entrega.
- Custo baixo e dependencia minima de infraestrutura externa.
- Exibicao no dashboard do usuario e em pagina dedicada de notificacoes.

## Fase 2 - E-mail transacional

- Canal para eventos importantes e nao urgentes.
- Exemplos: resultado publicado, reagendamento deferido, local alterado, turma cancelada.
- Envio via provedor externo, acionado por Edge Function ou worker.

## Fase 3 - Canal de urgencia

- Canal opcional para eventos criticos proximos da prova.
- Exemplos: cancelamento no mesmo dia, mudanca de local de ultima hora.
- Pode ser WhatsApp ou SMS, sempre com provedor externo.

## 6. Arquitetura Recomendada

### 6.1 Camada de evento

- O evento nasce no backend quando uma mutacao relevante acontece.
- Exemplos:
- RPC de lancamento de resultado;
- atualizacao de sessao com alteracao de local/data/status;
- aprovacao ou indeferimento de reagendamento.

### 6.2 Camada de persistencia

- Registrar a notificacao em tabela propria no banco.
- Separar a visao do usuario da fila de entrega externa.

### 6.3 Camada de entrega

- Para inbox interna: leitura direta da tabela de notificacoes.
- Para e-mail/WhatsApp: processo assincrono consome fila e executa envio.

### 6.4 Camada de leitura

- Frontend consulta notificacoes do usuario autenticado.
- Opcionalmente usar Realtime para atualizar inbox sem refresh manual.

## 7. Modelo de Dados Proposto

## Tabela `notifications`

- Objetivo: armazenar notificacoes visiveis ao usuario.
- Campos sugeridos:
- `id`
- `user_id`
- `event_type`
- `title`
- `message`
- `action_url`
- `action_label`
- `severity`
- `payload`
- `read_at`
- `created_at`

## Tabela `notification_outbox`

- Objetivo: fila de entrega externa e rastreabilidade tecnica.
- Campos sugeridos:
- `id`
- `notification_id`
- `user_id`
- `channel`
- `provider`
- `status`
- `attempt_count`
- `last_error`
- `scheduled_at`
- `sent_at`
- `created_at`

## Tabela opcional `notification_preferences`

- Objetivo: suportar preferencias futuras por canal e tipo de evento.
- Nao obrigatoria para a primeira fase.

## 8. Tipos de Evento Propostos

- `resultado_publicado`
- `turma_cancelada`
- `sessao_data_alterada`
- `sessao_horario_alterado`
- `sessao_local_alterado`
- `reagendamento_solicitado`
- `reagendamento_aprovado`
- `reagendamento_indeferido`
- `reagendamento_liberado_por_falta`

## 9. Gatilhos por Modulo

### 9.1 Resultados

- Ao concluir lancamento de resultado, a RPC deve:
- validar permissao;
- validar pre-condicoes da operacao;
- persistir o resultado;
- criar notificacao interna;
- enfileirar entrega externa, se habilitada.

### 9.2 Turmas

- Ao atualizar sessao, comparar valores anteriores e novos.
- So gerar notificacao para bookings afetados e campos realmente alterados.
- Evitar notificar usuario sem impacto operacional.

### 9.3 Reagendamentos

- Ao solicitar, aprovar ou indeferir reagendamento, gerar notificacao correspondente.
- Justificativa resumida deve acompanhar a mensagem em formato auditavel.

## 10. Estrategia de Implementacao por Ondas

## Onda 1 - Inbox interna e persistencia basica

### Objetivo

- Colocar notificacao funcional dentro do app sem dependencia externa.

### Entregaveis

- Tabela `notifications`.
- RPC/listagem de notificacoes do usuario.
- Marcacao de leitura.
- Widget ou pagina de notificacoes no contexto do usuario.
- Disparo inicial para `resultado_publicado`, `turma_cancelada` e `sessao_local_alterado`.

### Criterios de aceite

- Usuario autenticado consegue visualizar somente as proprias notificacoes.
- Mudanca de resultado cria notificacao interna.
- Cancelamento de turma cria notificacao para todos os bookings impactados.
- Leitura fica persistida e auditavel.

## Onda 2 - Outbox e entrega de e-mail

### Objetivo

- Adicionar entrega externa sem acoplar o dominio ao provedor.

### Entregaveis

- Tabela `notification_outbox`.
- Processo de consumo de fila.
- Integracao com provedor de e-mail.
- Templates iniciais por tipo de evento.

### Criterios de aceite

- Notificacao de evento critico entra na outbox.
- Falhas de envio nao perdem o evento.
- Reenvio respeita limite de tentativas.
- Historico tecnico de envio fica consultavel.

## Onda 3 - Realtime e canal de urgencia

### Objetivo

- Melhorar percepcao de imediatismo e cobrir eventos de alta urgencia.

### Entregaveis

- Atualizacao em tempo real da inbox.
- Canal opcional de urgencia via provedor externo.
- Regras de prioridade por tipo de evento.

### Criterios de aceite

- Usuario ve nova notificacao sem precisar recarregar a tela, quando aplicavel.
- Evento critico pode usar canal complementar configurado.

## 11. Estrategia para Supabase no Plano Gratuito

- Fase inicial deve usar apenas recursos nativos de banco, auth, RPC e leitura no app.
- Inbox interna e a entrega com melhor custo-beneficio para iniciar.
- E-mail pode ser adicionado depois com provedor externo, mantendo Supabase apenas como orquestrador.
- WhatsApp ou SMS nao devem entrar na primeira entrega.
- Realtime e Edge Functions podem ser usados com moderacao, desde que o volume esperado seja baixo a moderado.

## 12. Regras de Negocio e Confiabilidade

### 12.1 Idempotencia

- O mesmo evento nao pode gerar notificacoes duplicadas por clique repetido ou retry tecnico.

### 12.2 Escopo correto

- So usuarios afetados pelo evento devem receber notificacao.

### 12.3 Prioridade

- Eventos criticos devem ter severidade maior e CTA explicita.

### 12.4 Auditoria

- Toda notificacao gerada por regra operacional deve ser rastreavel.

### 12.5 Template consistente

- Cada tipo de evento deve ter titulo, corpo e destino padronizados.

## 13. UX Recomendada

- Exibir sino ou contador de notificacoes no contexto autenticado do usuario.
- Permitir listar notificacoes recentes e historicas.
- Mostrar CTA claro: ver resultado, ver comprovante, reagendar, revisar local.
- Distinguir severidade por token semantico: informativa, alerta, critica.
- Nao usar apenas toast efemero como unico mecanismo para evento importante.

## 14. Exemplos de Mensagem

### Resultado publicado

- Titulo: Resultado disponivel
- Corpo: Seu resultado do TACF de 25/03/2026 foi publicado como APTO.
- CTA: Ver resultado

### Turma cancelada

- Titulo: Sua turma foi cancelada
- Corpo: A sessao prevista para 25/03/2026 foi cancelada. Revise as opcoes de novo agendamento.
- CTA: Ver agendamento

### Local alterado

- Titulo: Local de prova alterado
- Corpo: Seu TACF agora sera realizado em novo local. Revise o comprovante atualizado.
- CTA: Ver comprovante

### Reagendamento aprovado

- Titulo: Reagendamento aprovado
- Corpo: Sua solicitacao foi aprovada. Confira a nova data e o local.
- CTA: Ver agendamento

## 15. Arquivos Provavelmente Impactados

- `supabase/migrations/`
- `supabase/rpc/`
- `src/services/supabase.ts`
- `src/services/bookings.ts`
- `src/services/results.ts`
- `src/hooks/useDashboard.ts`
- `src/pages/OperationalDashboard.tsx`
- `src/pages/ResultsHistory.tsx`
- `src/utils/routeRegistry.ts`

## 16. Validacao e Testes

### Testes de backend

- evento gera notificacao correta;
- usuario nao recebe notificacao de outro usuario;
- evento repetido nao duplica entrega;
- alteracao sem impacto nao gera ruido.

### Testes de frontend

- inbox carrega apenas notificacoes do usuario autenticado;
- marcacao como lida persiste;
- CTA leva para destino correto;
- estado vazio orienta proxima acao.

### Testes de entrega externa

- falha do provedor nao apaga evento;
- retry respeita limite;
- status final fica gravado com clareza.

## 17. Ordem Recomendada de Execucao

1. Criar tabela `notifications` e politica de acesso.
2. Expor leitura de notificacoes no app do usuario.
3. Conectar eventos de resultado, cancelamento e alteracao de local.
4. Adicionar marcacao de leitura.
5. Criar tabela `notification_outbox`.
6. Conectar provedor de e-mail.
7. Avaliar necessidade real de canal de urgencia.

## 18. Decisao Executiva Recomendada

- Implementar primeiro a inbox interna no app.
- Tratar e-mail como segunda camada, nao como premissa inicial.
- Manter toda regra de disparo no backend.
- Nao introduzir WhatsApp/SMS antes de validar utilidade, custo e volume dos eventos.

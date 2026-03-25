# Plano Detalhado de Refatoracao UI/UX Admin

Plano tatico para evoluir a experiencia administrativa do TACF Digital com foco em fluxo logico, eficiencia operacional e baixo risco de regressao.

## 1. Objetivo

- Reduzir troca de contexto entre paginas para executar o ciclo operacional de uma turma.
- Priorizar o fluxo do agendamento (presenca, resultado, reagendamento) como jornada central.
- Preservar regras de negocio no backend/RPC e manter frontend como orquestrador da operacao.

## 2. Problemas Atuais

- Fluxo operacional quebrado em multiplas telas para a mesma tarefa.
- Alta troca de contexto entre Turmas, Agendamentos, Lancamento de Indices e Reagendamentos.
- Dashboard administrativo com foco em atalhos, e nao em fila operacional.
- Sobreposicao parcial entre Configuracoes e telas dedicadas de governanca.

## 3. Principios de Implementacao

- Evolucao incremental, sem big-bang.
- Primeiro agregar contexto, depois consolidar experiencia.
- Reutilizar paginas e hooks existentes antes de criar paginas novas.
- Validar sucesso com metricas objetivas de operacao.

## 4. Escopo

### Em escopo

- Melhorias de navegacao e contexto no fluxo admin.
- Integracao progressiva de operacao por turma.
- Ajustes de IA de usabilidade no dashboard.
- Atualizacao de documentacao de fluxo e criterios de aceite.

### Fora de escopo (nesta fase)

- Reescrita completa de todos os modulos de governanca.
- Mudancas de design system global sem relacao com o fluxo admin.
- Alteracoes profundas de schema fora das regras estritamente necessarias.

## 5. Estado Alvo da Experiencia

- Operador entra no dashboard, identifica pendencias e executa por fila de acao.
- A turma vira ponto de entrada para operacao completa do dia.
- Presenca, resultado e excecoes ficam proximas no mesmo contexto de sessao.
- Reagendamento continua com inbox global, mas com atalhos contextuais a partir da operacao da turma.

## 6. Roadmap por Etapas Logicas

### Etapa 1 - Baseline e Contrato Operacional

#### Objetivo

- Estabelecer linha de base e contrato canonico de estados para guiar implementacao e QA.

#### Entregaveis

- Definir baseline de operacao (tempo medio por ciclo, numero medio de navegacoes, pendencias por turma).
- Publicar matriz oficial de transicao de estados com bloqueios e mensagens esperadas.
- Alinhar frontend, backend e QA sobre a mesma definicao de regras operacionais.

#### Arquivos alvo

- docs/PLANO_DETALHADO_REFACTORACAO_UIUX_ADMIN.md
- docs/ContextRotaAdmin.md

#### Criterios de aceite

- Matriz de estados validada por produto, backend e frontend.
- Baseline registrado para comparacao antes/depois.

### Etapa 2 - Contexto de Sessao e Navegacao Confiavel

#### Objetivo

- Eliminar perda de contexto de turma por refresh, deep link e retorno de navegacao.

#### Entregaveis

- Propagar contexto da sessao por URL params (query/path), evitando dependencia exclusiva de `location.state`.
- Manter fallback temporario com `location.state` durante transicao para evitar quebra de fluxo.
- Padronizar labels e microcopy operacional entre desktop e mobile.
- Atualizar contratos de rota no registro central e na documentacao.

#### Arquivos alvo

- src/pages/SessionsManagement.tsx
- src/pages/SessionBookingsManagement.tsx
- src/pages/ScoreEntry.tsx
- src/utils/routeRegistry.ts
- docs/ContextRotaAdmin.md

#### Criterios de aceite

- Refresh na tela de lancamento preserva turma em contexto sem nova selecao manual.
- Operador conclui presenca + resultado com menos troca de contexto.
- Nenhuma rota administrativa existente deixa de funcionar.

### Etapa 3 - Integracao Funcional por Turma

#### Objetivo

- Aproximar presenca, resultado e excecoes no contexto da sessao.

#### Entregaveis

- Incluir acao contextual de resultado no fluxo da turma.
- Exibir estado de reagendamento por participante quando aplicavel.
- Implementar falta confirmada e elegibilidade de reagendamento via RPC/backend, com auditoria.
- Manter fluxo legado de lancamento de indices como fallback temporario.

#### Arquivos alvo

- src/pages/SessionBookingsManagement.tsx
- src/pages/ScoreEntry.tsx
- src/pages/ReschedulingManagement.tsx
- src/services/sessions.ts
- src/services/bookings.ts

#### Criterios de aceite

- Operador avanca de presenca para resultado sem perder contexto da sessao.
- Militar com falta confirmada fica elegivel para reagendamento sem acao manual paralela.
- Elegibilidade e validada no backend/RPC, com frontend apenas orquestrando UX.

### Etapa 4 - Confiabilidade de Regras e Idempotencia

#### Objetivo

- Garantir que regras de transicao e acoes criticas sejam robustas contra clique duplicado e concorrencia.

#### Entregaveis

- Bloquear transicoes invalidas no frontend conforme matriz (exemplo: resultado sem presenca confirmada).
- Validar as mesmas regras no backend/RPC como fonte final de verdade.
- Exigir loading e desabilitacao imediata por registro/acao em salvar, deferir e indeferir.

#### Arquivos alvo

- src/pages/ScoreEntry.tsx
- src/pages/ReschedulingManagement.tsx
- src/hooks/useReschedulingManagement.ts
- src/services/sessions.ts

#### Criterios de aceite

- Duplo clique nao duplica efeito em acoes criticas.
- Transicoes fora da matriz sao bloqueadas e retornam mensagem clara.

### Etapa 5 - Timezone Brasilia e Consistencia de Datas

#### Objetivo

- Eliminar day shift e divergencia de exibicao entre telas administrativas.

#### Entregaveis

- Centralizar parse/format de data/hora administrativa em `src/utils/date.ts`.
- Substituir parse ad-hoc distribuido nas telas operacionais admin.
- Padronizar exibicao em `America/Sao_Paulo` para data/hora operacional.

#### Arquivos alvo

- src/utils/date.ts
- src/pages/AdminDashboard.tsx
- src/pages/SessionBookingsManagement.tsx
- src/pages/ScoreEntry.tsx
- src/pages/ReschedulingManagement.tsx

#### Criterios de aceite

- Mesma sessao apresenta mesmo dia/hora em telas diferentes.
- Ambiente local com timezone diferente nao altera exibicao operacional.

### Etapa 6 - Dashboard Operacional e Governanca

#### Objetivo

- Mudar o dashboard de atalhos para fila de execucao por prioridade operacional.

#### Entregaveis

- Substituir lista generica de proximas turmas por fila de pendencias operacionais.
- Expandir fonte de dados para incluir completude operacional por turma.
- Revisar sobreposicoes de governanca entre Dashboard, Configuracoes, Auditoria e Sidebar.

#### Arquivos alvo

- src/pages/AdminDashboard.tsx
- src/hooks/useSessions.ts
- src/services/bookings.ts
- src/components/layout/Sidebar.tsx
- src/utils/routeRegistry.ts

#### Criterios de aceite

- Dashboard prioriza turmas com pendencias (presenca, resultado, reagendamento).
- Navegacao de governanca fica clara e sem duplicidade de responsabilidade.

## 7. Possivel Pagina Nova (apenas se necessario)

### Quando criar

- Somente se, apos Onda 2, ainda houver atrito alto para executar o ciclo completo da turma.

### Proposta

- Nova pagina: src/pages/BookingOperations.tsx
- Nova rota: /app/operacao-agendamentos
- Componentes de apoio:
- src/components/Booking/OperationsFilters.tsx
- src/components/Booking/OperationsTable.tsx
- src/components/Booking/OperationsRowActions.tsx
- Hook dedicado:
- src/hooks/useBookingOperations.ts

### Regra de decisao

- Criar pagina nova apenas com evidencia de ganho operacional acima da agregacao incremental.

## 8. Plano de Sprint (sugestao)

## Sprint 1 (1 a 2 semanas)

- Onda 1 completa.
- Entregar contexto unico e navegacao padronizada.
- Medir baseline de cliques e tempo de operacao.

## Sprint 2 (1 a 2 semanas)

- Onda 2 completa.
- Integrar presenca, resultado e sinais de excecao no contexto da turma.
- Validar adocao com operadores chave.

## Sprint 3 (1 a 2 semanas)

- Onda 3 completa.
- Ajustar dashboard e governanca.
- Decidir sobre criacao de pagina nova com base em dados.

## 9. Metricas de Sucesso

- Tempo medio para concluir operacao de uma turma.
- Numero medio de navegacoes entre paginas por ciclo operacional.
- Taxa de erros operacionais (lancamento incorreto, acao em pagina errada).
- Tempo de resposta para tratar excecoes de reagendamento.
- Satisfacao do operador (feedback qualitativo da equipe).

## 10. Riscos e Mitigacoes

- Risco: regressao de fluxo em telas legadas.
- Mitigacao: manter fallback de rota durante transicao.

- Risco: confusao por mudanca de labels e caminhos.
- Mitigacao: manter nomenclatura consistente e comunicar mudancas no release.

- Risco: regras operacionais divergirem do backend.
- Mitigacao: validar regras criticas em RPC e nao apenas no cliente.

## 11. Dependencias Tecnicas

- Revisao funcional com operadores admin/coordinator.
- Validacao de permissao por perfil em fluxos alterados.
- Revisao humana para qualquer alteracao de RPC, migration ou RLS.

## 12. Regras de Negocio Obrigatorias (novas)

### 12.1 Falta confirmada e desbloqueio de reagendamento

- Regra: quando a falta do militar for confirmada na turma, o sistema deve liberar automaticamente o fluxo de reagendamento para esse militar.
- Gatilho de negocio: confirmacao explicita de falta no contexto da sessao (acao administrativa auditavel).
- Implementacao obrigatoria: confirmacao de falta deve chamar RPC especifica (ou regra formal equivalente no backend), sem depender de update direto no frontend.
- Resultado esperado:
- o militar passa para estado elegivel de reagendamento;
- a UI exibe acao de reagendar sem depender de ajuste manual externo;
- a elegibilidade fica rastreavel em auditoria.

### 12.2 Hierarquia de estados operacionais

- Estado de agendamento (booking): agendado, remarcado, cancelado.
- Estado de presenca: presente, falta_confirmada.
- Estado de resultado: pendente, apto, inapto.
- Regra de dependencia:
- lancamento de resultado depende de presenca confirmada;
- reagendamento depende de falta confirmada (ou regra formal equivalente definida pelo backend).

### 12.3 Fonte de verdade

- Validacao final das regras deve ocorrer em RPC/backend.
- Frontend apenas orienta, bloqueia UX e exibe mensagens coerentes.
- Nao pode existir caminho de UI que permita burlar regra de negocio por ordem de cliques.

### 12.4 Matriz oficial de transicao de estados

- Definir tabela canônica com: estado atual, acao permitida, proximo estado e bloqueios.
- Publicar matriz para uso de produto, frontend, backend e QA.
- Frontend deve bloquear UX para transicoes fora da matriz (ex.: resultado sem presenca confirmada).
- Backend/RPC deve validar a mesma matriz como fonte final de verdade.
- Tratar qualquer transicao fora da matriz como erro de regra.

### 12.5 SLA e priorizacao de reagendamento

- Definir SLA de triagem para solicitacoes (exemplo: x horas para primeira analise).
- Definir prioridade operacional por motivo (exemplo: motivo justificado > falta confirmada).
- Dashboard deve ordenar fila por prioridade e prazo de SLA.

### 12.6 Limite de reagendamento por ciclo

- Definir limite de reagendamento por periodo operacional (exemplo: 1 por ciclo).
- Excecoes so podem ocorrer por perfil autorizado e com justificativa obrigatoria.
- Excecoes devem gerar trilha de auditoria especifica.

### 12.7 Janela de corte e tolerancia

- Definir cutoff para confirmacao de presenca e abertura de reagendamento.
- Definir tolerancia configuravel de atraso por contexto (OM/tipo de sessao, quando aplicavel).
- Fora da janela, acao deve exigir fluxo de excecao formal.

### 12.8 Idempotencia e concorrencia

- Acoes criticas (confirmar falta, aprovar reagendamento, lancar resultado) devem ser idempotentes.
- Bloquear duplo processamento por clique repetido ou requisicoes concorrentes.
- Exigir estado de loading e desabilitacao imediata por registro/acao (ex.: deferir/indeferir e salvar resultado).
- Implementar mecanismo de concorrencia otimista/pessimista para evitar sobrescrita silenciosa.

### 12.9 Justificativa estruturada obrigatoria

- Solicitar motivo em formato estruturado (categoria + detalhe), evitando texto livre puro.
- Exigir justificativa obrigatoria para toda decisao de indeferimento/excecao.
- Manter padrao de mensagem para facilitar auditoria e analytics.

### 12.10 Notificacao ativa de mudanca de estado

- Definir eventos que disparam notificacao (exemplo: reagendamento deferido, falta confirmada, sessao remarcada).
- Notificacao deve apontar proxima acao e destino da tela.
- Nao depender de atualizacao manual para visibilidade de mudancas criticas.

## 13. Politica de Timezone (America/Sao_Paulo)

### 13.1 Regra global

- Todo horario operacional exibido para admin deve ser interpretado e apresentado no timezone de Brasilia (`America/Sao_Paulo`).

### 13.2 Regras de implementacao

- Persistencia:
- timestamps de evento em UTC no backend (referencia tecnica);
- datas operacionais (dia da sessao) tratadas como data local de negocio, sem shift de timezone na renderizacao.
- Exibicao:
- UI sempre formata data/hora com timezone de Brasilia quando houver componente de horario;
- campos somente-data nao podem sofrer conversao que altere o dia exibido.
- Proibir parse/formatacao ad-hoc de data em paginas administrativas; usar util central de timezone para evitar divergencia entre telas.

### 13.3 Anti-regressao de timezone

- Nao pode ocorrer:
- exibicao de dia anterior/posterior por parse UTC indevido;
- diferenca de horario entre telas para o mesmo registro;
- mudanca silenciosa de timezone por ambiente local do navegador.

## 14. Criterios de Teste para Novas Regras

### 14.1 Falta e reagendamento

- Caso 1: confirmar falta de militar -> acao de reagendamento habilitada.
- Caso 2: desconfirmar falta -> acao volta a ficar bloqueada (se aplicavel pela regra).
- Caso 3: tentativa de reagendar sem falta confirmada -> bloqueio com mensagem clara.

### 14.2 Timezone Brasilia

- Caso 1: sessao em data limite (00:00 UTC) nao muda de dia na UI admin.
- Caso 2: mesma sessao exibida em telas diferentes mostra mesmo dia/hora em Brasilia.
- Caso 3: ambiente local com timezone diferente nao altera exibicao operacional.

### 14.3 Matriz de estado e bloqueios

- Caso 1: transicao valida segue matriz e registra evento.
- Caso 2: transicao invalida e bloqueada com mensagem clara.
- Caso 3: tentativa de burlar dependencia (exemplo: resultado sem presenca) e rejeitada.

### 14.4 SLA e fila de priorizacao

- Caso 1: solicitacoes ordenadas por prioridade e prazo limite.
- Caso 2: item estourado de SLA aparece como alerta operacional.
- Caso 3: mudanca de prioridade reflete imediatamente na fila.

### 14.5 Concorrencia e idempotencia

- Caso 1: duplo clique em acao critica nao duplica efeito.
- Caso 2: duas atualizacoes simultaneas no mesmo registro nao geram estado inconsistente.
- Caso 3: conflito de versao retorna feedback e orientacao de recarga.

## 15. Checklist de Entrega por Etapa

- Criticidade e impacto mapeados.
- Fluxo documentado no Contexto de Rotas.
- QA funcional em desktop e tablet.
- Verificacao de lint e tipagem.
- Evidencia de metricas antes/depois coletada.
- Evidencia de testes das regras de falta/reagendamento.
- Evidencia de testes anti-regressao de timezone Brasilia.
- Evidencia de testes da matriz de estados e bloqueios.
- Evidencia de testes de idempotencia e concorrencia.
- Evidencia de conformidade de SLA e prioridade operacional.

## 16. Decisao Executiva Recomendada

- Executar Etapas 1 a 6 antes de criar nova pagina transversal.
- Usar a Etapa 6 para consolidar navegacao final e governanca.
- Criar pagina transversal apenas com evidencia de ganho operacional mensuravel.

## 17. Recomendacoes Tecnicas para Implementacao

- Expandir `useSessions` para retornar, alem da disponibilidade, indicadores de completude operacional por turma (ex.: percentual de resultados lancados e pendencias de presenca).
- Avaliar componente `BookingActionManager` para encapsular Presenca + Resultado + Reagendamento no mesmo contrato de UI e reaproveitar o fluxo em telas diferentes.
- Priorizar evolucao incremental: primeiro compartilhar logica e componentes entre telas existentes; criar pagina transversal apenas se o ganho operacional for comprovado por metricas.
- Garantir sincronizacao de timezone em toda interface admin com util unica, reduzindo risco de day shift e inconsistencias de horario entre modulos.

## 18. TODO Executivo (Aprovacao)

- [ ] Validar e aprovar matriz oficial de transicao de estados.
- [ ] Aprovar contrato de contexto por URL params no fluxo admin.
- [ ] Aprovar escopo de RPC para falta confirmada e elegibilidade de reagendamento.
- [ ] Aprovar padrao unico de timezone `America/Sao_Paulo` para telas administrativas.
- [ ] Aprovar criterio de fila operacional no dashboard (pendencias antes de disponibilidade futura).
- [ ] Aprovar estrategia de PRs por etapa logica.
- [ ] Aprovar criterios de aceite e checklist de verificacao por etapa.

## 19. Correcoes Aplicadas no Plano

### 19.1 Estrutura

- Correcao: migracao de planejamento por ondas para planejamento por etapas logicas.
- Motivo: reduzir ambiguidade de sequencia, facilitar aprovacao por dependencia tecnica e permitir execucao incremental com menor risco.

### 19.2 Regras de negocio

- Correcao: explicitar que falta confirmada e elegibilidade de reagendamento devem ser validadas via RPC/backend.
- Motivo: manter fonte de verdade no banco e evitar bypass de regra por ordem de cliques no frontend.

### 19.3 Confiabilidade operacional

- Correcao: incluir idempotencia de UX (loading e desabilitacao por acao/registro).
- Motivo: prevenir duplo processamento em operacoes criticas (salvar, deferir, indeferir).

### 19.4 Datas e timezone

- Correcao: centralizar parse/format em util unica e proibir parse ad-hoc em telas admin.
- Motivo: eliminar day shift e divergencia de horario entre modulos.

### 19.5 Dashboard

- Correcao: priorizar fila operacional por pendencias em vez de lista de proximas turmas abertas.
- Motivo: alinhar interface com jornada real do operador e reduzir tempo de decisao.

## 20. Backlog de Issues do Refatoramento

### ISSUE-01 - Matriz oficial de estados e bloqueios

- Objetivo: consolidar tabela canonica de transicoes e bloqueios para frontend/backend/QA.
- Escopo: documento oficial de estados, acao permitida, proximo estado, bloqueio e mensagem.
- Fora de escopo: alteracao visual de tela.
- Dependencias: nenhuma.
- Arquivos: docs/PLANO_DETALHADO_REFACTORACAO_UIUX_ADMIN.md, docs/ContextRotaAdmin.md.
- Criterios de aceite: matriz aprovada por produto, backend e frontend.
- Risco: medio (desalinhamento entre areas).

### ISSUE-02 - Contexto de sessao por URL params

- Objetivo: preservar contexto no refresh/deep link sem perda de sessao.
- Escopo: fluxo Turmas -> Agendamentos -> Lancamento de Indices com URL params.
- Fora de escopo: mudanca de regra de negocio.
- Dependencias: ISSUE-01.
- Arquivos: src/pages/SessionsManagement.tsx, src/pages/ScoreEntry.tsx, src/utils/routeRegistry.ts, docs/ContextRotaAdmin.md.
- Criterios de aceite: refresh mantem sessao; fallback temporario com state ativo na migracao.
- Risco: baixo.

### ISSUE-03 - Integracao contextual presenca, resultado e excecoes

- Objetivo: aproximar operacao por participante no contexto da turma.
- Escopo: sinalizacao de reagendamento por participante e navegacao contextual para resultado.
- Fora de escopo: nova pagina transversal.
- Dependencias: ISSUE-02.
- Arquivos: src/pages/SessionBookingsManagement.tsx, src/pages/ScoreEntry.tsx, src/pages/ReschedulingManagement.tsx.
- Criterios de aceite: operador conclui fluxo operacional sem quebra de contexto.
- Risco: medio.

### ISSUE-04 - RPC de falta confirmada e elegibilidade de reagendamento

- Objetivo: mover validacao critica para backend com auditoria.
- Escopo: RPC de negocio para falta confirmada e liberacao de elegibilidade de reagendamento.
- Fora de escopo: alteracao ampla de schema fora do necessario.
- Dependencias: ISSUE-01.
- Arquivos: src/services/sessions.ts, src/services/bookings.ts, supabase/rpc/.
- Criterios de aceite: regra valida no backend; frontend recebe feedback claro.
- Risco: medio/alto (mudanca de contrato backend).

### ISSUE-05 - Guardrails de transicao e idempotencia

- Objetivo: impedir transicoes invalidas e duplicidade por clique repetido.
- Escopo: bloqueio UX + loading/desabilitacao imediata por acao.
- Fora de escopo: reescrita completa de hooks.
- Dependencias: ISSUE-01, ISSUE-03.
- Arquivos: src/pages/ScoreEntry.tsx, src/pages/ReschedulingManagement.tsx, src/hooks/useReschedulingManagement.ts.
- Criterios de aceite: sem duplo processamento e sem transicao fora da matriz.
- Risco: medio.

### ISSUE-06 - Padronizacao de timezone Brasilia

- Objetivo: garantir consistencia de data/hora operacional entre telas.
- Escopo: centralizar parse/format em util unica e remover parse ad-hoc admin.
- Fora de escopo: alterar timezone de persistencia backend (continua UTC para eventos).
- Dependencias: nenhuma.
- Arquivos: src/utils/date.ts, src/pages/AdminDashboard.tsx, src/pages/SessionBookingsManagement.tsx, src/pages/ScoreEntry.tsx.
- Criterios de aceite: zero day shift em cenarios de borda e consistencia entre telas.
- Risco: medio.

### ISSUE-07 - Dashboard por fila operacional

- Objetivo: priorizar o que fazer primeiro com base em pendencias reais.
- Escopo: substituir lista generica por fila operacional e criterios de prioridade.
- Fora de escopo: redesign completo da aplicacao.
- Dependencias: ISSUE-01, ISSUE-03.
- Arquivos: src/pages/AdminDashboard.tsx, src/hooks/useSessions.ts, src/services/bookings.ts.
- Criterios de aceite: dashboard ordena pendencias operacionais antes de disponibilidade futura.
- Risco: medio.

### ISSUE-08 - Revisao de governanca e arquitetura de navegacao

- Objetivo: remover duplicidade entre dashboard, configuracoes, auditoria e sidebar.
- Escopo: ajuste da arquitetura final de navegacao por dominio funcional.
- Fora de escopo: criacao obrigatoria de nova pagina transversal.
- Dependencias: ISSUE-07.
- Arquivos: src/components/layout/Sidebar.tsx, src/utils/routeRegistry.ts, src/pages/SystemSettings.tsx, src/pages/AuditLog.tsx.
- Criterios de aceite: navegacao sem sobreposicao confusa de responsabilidades.
- Risco: medio.

## 21. Plano de Entrega para Aprovacao

- Lote A (fundacao): ISSUE-01, ISSUE-02.
- Lote B (integracao): ISSUE-03, ISSUE-04, ISSUE-05.
- Lote C (consistencia): ISSUE-06.
- Lote D (consolidacao): ISSUE-07, ISSUE-08.
- Gate por lote: lint, tipagem, QA funcional desktop/tablet e checklist de aceite aplicado.

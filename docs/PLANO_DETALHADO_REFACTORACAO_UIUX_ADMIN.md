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

## 6. Roadmap por Ondas

## Onda 1 - Contexto Unico (baixo risco)

### Objetivo

- Reduzir troca de contexto sem alterar arquitetura principal de rotas.

### Entregaveis

- Melhorar CTA primario em Turmas para enfatizar operacao da sessao.
- Propagar contexto da sessao entre telas operacionais com navegacao consistente.
- Propagar contexto da sessao por URL params (query/path) e nao apenas `location.state`, preservando a sessao selecionada apos refresh.
- Padronizar labels e microcopy operacional.

### Arquivos alvo

- src/pages/SessionsManagement.tsx
- src/pages/SessionBookingsManagement.tsx
- src/pages/ScoreEntry.tsx
- src/utils/routeRegistry.ts
- docs/ContextRotaAdmin.md

### Criterios de aceite

- Operador consegue sair de Turmas e concluir presenca + resultado com menos navegacao.
- Labels de acao ficam consistentes em desktop e mobile.
- Refresh na tela de lancamento de indices preserva a turma em contexto sem exigir nova selecao manual.
- Nenhuma rota administrativa existente deixa de funcionar.

## Onda 2 - Integracao Funcional por Turma (medio risco)

### Objetivo

- Aproximar presenca, resultado e excecoes no fluxo da turma.

### Entregaveis

- Incluir acao contextual de resultado dentro da operacao da turma.
- Exibir estado de reagendamento por participante quando aplicavel.
- Manter pagina de Lancamento de Indices como fallback temporario.
- Implementar regra de desbloqueio de reagendamento por falta confirmada via RPC/backend, com trilha de auditoria.
- Padronizar tratamento de data/hora para timezone de Brasilia em todos os fluxos operacionais.
- Centralizar formatacao e parse de data/hora administrativa em util compartilhada (`src/utils/date.ts`), evitando parse direto distribuido.

### Arquivos alvo

- src/pages/SessionBookingsManagement.tsx
- src/pages/ScoreEntry.tsx
- src/pages/ReschedulingManagement.tsx
- src/services/sessions.ts
- src/services/bookings.ts

### Criterios de aceite

- Operador consegue executar presenca e avancar para resultado sem perder contexto da sessao.
- Existe sinalizacao clara de excecao (reagendamento) no contexto da turma.
- Fluxo anterior continua disponivel durante transicao.
- Militar com falta confirmada fica elegivel para reagendamento sem acao manual paralela.
- Elegibilidade de reagendamento por falta confirmada e validada no backend/RPC (frontend apenas orquestra e exibe feedback).
- Datas e horarios exibidos no admin permanecem estaveis no fuso de Brasilia (sem deslocamento de dia/hora).

## Onda 3 - Consolidacao de Jornada e Governanca (medio/alto risco)

### Objetivo

- Tornar dashboard orientado a pendencia operacional e reduzir sobreposicao de governanca.

### Entregaveis

- Ajustar dashboard para destacar fila de acao e prioridade operacional, substituindo a lista generica de proximas turmas abertas.
- Revisar relacao entre Configuracoes, Auditoria e modulos dedicados.
- Fechar arquitetura final de sidebar por dominio funcional.

### Arquivos alvo

- src/pages/AdminDashboard.tsx
- src/pages/SystemSettings.tsx
- src/pages/AuditLog.tsx
- src/components/layout/Sidebar.tsx
- src/utils/routeRegistry.ts

### Criterios de aceite

- Dashboard passa a orientar o que fazer primeiro.
- Dashboard prioriza turmas ja ocorridas com pendencias operacionais (presenca/resultado/reagendamento), em vez de apenas disponibilidade futura.
- Navegacao de governanca fica clara, sem duplicidade confusa.
- Sidebar final alinhada com jornada operacional definida no documento.

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

## 15. Checklist de Entrega por Onda

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

- Executar Onda 1 e Onda 2 antes de criar nova pagina.
- Usar Onda 3 para consolidar navegacao final e governanca.
- Criar pagina transversal apenas com evidencia de ganho operacional mensuravel.

## 17. Recomendacoes Tecnicas para Implementacao

- Expandir `useSessions` para retornar, alem da disponibilidade, indicadores de completude operacional por turma (ex.: percentual de resultados lancados e pendencias de presenca).
- Avaliar componente `BookingActionManager` para encapsular Presenca + Resultado + Reagendamento no mesmo contrato de UI e reaproveitar o fluxo em telas diferentes.
- Priorizar evolucao incremental: primeiro compartilhar logica e componentes entre telas existentes; criar pagina transversal apenas se o ganho operacional for comprovado por metricas.
- Garantir sincronizacao de timezone em toda interface admin com util unica, reduzindo risco de day shift e inconsistencias de horario entre modulos.

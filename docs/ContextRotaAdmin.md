# Contexto de Rotas - Perfil Administrador

Documento consolidado de navegacao e operacao para o perfil Administrador no TACF-Digital.

## Indice rapido

- Objetivo do documento
- Principios de fluxo administrativo
- Sidebar administrativa (estado atual)
- Arquitetura de navegacao por jornadas
- Mapa de rotas por jornada
- Fluxo operacional recomendado (ponta a ponta)
- Contrato funcional por rota
- Estados de tela esperados
- Regras de navegacao e guardas
- Mensagens e feedbacks criticos
- Integracao com backend e RPC
- Seguranca e privacidade
- Requisitos de UX e performance
- Checklist de validacao funcional
- Plano de otimizacao por prioridade
- Observacoes finais

## Objetivo do documento

- Alinhar operacao, produto e tecnologia sobre o escopo administrativo.
- Organizar o sistema por fluxo de trabalho real (e nao apenas por lista de telas).
- Definir limites claros entre interface (orquestracao) e backend/RPC (regras de dominio).

## Principios de fluxo administrativo

- O admin deve operar por jornada: planejar, executar, tratar excecoes e auditar.
- A entidade central da operacao e o agendamento (booking).
- Presenca, resultado e reagendamento sao estados do mesmo fluxo operacional.
- Configuracao, auditoria e infraestrutura sao fluxos de governanca, nao de execucao diaria.
- Regras criticas devem ser validadas no backend/RPC, nunca apenas na interface.

## Sidebar administrativa (estado atual)

Menu persistente observado no sistema para perfil admin/coordinator:

- Visao Geral
- Gerenciar Turmas
- Gerenciar Efetivo
- Locais de Avaliacao
- Reagendamentos
- Lancar Indices
- Relatorios
- Configuracoes
- Auditoria de acesso
- Perfil do usuario (rodape)

## Arquitetura de navegacao por jornadas

### 1. Planejamento operacional

- Definir capacidade, calendario e parametros de execucao.
- Rotas principais: turmas, criacao/edicao de turma, locais e horarios.

### 2. Operacao de agendamentos

- Executar a turma no dia a dia: confirmar presenca, lancar resultado e acompanhar status.
- Rotas principais: agendamentos da turma e lancamento de indices.

### 3. Gestao de efetivo e prontidao

- Consultar aptidao, historico e dados do militar para suporte operacional.
- Rotas principais: efetivo e edicao de cadastro individual.

### 4. Excecoes operacionais

- Tratar solicitacoes de reagendamento e notificar/acompanhar pendencias.
- Rotas principais: reagendamentos e notificacoes de reagendamento.

### 5. Governanca e compliance

- Monitorar indicadores, parametros globais, acessos e trilha auditavel.
- Rotas principais: analytics, configuracoes, perfis e auditoria.

## Mapa de rotas por jornada

### Planejamento operacional

- `/app/admin`: dashboard administrativo.
- `/app/turmas`: listagem e gestao de turmas.
- `/app/turmas/nova`: criacao de nova turma.
- `/app/turmas/:sessionId/editar`: edicao de turma.
- `/app/om-locations`: gestao de OMs e locais.
- `/app/om/:id`: edicao da OM selecionada.
- `/app/om/:id/schedules`: horarios e janelas por OM.

### Operacao de agendamentos

- `/app/turmas/:sessionId/agendamentos`: operacao de participantes e presenca por turma.
- `/app/lancamento-indices`: registro de resultado final operacional (apto/inapto).

### Gestao de efetivo

- `/app/efetivo`: consulta consolidada do efetivo e aptidao.
- `/app/efetivo/:userId/editar`: manutencao cadastral de militar.

### Excecoes operacionais

- `/app/reagendamentos`: analise e decisao (deferir/indeferir).
- `/app/reagendamentos/notificacao`: notificacoes e acompanhamento auxiliar.

### Governanca e compliance

- `/app/analytics`: relatorios e indicadores consolidados.
- `/app/configuracoes`: parametros globais do sistema.
- `/app/configuracoes/perfis`: gestao de perfis e permissoes.
- `/app/auditoria`: trilha tecnica e operacional.

## Fluxo operacional recomendado (ponta a ponta)

### Fluxo principal de execucao TACF

1. Entrar em `/app/admin` para identificar pendencias do dia.
2. Abrir `/app/turmas` e selecionar a turma alvo.
3. Operar `/app/turmas/:sessionId/agendamentos` para confirmar presenca e status.
4. Registrar resultados em `/app/lancamento-indices` (idealmente com contexto da mesma turma).
5. Tratar excecoes em `/app/reagendamentos`.
6. Fechar ciclo com analise em `/app/analytics` e rastreabilidade em `/app/auditoria`.

### Fluxo de suporte (infraestrutura)

1. Ajustar capacidade e disponibilidade em `/app/om-locations`.
2. Editar dados da OM em `/app/om/:id`.
3. Ajustar janelas de horario em `/app/om/:id/schedules`.

## Contrato funcional por rota

### `/app/admin`

- Exibir visao acionavel de capacidade, pendencias e atalhos operacionais.
- Priorizar o que exige acao imediata no primeiro viewport.

### `/app/turmas` e `/app/turmas/nova`

- Permitir ciclo completo de criacao e gestao de turmas.
- Validar disponibilidade e restricoes no backend.

### `/app/turmas/:sessionId/editar`

- Permitir manutencao da turma antes da execucao.
- Bloquear edicoes inconsistentes para turma concluida.

### `/app/turmas/:sessionId/agendamentos`

- Concentrar operacao da turma: visibilidade de participantes, status e presenca.
- Exibir acoes de alta frequencia com baixo atrito.

### `/app/lancamento-indices`

- Registrar resultado final por agendamento (apto/inapto).
- Confirmar persistencia e item atualizado.
- Regra de negocio deve ser garantida no backend/RPC.

### `/app/efetivo` e `/app/efetivo/:userId/editar`

- Oferecer consulta e manutencao de dados do efetivo.
- Preservar acesso por perfil para campos sensiveis.

### `/app/reagendamentos` e `/app/reagendamentos/notificacao`

- Centralizar triagem, decisao e visibilidade de solicitacoes.
- Manter status rastreavel e historico de decisao.

### `/app/analytics`

- Exibir indicadores para apoio a decisao.
- Disponibilizar filtros por periodo, OM e contexto operacional.

### `/app/configuracoes` e `/app/configuracoes/perfis`

- Reunir parametros globais e administracao de acesso.
- Manter mudancas controladas, auditaveis e reversiveis.

### `/app/auditoria`

- Exibir trilha completa de eventos tecnicos e operacionais.
- Facilitar rastreabilidade por data, ator e tipo de acao.

### `/app/om-locations`, `/app/om/:id`, `/app/om/:id/schedules`

- Gerir cadastro estrutural e agenda de infraestrutura.
- Refletir impacto operacional em capacidade e disponibilidade.

## Estados de tela esperados

- `loading`: feedback claro sem travar navegacao principal.
- `empty`: orientacao objetiva da proxima acao.
- `success`: dados consolidados com CTA principal evidente.
- `error`: mensagem com impacto e opcao de reexecucao.
- `forbidden`: acesso negado com orientacao de escalonamento.
- `stale-data`: aviso de possivel desatualizacao com acao de atualizar.

## Regras de navegacao e guardas

- Todas as rotas `/app/*` exigem autenticacao.
- Rotas administrativas exigem permissao admin/coordinator.
- Usuario sem permissao administrativa deve ser redirecionado.
- Sessao expirada deve redirecionar para login e limpar estado sensivel.

## Mensagens e feedbacks criticos

- Criacao/edicao de turma: confirmar sucesso e impacto operacional.
- Presenca e resultado: confirmar item atualizado sem ambiguidade.
- Reagendamento deferido/indeferido: status final e justificativa resumida.
- Configuracao/perfil alterado: confirmar escopo da mudanca.

## Integracao com backend e RPC

- Frontend orquestra fluxo e experiencia do operador.
- Regras criticas de dominio ficam no backend/RPC.
- Capacidade, disponibilidade e validacoes nao devem ser duplicadas no cliente.
- Consultas e mutacoes devem usar o client central em `src/services/supabase.ts`.

## Seguranca e privacidade

- Respeitar RLS em todas as operacoes administrativas.
- Garantir trilha auditavel para alteracoes relevantes.
- Evitar exposicao de dados sensiveis fora de contexto autorizado.
- Nao persistir informacoes pessoais sensiveis em logs de interface.

## Requisitos de UX e performance

- Fluxos de alta frequencia devem minimizar passos e retrabalho.
- Listagens extensas devem ter filtros, busca e paginacao eficientes.
- Dashboard e analytics devem usar carregamento progressivo.
- Interface administrativa deve manter responsividade em desktop e tablet.

## Checklist de validacao funcional

- Admin autenticado acessa rotas administrativas sem quebra de contexto.
- Usuario sem permissao administrativa e bloqueado corretamente.
- Fluxo de turma (criar, editar, operar agendamentos) funciona ponta a ponta.
- Fluxo de reagendamento (analise, decisao, notificacao) permanece rastreavel.
- Configuracoes e perfis refletem alteracoes com controle de acesso.
- Auditoria apresenta eventos relevantes para investigacao.
- Infraestrutura (OM e horarios) impacta disponibilidade de forma coerente.

## Plano de otimizacao por prioridade

### Prioridade alta

- Aproximar `/app/turmas/:sessionId/agendamentos` e `/app/lancamento-indices` em um fluxo unico de operacao por turma.
- Reduzir troca de contexto entre presenca, resultado e reagendamento.

### Prioridade media

- Tornar `/app/admin` um painel de pendencias operacionais (fila de acao), nao apenas atalhos.
- Melhorar encadeamento entre efetivo, turma e excecoes.

### Prioridade estrutural

- Evitar sobreposicao entre `/app/configuracoes` e telas dedicadas de auditoria/perfis/infra.
- Manter contratos funcionais claros para cada rota dedicada.

## Observacoes finais

- Este documento representa o fluxo alvo para operacao administrativa.
- Mudancas em regra de negocio devem priorizar backend/RPC antes da interface.
- Alteracoes em banco, RLS, migrations ou RPC exigem revisao humana do coordenador.

# Contexto de Rotas - Perfil Administrador

Documento consolidado de navegacao e comportamento funcional para o perfil Administrador no TACF-Digital.

## Indice rapido

- Objetivo do documento
- Sidebar (menu persistente)
- Mapa de rotas principais
- Matriz de navegacao por objetivo
- Estados de tela esperados
- Regras de navegacao e guardas
- Contrato funcional por rota
- Mensagens e feedbacks criticos
- Integracao com backend e RPC
- Seguranca e privacidade
- Requisitos de UX e performance
- Checklist de validacao funcional
- Observacoes finais

## Objetivo do documento

- Alinhar operacao, produto e tecnologia sobre o escopo administrativo.
- Consolidar rotas, jornadas, estados de tela e criterios de governanca.
- Definir limites entre camada de interface e regras de dominio no backend.

## Sidebar (menu persistente)

- Visao Geral / Dashboard
- Gerenciar Turmas
- Efetivo / Militares
- Relatorios / Analytics
- Configuracoes
- Perfil do usuario (rodape)

## Mapa de rotas principais

As rotas abaixo representam os acessos de operacao e governanca mais relevantes.

- `/app/admin`: dashboard administrativo.
- `/app/turmas`: listagem e gestao de turmas.
- `/app/turmas/nova`: criacao de nova turma.
- `/app/turmas/:sessionId/editar`: edicao de turma.
- `/app/turmas/:sessionId/agendamentos`: lista de agendamentos por turma.
- `/app/lancamento-indices`: lancamento de resultados (corrida, flexao, abdominal).
- `/app/efetivo`: consulta de efetivo e aptidao.
- `/app/efetivo/:userId/editar`: manutencao cadastral de militar.
- `/app/reagendamentos`: analise de pedidos de reagendamento (deferir/indeferir).
- `/app/reagendamentos/notificacao`: acompanhamento e comunicacao das solicitacoes.
- `/app/analytics`: relatorios consolidados e indicadores.
- `/app/configuracoes`: parametros globais do sistema.
- `/app/configuracoes/perfis`: gestao de perfis e permissoes.
- `/app/auditoria`: trilha de auditoria e detalhamento tecnico.
- `/app/om-locations`: gestao de OMs e locais.
- `/app/om/:id`: detalhes da OM.
- `/app/om/:id/schedules`: horarios e janelas por OM.

## Matriz de navegacao por objetivo

### 1. Gerir turmas e execucao TACF

- Entrada recomendada: `/app/admin`.
- Acoes nucleares: operar turmas, capacidade e agenda de execucao.
- Rotas de trabalho: `/app/turmas`, `/app/turmas/nova`, `/app/turmas/:sessionId/editar`, `/app/turmas/:sessionId/agendamentos`, `/app/lancamento-indices`.

### 2. Gerir efetivo e solicitacoes

- Consultar situacao do efetivo em `/app/efetivo`.
- Tratar dados de militar em `/app/efetivo/:userId/editar`.
- Processar pedidos em `/app/reagendamentos`.
- Comunicar andamentos em `/app/reagendamentos/notificacao`.

### 3. Governanca, compliance e inteligencia

- Acompanhar desempenho agregado em `/app/analytics`.
- Ajustar regras e parametros em `/app/configuracoes`.
- Administrar acessos em `/app/configuracoes/perfis`.
- Auditar eventos em `/app/auditoria`.
- Gerenciar infraestrutura (OM/local/horario) em `/app/om-locations`, `/app/om/:id`, `/app/om/:id/schedules`.

## Estados de tela esperados (todas as rotas)

- `loading`: carregamento com feedback claro e sem bloquear navegacao principal.
- `empty`: estado sem dados com acao orientada (ex.: criar turma, ajustar filtro).
- `success`: dados consolidados com acoes primarias evidentes.
- `error`: falha com resumo, impacto e opcao de reexecucao.
- `forbidden`: acesso negado por perfil/permissao com orientacao de escalonamento.
- `stale-data` (quando aplicavel): aviso de dados possivelmente desatualizados e acao de atualizar.

## Regras de navegacao e guardas

- Todas as rotas `/app/*` exigem autenticacao (`ProtectedRoute`).
- Rotas administrativas exigem permissao de admin (`AdminRoute`).
- Usuario nao administrador deve ser redirecionado para escopo permitido.
- Em sessao expirada, redirecionar para login e limpar estado sensivel.

## Contrato funcional por rota

### `/app/admin`

- Apresenta visao de capacidade, pendencias e alertas de operacao.
- Deve priorizar informacao acionavel no primeiro viewport.

### `/app/turmas` e `/app/turmas/nova`

- Permitem ciclo de criacao e gestao de turmas.
- Criacao deve respeitar restricoes de disponibilidade aplicadas no backend.

### `/app/turmas/:sessionId/editar` e `/app/turmas/:sessionId/agendamentos`

- Permitem manutencao da turma e gestao de participantes/agendamentos.
- Alteracoes sensiveis devem registrar trilha de auditoria.

### `/app/lancamento-indices`

- Registra indices de desempenho por criterio operacional.
- Deve validar formato de entrada no frontend e regra de negocio no backend.

### `/app/efetivo` e `/app/efetivo/:userId/editar`

- Suportam consulta e manutencao de dados do efetivo.
- Campos sensiveis devem seguir politica de acesso por perfil.

### `/app/reagendamentos` e `/app/reagendamentos/notificacao`

- Centralizam analise, decisao e comunicacao de solicitacoes.
- Decisoes devem deixar status rastreavel para consulta posterior.

### `/app/analytics`

- Exibe indicadores consolidados para apoio a decisao.
- Deve oferecer filtros claros por periodo, OM e contexto operacional.

### `/app/configuracoes` e `/app/configuracoes/perfis`

- Reunem parametros globais e administracao de acesso.
- Mudancas devem ter efeito controlado e auditavel.

### `/app/auditoria`

- Exibe trilha de eventos tecnicos e operacionais.
- Deve facilitar rastreabilidade por data, ator e tipo de acao.

### `/app/om-locations`, `/app/om/:id`, `/app/om/:id/schedules`

- Organizam cadastro estrutural de OMs, locais e janelas de horario.
- Mudancas devem refletir impacto em disponibilidade de agenda.

## Mensagens e feedbacks criticos

- Criacao/edicao de turma: confirmar sucesso e destacar impacto operacional.
- Lancamento de indices: confirmar persistencia e indicar item atualizado.
- Reagendamento deferido/indeferido: exibir status final e justificativa resumida.
- Alteracao de configuracao/perfil: exibir confirmacao com escopo da mudanca.

## Integracao com backend e RPC

- Frontend orquestra fluxo e experiencia do operador.
- Regras criticas de dominio ficam no backend/RPC.
- Capacidade, disponibilidade, confirmacao e validacoes nao devem ser duplicadas no cliente.
- Consultas e mutacoes devem usar o client central em `src/services/supabase.ts`.

## Seguranca e privacidade

- Respeitar RLS para todas as operacoes administrativas.
- Garantir trilha auditavel para alteracoes relevantes.
- Evitar exposicao de dados sensiveis fora do contexto autorizado.
- Nao persistir informacoes pessoais sensiveis em logs de interface.

## Requisitos de UX e performance

- Fluxos de alta frequencia devem minimizar passos e retrabalho.
- Tabelas e listagens extensas devem ter filtros e paginacao eficientes.
- Dashboard e analytics devem exibir feedback de carregamento progressivo.
- Interface administrativa deve manter responsividade em desktop e tablet.

## Checklist de validacao funcional

- Admin autenticado acessa rotas administrativas sem quebra de contexto.
- Usuario sem permissao administrativa e bloqueado corretamente.
- Fluxo de turma (criar, editar, listar agendamentos) funciona ponta a ponta.
- Fluxo de reagendamento (analise, decisao, notificacao) permanece rastreavel.
- Configuracoes e perfis refletem alteracoes com controle de acesso.
- Auditoria apresenta eventos relevantes para investigacao.

## Observacoes finais

- Este documento representa o fluxo alvo do perfil Administrador.
- Mudancas em regra de negocio devem priorizar backend/RPC antes da camada de interface.
- Alteracoes que impactem banco, RLS, migrations ou RPC exigem revisao humana do coordenador.

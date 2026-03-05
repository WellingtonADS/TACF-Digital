# Contexto de Rotas - Perfil Administrador

Documento consolidado de navegacao para o perfil Administrador no TACF-Digital.

## Sidebar (menu persistente)

- Visao Geral / Dashboard
- Gerenciar Turmas
- Efetivo / Militares
- Relatorios / Analytics
- Configuracoes
- Perfil do usuario (rodape)

## Rotas Administrativas Principais

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
- `/app/reagendamentos/notificacao`: acompanhamento/comunicacao das solicitacoes.
- `/app/analytics`: relatorios consolidados e indicadores.
- `/app/configuracoes`: parametros globais do sistema.
- `/app/configuracoes/perfis`: gestao de perfis e permissoes.
- `/app/auditoria`: trilha de auditoria e detalhamento tecnico.
- `/app/om-locations`: gestao de OMs e locais.
- `/app/om/:id`: detalhes da OM.
- `/app/om/:id/schedules`: horarios e janelas por OM.

## Fluxos Operacionais

### 1. Gestao de turmas e execucao TACF

- Acessar dashboard (`/app/admin`) para visao de capacidade e pendencias.
- Operar turmas em `/app/turmas`.
- Criar turma em `/app/turmas/nova`.
- Editar parametros em `/app/turmas/:sessionId/editar`.
- Gerenciar inscritos em `/app/turmas/:sessionId/agendamentos`.
- Registrar indices em `/app/lancamento-indices`.

### 2. Efetivo e solicitacoes

- Consultar situacao do efetivo em `/app/efetivo`.
- Tratar dados de um militar em `/app/efetivo/:userId/editar`.
- Processar pedidos de reagendamento em `/app/reagendamentos`.
- Publicar/consultar notificacoes em `/app/reagendamentos/notificacao`.

### 3. Governanca e inteligencia

- Acompanhar desempenho agregado em `/app/analytics`.
- Ajustar regras e parametros em `/app/configuracoes`.
- Administrar acessos em `/app/configuracoes/perfis`.
- Auditar eventos em `/app/auditoria`.
- Gerenciar infraestrutura (OM/local/horario) em rotas `/app/om-*`.

## Observacoes de arquitetura

- Regras de dominio (capacidade, disponibilidade, confirmacao e validacoes criticas) devem permanecer no backend/RPC.
- O frontend atua como camada de apresentacao e orquestracao de fluxo.

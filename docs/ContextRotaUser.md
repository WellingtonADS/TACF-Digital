# Contexto de Rotas - Perfil Usuario

Documento consolidado de navegacao para o perfil Usuario (militar) no TACF-Digital.

## Sidebar (menu persistente)

- Dashboard
- Agendamentos / Avaliacoes
- Documentos
- Resultados / Historico
- Meu Perfil
- Sair

## Rotas de Usuario Principais

- `/app/agendamentos`: selecao de data, local e horario.
- `/app/agendamentos/confirmacao`: revisao dos dados e confirmacao do agendamento.
- `/app/ticket`: comprovante digital (ticket) apos confirmacao.
- `/app/resultados`: consulta de resultados e desempenho.
- `/app/documentos`: acesso a documentos e referencias operacionais.
- `/app/recurso`: abertura de solicitacao de revisao de resultado.
- `/app/perfil`: dados pessoais/militares e informacoes de saude.

## Fluxos de Uso

### 1. Monitoramento inicial

- O usuario acessa o dashboard para validar status de prontidao.
- Alertas operacionais (ex.: validade de inspecao) orientam as proximas acoes.

### 2. Novo agendamento TACF

- Etapa 1: selecionar local, data e horario em `/app/agendamentos`.
- Etapa 2: revisar requisitos e confirmar em `/app/agendamentos/confirmacao`.
- Etapa 3: obter comprovante em `/app/ticket`.

### 3. Acompanhamento de desempenho

- Consultar resultados e historico em `/app/resultados`.
- Acessar documentos complementares em `/app/documentos`.

### 4. Excecoes e solicitacoes

- Abrir recurso de resultado em `/app/recurso`.
- Solicitar reagendamento pelos pontos de entrada da interface (drawer/cartoes), com analise administrativa posterior.

### 5. Manutencao de perfil

- Atualizar informacoes em `/app/perfil` para manter comunicacao e autorizacoes operacionais consistentes.

## Observacoes de arquitetura

- O frontend guia o fluxo e exibe estados da operacao.
- Validacoes criticas de dominio devem permanecer no backend/RPC.

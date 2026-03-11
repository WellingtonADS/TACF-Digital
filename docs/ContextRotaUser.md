# Contexto de Rotas - Perfil Usuario

Documento consolidado de navegacao e comportamento funcional para o perfil Usuario (militar) no TACF-Digital.

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

- Alinhar produto, frontend e backend sobre a experiencia do usuario militar.
- Centralizar rotas, jornadas, estados de tela e regras de integracao.
- Registrar limites de responsabilidade entre interface e regras de dominio.

## Sidebar (menu persistente)

- Dashboard
- Agendamentos / Avaliacoes
- Documentos
- Resultados / Historico
- Meu Perfil
- Sair

## Mapa de rotas principais

- `/app`: visao de status operacional, alertas e proximas acoes.
- `/app/agendamentos`: selecao de local, data e horario para nova marcacao.
- `/app/agendamentos/confirmacao`: revisao final de dados e confirmacao.
- `/app/ticket`: comprovante digital apos confirmacao de agendamento.
- `/app/resultados`: consulta de resultados, historico e desempenho.
- `/app/documentos`: acesso a documentos normativos e materiais de apoio.
- `/app/recurso`: abertura de solicitacao de revisao de resultado.
- `/app/perfil`: dados pessoais, militares, contato e saude.

## Matriz de navegacao por objetivo

### 1. Monitorar prontidao

- Entrada recomendada: `/app`.
- Acao principal: verificar alertas operacionais e pendencias.
- Saidas comuns: `/app/agendamentos`, `/app/perfil`, `/app/documentos`.

### 2. Realizar novo agendamento TACF

- Etapa 1: selecionar local, data e horario em `/app/agendamentos`.
- Etapa 2: revisar dados e requisitos em `/app/agendamentos/confirmacao`.
- Etapa 3: concluir e acessar comprovante em `/app/ticket`.

### 3. Acompanhar desempenho e evidencias

- Consultar resultados e historico em `/app/resultados`.
- Acessar materiais complementares em `/app/documentos`.

### 4. Tratar excecoes operacionais

- Abrir recurso de resultado em `/app/recurso`.
- Solicitar reagendamento pelos pontos de entrada da interface (drawer/cartoes), com analise administrativa posterior.

### 5. Manter cadastro atualizado

- Atualizar informacoes em `/app/perfil` para garantir comunicacao e autorizacoes consistentes.

## Estados de tela esperados (todas as rotas)

- `loading`: skeleton/spinner com feedback claro de carregamento.
- `empty`: mensagem orientativa quando nao houver dados.
- `success`: exibicao de dados com acoes primarias e secundarias visiveis.
- `error`: mensagem amigavel, causa resumida e opcao de tentar novamente.
- `forbidden`: bloqueio por permissao/perfil com orientacao de proximo passo.
- `offline` (quando aplicavel): aviso de instabilidade e tentativa de reconexao.

## Regras de navegacao e guardas

- Todas as rotas em `/app/*` exigem autenticacao via guardas por perfil (`UserRoute` e `AdminRoute`).
- Rotas deste documento pertencem ao escopo de usuario (`UserRoute`) e redirecionam perfis admin/coordinator para `/app/admin`.
- Usuario autenticado sem permissao para area administrativa nao deve acessar fluxos de admin.
- Apos logout, redirecionar para tela de login e limpar estado sensivel da sessao.

## Contrato funcional por rota

### `/app`

- Exibe resumo de status operacional, pendencias e proximos eventos.
- Deve priorizar informacao acionavel em primeiro viewport.

### `/app/agendamentos`

- Permite selecao de local, data e horario conforme disponibilidade retornada pelo backend.
- Nao deve confirmar agendamento nessa etapa.

### `/app/agendamentos/confirmacao`

- Exibe resumo final da solicitacao.
- Confirmacao deve disparar acao transacional no backend/RPC.

### `/app/ticket`

- Exibe comprovante digital do agendamento confirmado.
- Deve permitir consulta clara de identificador, data, hora e local.

### `/app/resultados`

- Exibe historico de desempenho e resultados publicados.
- Deve permitir leitura cronologica e entendimento de status.

### `/app/documentos`

- Lista documentos disponiveis por contexto operacional.
- Deve separar claramente material obrigatorio e complementar.

### `/app/recurso`

- Permite abertura de solicitacao de revisao vinculada ao resultado.
- Deve registrar contexto minimo para analise administrativa.

### `/app/perfil`

- Permite visualizar e atualizar dados cadastrais permitidos.
- Campos criticos podem ser somente leitura conforme politica.

## Mensagens e feedbacks criticos

- Confirmacao de agendamento: mostrar status final e caminho para `/app/ticket`.
- Falha de confirmacao: exibir motivo resumido e opcao de nova tentativa.
- Recurso enviado: confirmar protocolo e proximo estado esperado.
- Atualizacao de perfil: confirmar sucesso e refletir dados atualizados na tela.

## Integracao com backend e RPC

- O frontend guia o fluxo, coleta intencoes e apresenta estados.
- Validacoes criticas de dominio permanecem no backend/RPC.
- Regras de capacidade, quoruns, janelas e disponibilidade nao devem ser duplicadas no cliente.
- Consultas e mutacoes devem usar o client central em `src/services/supabase.ts`.

## Seguranca e privacidade

- Respeitar RLS para toda leitura/escrita de dados do usuario.
- Evitar exposicao de informacoes sensiveis fora do contexto autorizado.
- Nao registrar dados pessoais sensiveis em logs de interface.

## Requisitos de UX e performance

- Fluxo de agendamento deve minimizar cliques e reduzir retrabalho.
- Rotas principais devem ter carregamento progressivo com fallback leve.
- Interface precisa ser responsiva para desktop e mobile.
- A navegacao deve preservar contexto e facilitar retorno ao passo anterior.

## Checklist de validacao funcional

- Usuario autenticado acessa todas as rotas do escopo `/app/*` previsto.
- Usuario sem permissao nao acessa rotas fora do seu perfil.
- Fluxo completo de agendamento chega ate o ticket sem quebra de contexto.
- Resultados e documentos carregam com estados de loading/empty/error.
- Recurso pode ser aberto com retorno visual de protocolo.
- Perfil atualiza campos permitidos com feedback consistente.

## Observacoes finais

- Este documento descreve o fluxo alvo do perfil Usuario.
- Mudancas de regra de negocio devem ser refletidas primeiro em backend/RPC e depois na interface.
- Em alteracoes que impactem banco, RLS ou RPC, solicitar revisao humana do coordenador.

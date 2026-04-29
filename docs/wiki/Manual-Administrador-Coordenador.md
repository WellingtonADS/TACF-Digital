# Manual do Administrador e Coordenador — TACF Digital

> **Versão:** 1.0 · **Idioma:** Português Brasileiro  
> **Aplica-se a:** perfis `admin` e `coordinator`

---

## Sumário

1. [Visão Geral](#visão-geral)
2. [Painel Administrativo (`/app/admin`)](#painel-administrativo)
3. [Gestão de Turmas (`/app/turmas`)](#gestão-de-turmas)
   - 3.1 [Aba Sessões](#31-aba-sessões)
   - 3.2 [Criar / Editar / Duplicar Sessão](#32-criar--editar--duplicar-sessão)
   - 3.3 [Hub da Sessão](#33-hub-da-sessão)
   - 3.4 [Aba Reagendamentos](#34-aba-reagendamentos)
4. [Gestão de Efetivo (`/app/efetivo`)](#gestão-de-efetivo)
5. [Analytics (`/app/analytics`)](#analytics)
6. [Configurações do Sistema (`/app/configuracoes`)](#configurações-do-sistema)
   - 6.1 [Geral](#61-geral)
   - 6.2 [Avaliação](#62-avaliação)
   - 6.3 [Locais](#63-locais)
   - 6.4 [Perfis de Acesso](#64-perfis-de-acesso)
   - 6.5 [Auditoria (aba Configurações)](#65-auditoria-aba-configurações)
7. [Log de Auditoria (`/app/auditoria`)](#log-de-auditoria)
8. [Diferenças entre Admin e Coordenador](#diferenças-entre-admin-e-coordenador)

---

## Visão Geral

O **TACF Digital** é a plataforma de agendamento e gestão de sessões do teste de aptidão físico. Administradores e coordenadores acessam um conjunto ampliado de rotas para gerenciar sessões, efetivo, resultados e configurações.

| Perfil          | Acesso padrão               | Acesso extra (configurável)                    |
| --------------- | --------------------------- | ---------------------------------------------- |
| **admin**       | Todas as rotas              | —                                              |
| **coordinator** | `/app/admin`, `/app/turmas` | Outros módulos definidos em _Perfis de Acesso_ |

---

## Painel Administrativo

**Rota:** `/app/admin`

O painel consolida os principais indicadores operacionais em tempo real:

| Indicador                  | Descrição                                                |
| -------------------------- | -------------------------------------------------------- |
| **Total de Inscritos**     | Número total de militares cadastrados na plataforma      |
| **Aptos no Mês**           | Aprovados em sessões encerradas no mês corrente          |
| **Pendências**             | Militares com INSPSAU vencida ou agendamento pendente    |
| **Snapshot de Governança** | Status geral das sessões (abertas, fechadas, canceladas) |

> **Dica:** Clique em qualquer cartão de pendência para navegar diretamente à lista filtrada em _Analytics_.

---

## Gestão de Turmas

**Rota:** `/app/turmas`

Área central de operação das sessões. Possui duas abas principais: **Sessões** e **Reagendamentos**.

### 3.1 Aba Sessões

Exibe a lista de sessões dentro de um intervalo de **2 anos no passado até 1 ano no futuro** a partir da data atual.

**Filtros disponíveis:**

| Filtro           | Valores                              |
| ---------------- | ------------------------------------ |
| Status           | Todos · Aberta · Fechada · Cancelada |
| Modo de exibição | Tabela · Cartões                     |

Cada linha/cartão mostra: data, horário, local, vagas disponíveis, inscritos, status.

**Ações por sessão** (conforme permissões do perfil):

| Ação          | Descrição                                                       |
| ------------- | --------------------------------------------------------------- |
| **Abrir Hub** | Abre o painel detalhado da sessão (ver §3.3)                    |
| **Editar**    | Altera dados da sessão (somente se não encerrada)               |
| **Duplicar**  | Cria nova sessão com os mesmos dados (data ajustável)           |
| **Cancelar**  | Cancela a sessão; notifica inscritos automaticamente            |
| **Excluir**   | Remoção permanente (somente admin; sessão deve estar cancelada) |

---

### 3.2 Criar / Editar / Duplicar Sessão

Formulário acessado pelos botões **Nova Sessão** ou pelas ações da linha.

**Campos do formulário:**

| Campo              | Obrigatório | Observações                                     |
| ------------------ | ----------- | ----------------------------------------------- |
| Data               | ✅          | Seletor de data; range: -2 anos a +1 ano        |
| Horário de início  | ✅          | Formato HH:MM                                   |
| Horário de término | ✅          | Deve ser maior que início                       |
| Local              | ✅          | Selecionado da lista de locais cadastrados      |
| Capacidade máxima  | ✅          | Número inteiro positivo                         |
| Quórum mínimo      | ✅          | Mínimo de inscritos para a sessão ser realizada |
| Observações        | ❌          | Texto livre interno                             |

> **Atenção:** A validação de quórum e capacidade é aplicada pelo banco de dados via RPC — o sistema impedirá inscrições acima da capacidade e alertará quando o quórum não for atingido.

Ao salvar no modo **duplicar**, a sessão original permanece intacta.

---

### 3.3 Hub da Sessão

Painel modal detalhado aberto pelo botão **Abrir Hub** de qualquer sessão.

**Tabs disponíveis no Hub:**

| Tab                  | Conteúdo                                                                                     |
| -------------------- | -------------------------------------------------------------------------------------------- |
| **Inscritos**        | Lista de militares agendados; permite marcar presença/ausência e lançar resultado individual |
| **Lista de Chamada** | Exportação PDF da lista de presença                                                          |
| **Configuração**     | Edição rápida de dados da sessão                                                             |

**Lançamento de resultados (tab Inscritos):**

1. Localize o militar na lista.
2. Clique no ícone de lápis na coluna **Resultado**.
3. Informe: `Apto` / `Inapto` / `Dispensado` e a pontuação (quando aplicável).
4. Confirme — o dado é persistido via RPC no banco.

> **Regra de negócio:** A sessão deve estar com status **Aberta** para lançar presença ou resultado. Sessões fechadas ou canceladas são somente leitura.

---

### 3.4 Aba Reagendamentos

Lista todas as solicitações de reagendamento pendentes enviadas pelos usuários.

**Ações disponíveis:**

| Ação             | Efeito                                               |
| ---------------- | ---------------------------------------------------- |
| **Aprovar**      | Move o militar para a nova sessão escolhida          |
| **Rejeitar**     | Mantém a inscrição original; notifica o usuário      |
| **Ver detalhes** | Abre dialog com justificativa e histórico do militar |

Clique em qualquer linha para abrir o dialog de detalhes.

---

## Gestão de Efetivo

**Rota:** `/app/efetivo`

Gerenciamento do cadastro de militares.

**Funcionalidades:**

| Ação                    | Descrição                                                           |
| ----------------------- | ------------------------------------------------------------------- |
| **Busca**               | Por nome, nome de guerra, posto/graduação, SARAM ou seção           |
| **Editar perfil**       | Atualiza dados cadastrais do militar (posto, seção, telefone, etc.) |
| **Atualizar avaliação** | Lança ou corrige resultado de avaliação vinculado a uma sessão      |
| **Exportar**            | Gera CSV/PDF do efetivo filtrado                                    |

**Campos editáveis do perfil:**

- Nome completo · Nome de guerra · Posto/Graduação
- SARAM · Seção · Telefone
- Data de nascimento · Grupo físico
- INSPSAU válida até · Data da última inspeção

> **Nota:** Alterações de perfil feitas aqui ficam registradas no log de auditoria.

---

## Analytics

**Rota:** `/app/analytics`

Dashboard analítico com quatro abas e filtros avançados.

### Abas

| Aba             | Conteúdo                                             |
| --------------- | ---------------------------------------------------- |
| **Visão Geral** | Totais, gráficos de aprovação/reprovação por período |
| **Pendências**  | Militares com INSPSAU vencida, por prioridade        |
| **Por Unidade** | Percentual de aptos/inaptos agrupado por seção       |
| **Exportar**    | Geração de relatórios                                |

### Filtros

| Filtro              | Opções                                              |
| ------------------- | --------------------------------------------------- |
| **Período**         | Mês · Trimestre · Ano · Personalizado (date picker) |
| **Unidade/Seção**   | Seletor múltiplo                                    |
| **Posto/Graduação** | Seletor múltiplo                                    |
| **Status**          | Expirado · Pendente · Agendado                      |

### Prioridade de Pendências

| Prioridade   | Critério                           |
| ------------ | ---------------------------------- |
| 🔴 **ALTA**  | INSPSAU vencida há mais de 90 dias |
| 🟡 **MÉDIA** | INSPSAU vence em até 30 dias       |
| 🟢 **BAIXA** | INSPSAU vence em 31–90 dias        |

### Ações de Exportação

| Ação                                  | Formato                                                         |
| ------------------------------------- | --------------------------------------------------------------- |
| **Baixar CSV**                        | Dados tabulares filtrados                                       |
| **Gerar Relatório PDF**               | Relatório analítico completo                                    |
| **Enviar Notificação de Revalidação** | Envia notificação push/email para militares pendentes filtrados |

---

## Configurações do Sistema

**Rota:** `/app/configuracoes`

Área de configuração global, exclusiva para `admin` (coordenadores não têm acesso por padrão).

### 6.1 Geral

Configurações básicas da organização:

- Nome da organização
- Parâmetros globais de agendamento
- Configurações de notificação

### 6.2 Avaliação

Gerenciamento dos **índices de avaliação** (tabelas de pontuação por grupo físico):

| Campo                  | Descrição                                                    |
| ---------------------- | ------------------------------------------------------------ |
| **Categoria**          | Agrupamento do índice (ex.: corrida, flexão)                 |
| **Faixa de pontuação** | Linhas da tabela com mínimo e máximo por faixa etária/gênero |

**Ações disponíveis:** Criar · Editar · Excluir linhas individuais.

> As tabelas de avaliação são usadas pelo sistema para classificar automaticamente o resultado (Apto/Inapto) ao lançar pontuações.

### 6.3 Locais

Cadastro de locais onde as sessões são realizadas:

| Campo                | Obrigatório          |
| -------------------- | -------------------- |
| Nome do local        | ✅                   |
| Endereço / Descrição | ❌                   |
| Status               | ✅ (Ativo / Inativo) |

Somente locais **Ativos** aparecem na lista de seleção do formulário de sessão.

### 6.4 Perfis de Acesso

Gerenciamento das permissões por perfil de coordenador.

**Módulos de acesso disponíveis:**

| Módulo            | Rota                 |
| ----------------- | -------------------- |
| Dashboard Admin   | `/app/admin`         |
| Gestão de Turmas  | `/app/turmas`        |
| Gestão de Efetivo | `/app/efetivo`       |
| Analytics         | `/app/analytics`     |
| Configurações     | `/app/configuracoes` |
| Auditoria         | `/app/auditoria`     |

**Permissões de sessão (exclusivas para coordenadores):**

| Permissão           | Descrição                 |
| ------------------- | ------------------------- |
| `create_session`    | Criar nova sessão         |
| `duplicate_session` | Duplicar sessão existente |
| `cancel_session`    | Cancelar sessão           |

> **Padrão para coordenadores:** `/app/admin` e `/app/turmas` são liberados por padrão. Permissões de sessão devem ser habilitadas explicitamente.

**Como configurar um coordenador:**

1. Acesse **Perfis de Acesso**.
2. Localize o coordenador na lista.
3. Marque os módulos desejados.
4. Marque as permissões de sessão necessárias.
5. Clique em **Salvar**.

> **Atenção:** Um coordenador sem nenhum módulo permitido é redirecionado para `/app` (acesso negado) ao fazer login.

### 6.5 Auditoria (aba Configurações)

Visualização resumida dos eventos recentes do sistema dentro da tela de configurações. Para o log completo, acesse `/app/auditoria`.

---

## Log de Auditoria

**Rota:** `/app/auditoria`

Registro imutável de todas as ações relevantes realizadas no sistema.

**Informações registradas por evento:**

| Campo     | Descrição                                              |
| --------- | ------------------------------------------------------ |
| Data/Hora | Timestamp UTC da ação                                  |
| Usuário   | Nome e perfil de quem executou                         |
| Ação      | Tipo de operação (create, update, delete, login, etc.) |
| Entidade  | Tabela/objeto afetado                                  |
| Detalhes  | JSON com antes/depois da alteração                     |

**Filtros disponíveis:**

- Período (date range)
- Usuário específico
- Tipo de ação
- Entidade

> O log de auditoria é somente leitura. Nenhuma entrada pode ser editada ou excluída.

---

## Diferenças entre Admin e Coordenador

| Capacidade                     | Admin | Coordenador                             |
| ------------------------------ | ----- | --------------------------------------- |
| Todas as rotas                 | ✅    | ❌ (somente as permitidas)              |
| Configurações do sistema       | ✅    | ❌                                      |
| Gerenciar perfis de acesso     | ✅    | ❌                                      |
| Excluir sessão permanentemente | ✅    | ❌                                      |
| Criar sessão                   | ✅    | Depende de permissão                    |
| Duplicar sessão                | ✅    | Depende de permissão                    |
| Cancelar sessão                | ✅    | Depende de permissão                    |
| Log de auditoria               | ✅    | ❌ (a menos que o módulo seja liberado) |
| Lançar resultados              | ✅    | ✅ (quando tem acesso a `/app/turmas`)  |
| Aprovar reagendamentos         | ✅    | ✅ (quando tem acesso a `/app/turmas`)  |

---

_Última atualização: gerada automaticamente via documentação do repositório._

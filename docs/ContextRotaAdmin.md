Com base na análise técnica dos arquivos de código e das interfaces do perfil **Administrador**, aqui estão as rotas de navegação detalhadas, incluindo a estrutura da Barra Lateral de Navegação (Menu Persistente):

### **1. Barra Lateral de Navegação (Menu Persistente - Admin)**

A barra lateral é o eixo fixo de navegação para o administrador, permitindo o acesso imediato aos módulos principais do sistema:

* **Visão Geral (Dashboard):** Ponto de entrada com indicadores rápidos e resumo de turmas.
* **Gerenciar Turmas:** Listagem e controle operacional de sessões de teste.
* **Efetivo / Militares:** Banco de dados para busca e gestão da prontidão do pessoal.
* **Relatórios:** Analytics avançado e exportação de dados consolidados.
* **Avaliações:** Módulo para acompanhamento de exames específicos.
* **Configurações:** Acesso aos parâmetros globais e segurança do sistema.
* **Perfil do Usuário (Rodapé da Sidebar):** Identificação do administrador (ex: Maj. Silva Santos) e status do sistema.

---

### **2. Rotas de Navegação e Hierarquia de Telas**

#### **A. Núcleo Operacional (Gestão de Testes)**

* **Dashboard Administrativo (Home):** Visualização de métricas (Inscritos, Aptos, Pendências).
* **→ Gerenciamento de Turmas:** Tabela com status "Aberta" ou "Fechada".
* **→ Criar Nova Turma:** Fluxo para configurar local (HACO, HAAF, etc.), data e limite de vagas.
* **→ Lançamento de Índices:** Tela para inserir resultados de Corrida, Flexão e Abdominal por militar.
* **→ Resultado Parcial:** Cálculo automático de nota e conceito (Excelente, Muito Bom, etc.).







#### **B. Gestão de Pessoal e Solicitações**

* **Gestão de Efetivo:** Busca por SARAM ou Nome para monitorar aptidão.
* **→ Exportar Relatório:** Geração de documentos do efetivo.
* **→ Gestão de Reagendamento:** Análise de pedidos de troca de data (Deferir/Indeferir).
* **→ Justificativa Selecionada:** Visualização de documentos anexos pelo militar.


* **→ Solicitação de Revisão:** Interface para processar recursos de resultados contestados.



#### **C. Inteligência e Analytics**

* **Relatórios Consolidados:** Visão macro do desempenho físico da FAB.
* **→ Desempenho por Unidade:** Comparação entre OMs (ex: HACO vs BAGL).
* **→ Evolução de Aptidão:** Gráfico de tendência histórica.
* **→ Revalidação Pendente:** Lista de militares com testes a expirar.



#### **D. Governança e Configurações Globais**

* **Configurações do Sistema:** Menu interno de subdivisões administrativas:
* **→ Tabelas de Avaliação:** Parametrização de índices por idade e sexo.
* **→ Locais / OM:** Cadastro e gestão de infraestrutura física das unidades.
* **→ Gerenciar Horários:** Controle de turnos por localidade.


* **→ Perfis de Acesso:** Definição de permissões (Visualizar, Criar, Editar, Excluir) por módulo.
* **→ Logs de Auditoria:** Rastreabilidade técnica de todas as ações no sistema.
* **→ Detalhes JSON:** Visualização técnica de alterações em registros.

---


**TACF-Digital (FAB)**, a árvore de hierarquia e as rotas de navegação a partir do Dashboard Administrativo estruturadas da seguinte forma:

### **1. Visão Geral (Dashboard Administrativo)**

Esta é a página inicial (Home) que centraliza métricas de controle e acesso rápido.

* **Métricas de Topo:** Total de Inscritos, Aptos (Mês), Pendências e Capacidade Restante.

* **Sessão Ativa:** Relógio de monitoramento de tempo de sessão.

* * *

### **2. Gerenciar Turmas**

Módulo destinado à operacionalização das sessões de avaliação física.

* **Listagem de Turmas:** Visualização de turmas registradas (ex: FAB-2024-042) com status "Aberta" ou "Fechada".

* **Criar Nova Turma:** Rota de formulário para configurar nome, local, data, horário, limite de vagas e requisitos específicos.

* **Lançamento de Índices:** Acessado ao gerenciar uma turma específica. Permite a entrada de dados (Corrida, Flexão, Abdominal) para cada militar do efetivo.

* **Ações de Edição:** Alteração de dados de turmas já existentes.

* * *

### **3. Efetivo (Gestão de Efetivo)**

Central de gerenciamento do pessoal militar e seu status de prontidão.

* **Listagem de Militares:** Busca por SARAM ou Nome com exibição do status (Apto, Vencido, Inapto).

* **Filtros de Pesquisa:** Seleção por Posto/Graduação e Status de Aptidão.

* **Visualização Individual:** Acesso ao histórico de testes do militar.
  
  * **Solicitação de Revisão de Resultado:** Rota para o militar protocolar recursos contra resultados de testes (ex: contestação de índice de corrida).

* **Exportar Relatório:** Geração de documentos consolidados do efetivo.

* * *

### **4. Relatórios (Relatórios Consolidados)**

Interface de inteligência de dados e análise de desempenho.

* **Indicadores de Performance:** Índice de Aptidão Geral, Total de Avaliações e Média de Notas (TAF).

* **Análise Geográfica/Unidade:** Comparativo de desempenho entre diferentes unidades (ex: HACO, HAAF, BAGL).

* **Evolução de Aptidão:** Gráficos de tendência temporal.

* **Revalidação Pendente:** Lista de militares com prazos de validade próximos ao vencimento.

* * *

### **5. Configurações (Configurações do Sistema)**

Módulo administrativo para parametrização técnica e governança.

* **Tabelas de Avaliação:** Definição de índices mínimos de desempenho por faixa etária e sexo.

* **Locais / OM (Gestão de Locais e OMs):** Cadastro e edição de Organizações Militares, incluindo infraestrutura (pista, piscina, ginásio) e capacidade simultânea.

* **Perfis de Acesso (Gestão de Perfis):** Atribuição de permissões (Visualizar, Criar, Editar, Excluir) para perfis como Administrador Central, Oficial de Treinamento e Junta de Saúde.

* **Logs de Auditoria:** Rastreabilidade de todas as ações no sistema (Logins, alterações de notas, novos agendamentos) com dados de IP e detalhes técnicos (JSON).

* * *

### **6. Fluxos de Exceção e Solicitações**

Rotas transversais que podem ser acessadas via notificações ou módulos específicos:

* **Gestão de Reagendamento:** Área para administradores analisarem pedidos de nova data para testes (Deferir/Indeferir).

* **Status da Solicitação:** Notificação final ao militar sobre o deferimento ou indeferimento de seus pedidos.

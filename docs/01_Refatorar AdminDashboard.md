Observações & próximos passos
Dados “locais”: alguns campos do layout original (por exemplo, nome da turma, local real) não existem no esquema; deixei placeholders e comentei a lógica para facilitar extensão futura.
Métricas: a lógica de cálculo dos KPIs é simples e pode ser refinada em RPCs mais tarde, mas já dá números reais.
Roteamento: o dashboard admin ainda não está referenciado em nenhum link do app – poderá ser ligado ao perfil/admin ou usado em rota protegida em uma próxima tarefa.
Sem testes: conforme pedido, não adicionei arquivos de teste; quando for o momento, um hook useAdminDashboard e mocks de supabase facilitarão a cobertura.
🔧 Pronto para revisão: a implementação está funcional, alinhada ao design e integrada com o backend. Você pode abrir a página manualmente (ex.: copiar código para OperationalDashboard ou navegar até /app/admin com rota definida) para inspecionar. Se quiser avançar com rotas ou migrar lógicas para RPCs, estou à disposição.


---

Plan: Refatorar AdminDashboard com dados reais (DRAFT)
A refatoração ficará restrita à AdminDashboard.tsx, mantendo rotas e DashboardContainer.tsx como estão por enquanto. O layout seguirá alta fidelidade ao HTML de referência em code.html, mas usando tokens e padrões já existentes (Layout/Sidebar/Tailwind do projeto), sem hardcode de tema novo. Para preservar conexão com banco, o plano reaproveita useSessions.ts, supabase.ts e consultas Supabase tipadas; sem criar RPC/migration nesta etapa. As ações da tabela serão conectadas às rotas existentes definidas em main.tsx.

Steps

Mapear estrutura visual alvo (header, cards de KPIs, tabela de turmas, ação principal) e traduzir para a composição atual com Layout.tsx e Sidebar.tsx, evitando criar componentes novos antes de reaproveitar padrões de Scheduling.tsx e OperationalDashboard.tsx.
Implementar em AdminDashboard.tsx um fluxo de dados administrativo com hooks/queries existentes: usar disponibilidade por sessão via RPC já exposta por useSessions.ts e completar KPIs com consultas agregadas em bookings/profiles via supabase.ts, mantendo tipagem de database.types.ts.
Construir os cards com métricas derivadas de dados reais (ex.: total inscritos, vagas ocupadas/disponíveis, sessões abertas/lotadas) e tabela de turmas baseada em sessões + ocupação, respeitando tokens de tailwind.config.ts e index.css.
Ligar ações de navegação da tela admin para rotas existentes em main.tsx: gerenciamento/agenda para fluxo de agendamentos, resultados para histórico e perfil para gestão de dados de usuário.
Garantir estados de carregamento/sem dados/erro seguindo padrão já adotado (ex.: skeletons e mensagens simples em páginas atuais), sem incluir testes nesta rodada conforme solicitado.
Verification

Rodar yarn lint.
Rodar npx tsc --noEmit.
Validar manualmente o render de AdminDashboard.tsx em cenário com e sem dados (cards, tabela, links de ação).
Confirmar que nenhuma alteração em rpc ou migrations foi necessária.
Decisions

Escopo fechado em AdminDashboard.tsx.
Reuso de hooks/queries existentes em vez de nova RPC.
Alta fidelidade visual ao stitch, adaptada ao design system atual.
Ações conectadas às rotas já existentes do app.
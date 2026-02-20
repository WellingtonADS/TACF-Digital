
Implementação concluída

Criei a nova página PersonnelManagement.tsx com alta fidelidade ao layout de efetivo (header, filtros, tabela, painel analítico e card mensal).
Mantive conexão real com o banco via Supabase: leitura de profiles + bookings, com status derivado (APTO/INAPTO/VENCIDO) usando active e último teste.
Adicionei busca por nome/SARAM, filtros por posto e status, e exportação CSV do resultado filtrado.
Integrei a rota nova /app/efetivo em main.tsx.
Atualizei navegação lateral com item “Efetivo” e prefetch da página em Sidebar.tsx.

---

Plan: PersonnelManagement com dados reais (DRAFT)
A implementação deve criar uma nova página administrativa em src/pages/PersonnelManagement.tsx, com rota main.tsx em /app/efetivo, mantendo integração existente com Supabase sem mexer em migrations/RLS. O layout seguirá alta fidelidade ao stitch code.html, reaproveitando componentes/padrões já usados em UserProfilesManagement.tsx, AdminDashboard.tsx, Layout.tsx e Sidebar.tsx.
Para status por militar, será usada a regra alinhada: base em active + último teste de bookings (test_date e score) como aproximação, sem inventar regra de domínio no cliente além da apresentação.

Steps

Mapear e extrair do layout alvo os blocos necessários (header, barra de busca/filtros, tabela de militares, sidebar analítica) e adaptar para os tokens já existentes em tailwind.config.ts e index.css, sem introduzir tema novo.
Criar src/pages/PersonnelManagement.tsx reutilizando a estrutura de composição de UserProfilesManagement.tsx: Layout, estado local, carregamento/erro e consultas Supabase tipadas.
Implementar consulta de efetivo em profiles (campos já usados no projeto: id, saram, full_name, rank, sector, active, created_at) e enriquecer com último teste via bookings (maior test_date por user_id, com score), mantendo tudo no frontend sem nova RPC.
Montar a tabela com busca por SARAM/nome e filtros de posto/status, preservando ações do layout (visualizar/editar) com navegação para rotas existentes quando aplicável (ex.: perfil individual) e fallback seguro onde não houver tela dedicada.
Construir painel analítico lateral com agregações locais derivadas dos dados carregados (Apto/Inapto/Vencido + total do mês), sem criar dependência externa nem gráficos de biblioteca nova.
Integrar rota lazy em main.tsx (React.lazy + Suspense) para /app/efetivo e opcionalmente incluir atalho no menu em Sidebar.tsx, mantendo convenção atual de navegação.
Revisar consistência visual e estados vazios/carregando seguindo os padrões de AdminDashboard.tsx e OperationalDashboard.tsx.
Verification

Executar yarn lint.
Executar npx tsc --noEmit.
Validar manualmente /app/efetivo: carregamento, busca, filtros, status derivado, contadores e ações da tabela.
Confirmar que nenhuma alteração foi feita em migrations e policies.
Decisions

Nova rota definida: /app/efetivo.
Alta fidelidade visual ao stitch, com design tokens existentes.
Status por militar derivado de active + último teste (test_date/score) como aproximação de apresentação.
Sem testes nesta etapa, conforme solicitado.

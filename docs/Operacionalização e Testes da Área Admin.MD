Plan: Operacionalização e Testes da Área Admin
O que precisa ser feito: O código das páginas admin já usa Supabase real, mas o conjunto tem 5 problemas estruturais que impedem a operação: (1) AdminDashboard nunca foi roteado, (2) não há role-guard — qualquer usuário autenticado acessa telas de admin, (3) a sidebar não filtra por perfil, (4) o fluxo Turmas → ScoreEntry está desconectado, e (5) nenhuma página admin tem teste unitário. O campo profiles.role (user | admin | coordinator) já existe no banco e nos tipos — só precisa ser usado.

Fase 1 — Roteamento com role-guard

Criar componente AdminRoute em src/components/AdminRoute.tsx — usa useAuth().profile.role, redireciona para /app se não for admin ou coordinator; exibe PageSkeleton enquanto loading === true
Adicionar rota /app/admin em main.tsx usando React.lazy(() => import("./pages/AdminDashboard")) dentro de <AdminRoute>
Adicionar rota /app/turmas em main.tsx — também lazy, também dentro de <AdminRoute>, apontando para AdminDashboard (já tem a tabela de sessões integrada via useSessions)
Atualizar AutoRedirect em AutoRedirect.tsx — após verificar sessão, checar profile.role; admin/coordinator → /app/admin, user → /app
Marcar todas as rotas admin já existentes (/app/efetivo, /app/reagendamentos, /app/lancamento-indices, /app/analytics, /app/configuracoes, /app/auditoria, /app/om-locations, /app/turmas/nova) com <AdminRoute> em main.tsx
Fase 2 — Sidebar por role

Em Sidebar.tsx — importar useAuth, separar os itens de navegação em dois arrays: userNav (Dashboard, Agendamentos, Resultados, Perfil) e adminNav (todos os links admin); renderizar conforme profile.role
Fase 3 — Fluxo Turmas → ScoreEntry

Em AdminDashboard.tsx — verificar se o botão "Lançar Índices" de cada linha da tabela de sessões já navega para /app/lancamento-indices?session={id}; se não, adicionar navigate('/app/lancamento-indices', { state: { sessionId: session.id } })
Em ScoreEntry.tsx — confirmar que lê sessionId de useLocation().state ou useSearchParams() para pré-selecionar a turma automaticamente
Fase 4 — Correção de tipo em ReschedulingManagement

Em ReschedulingManagement.tsx linha 135 — remover as any no .update() de bookings; usar o tipo BookingStatus diretamente do schema para status: 'confirmed' | 'pending_swap' | 'cancelled'
Fase 5 — Testes unitários (Vitest)

Criar em tests/unit/admin/ usando o padrão já estabelecido em appointment-confirmation.test.tsx (mock de @/services/supabase, mock de useAuth, MemoryRouter):

admin-dashboard.test.tsx — verifica métricas carregadas, tabela de sessões renderizada, botão "Nova Turma" navega para /app/turmas/nova
personnel-management.test.tsx — lista de militares renderizada, filtros de rank/status funcionando, busca por SARAM
score-entry.test.tsx — seleção de sessão, preenchimento de índices, submit chama update_session_scores, exibe erro em falha
rescheduling-management.test.tsx — lista bookings com swap_reason, botão "Deferir" chama update com status correto, "Indeferir" idem
audit-log.test.tsx — verifica que get_audit_logs RPC é chamado, logs são listados, filtro de ação funciona
system-settings.test.tsx — carrega dados de configuração, link para /app/configuracoes/perfis navega corretamente
class-creation-form.test.tsx — submit com campos válidos chama sessions.insert, exibe erro em falha, navega de volta após sucesso
om-location-manager.test.tsx — lista OMs renderizada, botão de editar navega para /app/om/:id
analytics-dashboard.test.tsx — verifica chamadas Supabase para dados de analytics, gráfico renderiza com dados
access-profiles-management.test.tsx — lista de perfis de acesso renderizada
Verificação

Decisões

AdminRoute separado de ProtectedRoute: mantém responsabilidade única — ProtectedRoute só checa auth, AdminRoute checa role; evita prop drilling
AdminDashboard como /app/admin e /app/turmas apontam para o mesmo componente: ele já tem a tabela de sessões + métricas; evita criar página extra
Testes em tests/unit/admin/ (subpasta): organização por domínio, alinhado com a estrutura components/Admin existente
Nenhuma migration necessária: profiles.role já existe com os valores corretos

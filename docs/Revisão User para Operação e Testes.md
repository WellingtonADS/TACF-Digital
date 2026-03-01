Plan: Operacionalização da Rota User — TACF-Digital
TL;DR: O fluxo do perfil User está parcialmente implementado. Os 8 gaps mais críticos são: sidebar com itens errados, rotas sem ProtectedRoute, sample data vazando no DigitalTicket, 4º card ausente no Dashboard, ResultsHistory sem KPIs/badges, AppointmentConfirmation sem stepper/local dinâmico, UserProfilesManagement sem coluna lateral e duas páginas inexistentes (Documentos, Recurso). O plano segue ordem P0 → P1 → P2, com verificação yarn lint + npx tsc --noEmit + yarn test a cada etapa.

Inventário de Gaps (atual vs. especificado)
Tela / Módulo	Estado atual	Especificado no ContextRotaUser
Sidebar userNav	3 itens: Dashboard, Agendamentos, Reagendamentos	5 itens: Dashboard, Agendamentos, Documentos, Histórico, Meu Perfil
Rotas /app/ user	/app/resultados, /app/agendamentos, /app/ticket, /app/perfil sem ProtectedRoute individual	Todas exigem auth
DigitalTicket	Estado inicial usa objeto sample com dados falsos	Skeleton/null até carregar dados reais
OperationalDashboard	3 cards (Marcar TACF, Histórico, Certificados)	4 cards: + Documentação → /app/documentos
ResultsHistory	Sem KPIs, sem badges Apto/Inapto, coluna Resultado mostra valor bruto	3 KPI cards (Status, Média, Dias revalidação), badges, coluna conceito
AppointmentConfirmation	Sem stepper visual, local "GPAC" hardcoded	Etapa 2 ativa no stepper; local vindo do banco
UserProfilesManagement	Sem coluna lateral com avatar/status; INSPSAU mostra "--"	Coluna com avatar, posto, chip Apto, INSPSAU preenchida do banco
Página Documentos	Não existe (/app/documentos sem rota)	Documentos / Relatórios — manuais, ICA 54-2
Página Recurso	Não existe (/app/recurso sem rota)	Solicitação de Revisão de Resultado com motivo + justificativa
Reagendamento (user)	RescheduleDrawer já presente em Dashboard e ResultsHistory	Fluxo de solicitação → admin decide (Deferido/Indeferido) — já atendido pelo drawer
Steps

P0 — Segurança e bugs críticos

Proteger rotas user em main.tsx — agrupar /app/resultados, /app/agendamentos, /app/agendamentos/confirmacao, /app/ticket, /app/perfil dentro de um <Route element={<ProtectedRoute><Outlet/></ProtectedRoute>}> (o catch-all /app/* já tem ProtectedRoute, mas rotas específicas têm prioridade sobre ele no React Router v6)

Corrigir userNav em Sidebar.tsx linhas 21–35:

Remover item "Reagendamentos" / /app/reagendamentos (admin-only)
Adicionar: Histórico → /app/resultados (ícone ClipboardList), Documentos → /app/documentos (ícone FileText), Meu Perfil → /app/perfil (ícone User)
Resultado: 5 itens (Dashboard, Agendamentos, Documentos, Histórico, Meu Perfil)
Remover vazamento do sample em DigitalTicket.tsx — mudar estado inicial de { ...sample } para null; renderizar <PageSkeleton> antes de resolver os dados reais; mover o objeto sample apenas para a rota /preview/digital-ticket

P1 — Paridade visual e funcional

4º card no Dashboard em OperationalDashboard.tsx actionCards array (linha ~123) — adicionar { icon: FileText, label: "Documentação", title: "Manuais e Normas", to: "/app/documentos" }

ResultsHistory — KPIs + badges + colunas em ResultsHistory.tsx:

Adicionar 3 cards de resumo no topo (último status Apto/Inapto, média global, dias para revalidação) usando dados do hook useDashboard
Atualizar type Result adicionando location?: string, concept?: string, result_status?: "apto" | "inapto" | "pendente"
Adicionar colunas: Local de Avaliação, Conceito
Adicionar badges coloridos (verde=Apto, vermelho=Inapto, âmbar=Pendente)
Substituir ação "Reagendar" por "Visualizar Detalhes" (modal in-page com índices)
⚠️ Dependência backend: verificar se RPC get_results_history já retorna location, concept, result_status — se não, documentar como issue para coordenador e exibir campos condicionalmente
AppointmentConfirmation — stepper + local dinâmico em AppointmentConfirmation.tsx:

Adicionar componente stepper (3 etapas: Seleção → Revisão → Confirmado) com etapa 2 ativa
Substituir string hardcoded "Grupamento de Apoio de Canoas (GPAC)" por dado do join sessions → locations já carregado via Supabase
UserProfilesManagement — coluna lateral + INSPSAU em UserProfilesManagement.tsx:

Adicionar coluna lateral esquerda: iniciais do nome, posto, chip de status (Apto/Inapto baseado em inspsau_valid_until), idade calculada de birth_date, grupo físico
Conectar inspsau_valid_until e inspsau_last_inspection do perfil carregado à seção SAÚDE (atualmente mostra -- hardcoded)
Corrigir label "Setor" para "OM / Setor"
P2 — Páginas faltantes + Suíte de testes

Nova página src/pages/Documents.tsx + rota /app/documentos:

Conteúdo inicial: lista de manuais (ICA 54-2 com link externo, portarias relevantes), seção "Certificados" com link para /app/ticket
Adicionar React.lazy import e rota protegida em main.tsx
Nova página src/pages/AppealRequest.tsx + rota /app/recurso:

Baseado no protótipo code.html
Formulário: Motivo (select), Justificativa (textarea, máx 2000 chars), upload de comprovante
Nota ICA 54-2 no rodapé do formulário
Se RPC appeals não existir: toast.info("Funcionalidade em desenvolvimento") + issue para coordenador
Acessível via link "Solicitar Revisão" em ResultsHistory (linha de ação)
Suíte Vitest — criar em tests/unit/user/:

Arquivo	Cenários principais
operational-dashboard.test.tsx	4 cards, status chip, alerta INSPSAU, próximo evento
scheduling.test.tsx	sessões carregadas, seleção de dia/turno, navigate com state.sessionId
appointment-confirmation.test.tsx	(expandir existente) stepper visível, local dinâmico, RPC sucesso/erro
digital-ticket.test.tsx	sem bookingId → skeleton (não sample), com bookingId → dados reais
results-history.test.tsx	3 KPI cards, badges por status, drawer e visualizar detalhes
user-profiles-management.test.tsx	perfil carregado, INSPSAU preenchida, coluna lateral
sidebar-user.test.tsx	5 itens corretos, nenhum item admin, item ativo por rota
appeal-request.test.tsx	campos obrigatórios, submit mock
documents.test.tsx	lista renderizada, link ICA 54-2 presente
hooks/use-sessions.test.ts	RPC normal, vazia, erro
hooks/use-dashboard.test.ts	via RPC, fallback manual, sem auth
hooks/use-paginated-query.test.ts	paginação, cursor, hasMore: false
Verification

Após cada step P0/P1: yarn lint && npx tsc --noEmit
Após P2 (testes): yarn test --run

Checklist manual final:
Login → Dashboard (4 cards, status, alerta INSPSAU) → Agendamento (3 etapas, stepper) → Ticket (skeleton → dados reais, sem "1T SILVA") → Histórico (KPIs, badges, detalhes) → Perfil (coluna lateral, INSPSAU preenchida) → Documentos → Recurso → Sair

Decisions

Exportar PDF no Histórico: removido da prioridade P1 — o documento refinado ContextRotaUser.md não cita mais essa função; pode ser adicionado como P3 se o coordenador confirmar demanda
Reagendamento user: já coberto pelo RescheduleDrawer existente em Dashboard e ResultsHistory — não requer nova página; apenas confirmar que o drawer exibe notificações de Deferido/Indeferido
RPC get_results_history: se os campos location/concept/result_status não existirem na resposta atual, o Passo 5 deve criar issue separado para o coordenador (HACO) antes de implementar o RPC
Rota /app/perfil duplicada em main.tsx: remover a entrada duplicada ao aplicar o Passo 1

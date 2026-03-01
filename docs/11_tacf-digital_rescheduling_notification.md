Plan: Rescheduling Notification Page
TL;DR — Criar ReschedulingNotification.tsx como página administrativa que mostra notificações de reagendamento vindas de bookings.swap_reason, mantendo integrações existentes (Supabase via supabase.ts) e seguindo o visual do stitch (code.html). Reusar padrões de layout e chamadas já usados em ReschedulingManagement e PersonnelManagement.

Steps

Discovery: revisar os arquivos-chave para padronizar implementação:
UI / layout: code.html:1-20
Padrões de página: ReschedulingManagement.tsx:1-40, PersonnelManagement.tsx:1-20
Serviços: bookings.ts:1-40, supabase.ts:1-40
Tipos DB: database.types.ts:200-220
Rotas/Sidebar: main.tsx:1-40, Sidebar.tsx:1-40
Arquivo alvo: criar src/pages/ReschedulingNotification.tsx (client component).
Dados a buscar:
Buscar booking(s) com swap_reason != null ou status de notificação relevante.
Carregar profiles (nome, saram) e sessions (data) para exibir contexto.
Usar supabase via bookings.ts helpers (fetchSwapRequests/updateBookingStatus) se já disponível.
UI/Comportamento:
Header e estatísticas conforme stitch: título, avatar admin, badge de status.
Card/alert com mensagem da notificação (texto, data, origem) e ações rápidas (Ver detalhes, Ir para gestão, Marcar como lida).
Modal/popover com detalhes completos e link/possibilidade de download de anexo (se existir).
Estilos: preservar classes utilitárias do stitch (status-pendente, btn-deferir, etc.) e componentes atômicos (PageSkeleton, Layout).
Ações e mutações:
“Marcar como lida” / “Ir para agendamento” → atualizar bookings.status (ou campo apropriado) via supabase.
Usar toasts (sonner) para feedback.
Recarregar lista após ação (optimistic UI opcional).
Rotas e navegação:
Lazy-import e rota /app/reagendamentos/notificacao em main.tsx.
Adicionar prefetch na Sidebar.tsx se fizer sentido.
Acessibilidade e responsividade:
Garantir foco no modal, botões com labels e contraste conforme projeto.
Entrega incremental:
Fase 1: lista de notificações + modal de detalhe + mutação de status.
Fase 2 (quando houver backend): suportar anexos reais, mover para swap_requests se migrado.
Verification

Manual: iniciar app (yarn dev) e acessar /app/reagendamentos/notificacao; validar carregamento e ações com registros reais em bookings (campo swap_reason preenchido).
DB checks: executar uma query na console Supabase para criar um booking de teste com swap_reason e test_date.
Lint/TS: yarn lint e npx tsc --noEmit (corrigir avisos que surgirem).
Decisions

Fonte de dados inicial: usar bookings.swap_reason (evita criar nova tabela swap_requests sem migração).
Reuso: preferir reusar Layout, PageSkeleton, e helpers em bookings.ts para manter consistência.
Visual: aproximar classes e estrutura do stitch HTML sem alterar regras de domínio (validações e política RLS ficam no backend).

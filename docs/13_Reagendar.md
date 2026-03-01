TL;DR — Criar um componente RescheduleDrawer (cliente) que insere em swap_requests e faz upload opcional para um bucket Supabase; integrar ao card “Próximo Evento” em OperationalDashboard.tsx e à tabela de histórico em ResultsHistory.tsx. Mostrar estado “Reagendamento Pendente” consultando swap_requests (não exigir update em bookings para contornar RLS).

Passos (alto nível)

Criar componente Drawer: src/components/RescheduleDrawer.tsx

UI: data atual (read-only), DatePicker (input type=date ou componente estilizado), textarea para justificativa, input file para comprovante, botões Cancelar / Enviar.
Lógica: ao enviar, opcionalmente fazer upload do ficheiro para Supabase Storage (ex.: bucket swap-attachments), depois inserir um registro em swap_requests com { booking_id, requested_by, new_session_id, reason } onde reason pode ser JSON string com { text, attachment_url } para preservar anexo sem mudar schema. Usar supabase.from('swap_requests').insert(...). Fechar Drawer ao sucesso e mostrar toast.
Reuso: supabase client em supabase.ts e useAuth para obter auth.uid()/profile.
Encapsular chamada em serviço helper (opcional, recomendado)

Adicionar função em bookings.ts: createSwapRequest(payload) que faz upload (se necessário) e insere em swap_requests. (Pequena adição local — evita duplicar lógica.)
Integrar no Dashboard (card “Próximo Evento”)

Editar OperationalDashboard.tsx: quando nextSession existir, renderizar um botão secundário “Solicitar Reagendamento” abaixo dos detalhes que abre o RescheduleDrawer passando bookingId e informações da sessão.
Exibir estado “Reagendamento Pendente” no card consultando swap_requests (ex.: supabase.from('swap_requests').select('id').eq('booking_id', booking.id).eq('status','pending')) — dessa forma não é necessário atualizar bookings.status (que tem RLS de update somente para admin).
Integrar no Histórico (tabela de registros)

Editar ResultsHistory.tsx: adicionar coluna “Ações” (ou expandir) com botão/ícone “Reagendar” em linhas cujo status seja AGENDADO / confirmed / similar. O botão abre RescheduleDrawer para aquele bookingId. (Se a tabela atual não expõe bookings diretamente, adaptar: buscar bookings do usuário / juntar com results.)
Menu lateral (submenu)

Atualizar Sidebar.tsx para adicionar um subitem sob “Agendamentos” chamado “Gerenciar Agendamento” ou “Pedidos de Troca” que aponta para /app/agendamentos ou /app/meus-agendamentos. (Não criar página nova a menos que queira uma visão dedicada de pedidos.)
UI/UX e refinamento visual

Seguir o padrão de estilos do projeto (Tailwind) e o stepper visual do fluxo de “Novo Agendamento” quando fizer sentido — manter o Drawer como processo simples (1 passo) com validação básica. Aplicar classes e espaçamentos para ficarem muito parecidos com o design existente.
Arquivos a tocar (resumo)

Criar: src/components/RescheduleDrawer.tsx
Opcional/recomendado: adicionar helper em bookings.ts (função createSwapRequest)
Modificar: OperationalDashboard.tsx — adicionar botão + estado;
Modificar: ResultsHistory.tsx — adicionar coluna/ação;
Modificar: Sidebar.tsx — adicionar subitem;
Reusar: supabase.ts, useAuth.ts, componentes Layout e PageSkeleton.
Fluxo de dados / payload

Frontend envia (após upload opcional):
payload = {
booking_id: string,
requested_by: auth.uid(),
new_session_id: string, // se escolher data+turno mapeado para session_id, ou null para pedido aberto
reason: JSON.stringify({ text: string, attachment_url?: string }),
status: 'pending'
}
Chamada: await supabase.from('swap_requests').insert([payload]) (RLS permite INSERT por owner conforme rls.sql).
O Drawer fecha; o Dashboard faz refetch de swap_requests ou useDashboard é atualizado para refletir “Reagendamento Pendente”.
Armazenamento de ficheiros (decisão proposta)

Usar Supabase Storage (bucket swap-attachments). Após upload, obter URL público e incluir em reason (JSON).
Motivo: o schema atual de swap_requests não tem coluna específica para anexo; evitar migrations agora. Recomendar futura migration para attachment_url TEXT ou metadata JSONB.
Verificações / Permissões / RLS

INSERT em swap_requests está permitido para o próprio usuário (ver rls.sql).
UPDATE direto em bookings é admin-only — portanto NÃO vamos tentar alterar bookings.status do cliente; em vez disso, UI mostrará pendência consultando swap_requests.
Se quiser que a própria bookings.status seja alterada automaticamente, precisaríamos criar um RPC/trigger com SECURITY DEFINER (mudar DB — exigir revisão). Recomendo evitar por ora.
Critérios de aceitação / verificação manual

Usuário com booking abre Drawer a partir do Dashboard → preenche justificativa + opcional anexo → envia. Drawer fecha; um toast de sucesso aparece.
Dashboard agora exibe “Reagendamento Pendente” (ou badge) para o booking afetado (baseado em consulta a swap_requests).
Histórico de avaliações mostra botão “Reagendar” em linhas agendadas; abre Drawer e permite novo pedido.
O upload de ficheiro salva no bucket e o URL aparece dentro do swap_requests.reason (JSON).
Nenhuma migração no banco é necessária para este MVP.
Bloqueadores / decisões a confirmar (são poucas)

Onde guardar anexos permanentemente? (proposta: bucket swap-attachments no Supabase). Confirma?
Deseja que o cliente tente também — via RPC/trigger — alterar bookings.status para pending_swap automaticamente (requer migração/RPC e aprovação)? Recomendo adiar e usar swap_requests como fonte de verdade do estado pendente.
Rota de sidebar: prefere um subitem apontando para /app/agendamentos (reuso) ou criar /app/agendamentos/gerenciar (nova rota/página)? Recomendo reuso /app/agendamentos para começar.
Estimativa de implementação (se aprovar): 3–5 commits pequenos:

Commit A: criar RescheduleDrawer + helper em services.
Commit B: integrar Drawer no OperationalDashboard.
Commit C: integrar ação em ResultsHistory.
Commit D: adicionar sidebar subitem + pequenos estilos/refinamentos.
Testes manuais descritos no checklist acima.
Quer que eu comece a implementação agora? S

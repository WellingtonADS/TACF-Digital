Plan: Operacionalizar confirmação de agendamento
O fluxo aprovado é: seleção de sessão → revisão/confirmação → ticket digital. A descoberta mostrou que hoje a criação do booking acontece cedo demais em Scheduling.tsx:60-71 via book_session, enquanto AppointmentConfirmation.tsx:83-86 apenas faz toast/redireciona, sem efetivar a conformação. O plano abaixo migra a confirmação real para a etapa correta, mantém compatibilidade de entrada com sessionId + bookingId, e fecha o ciclo com ticket após sucesso. Também trata a inconsistência de tipagem já visível em AppointmentConfirmation.tsx:57-65.

Steps

Ajustar o passo 1 para “pré-confirmação”: em Scheduling.tsx:60-71, trocar book(selectedSession) por navegação para confirmação com state contendo sessionId (e metadados mínimos de exibição), mantendo loading/erros de UX da tela.
Reestruturar entrada da confirmação em AppointmentConfirmation.tsx:12-16 para aceitar sessionId + bookingId (compat legado), priorizando sessionId no fluxo novo.
Separar na confirmação dois modos de carregamento:
Novo fluxo (sessionId): buscar sessão + perfil para revisão; ainda sem booking criado.
Legado (bookingId): manter leitura de booking/sessão/perfil para não quebrar links antigos.
Implementar ação de “Confirmar Agendamento” real em AppointmentConfirmation.tsx:83-86 usando confirmarAgendamentoRPC de supabase.ts:25-53 com userId autenticado + sessionId; tratar estados de sucesso/erro e desabilitar botão durante submissão.
No sucesso, redirecionar para /app/ticket (decisão validada) com payload mínimo para renderização do comprovante (ex.: bookingId, orderNumber, dados de sessão/perfil).
Adaptar DigitalTicket.tsx:1-244 para consumir dados reais vindos da confirmação (com fallback seguro para preview), incluindo código/QR do agendamento confirmado.
Corrigir a tipagem de consultas em AppointmentConfirmation.tsx:19-65 para eliminar os erros de never e alinhar com Database["public"]["Tables"].
Criar testes unitários focados no fluxo novo e compat legado (novo arquivo em unit): confirmação com sessionId sucesso/erro, fallback com bookingId, e redirecionamento para /app/ticket.
Verification

Rodar yarn lint.
Rodar npx tsc --noEmit.
Rodar yarn test (com foco nos novos testes de confirmação/ticket).
Validar manualmente:
fluxo novo completo /app/agendamentos → /app/agendamentos/confirmacao → /app/ticket;
entrada legado por bookingId ainda exibe revisão sem quebra.
Decisions

Confirmação definitiva ocorre na etapa 2 (Appointment Confirmation), não na seleção.
Entrada da confirmação suporta sessionId + bookingId para compatibilidade.
Após sucesso, redirecionamento obrigatório para /app/ticket.
# Deprecation Log

## Política

1. Toda rota legada deve manter redirect por 2 releases antes de remoção definitiva.
2. Toda descontinuação deve registrar data, motivo e rota substituta.
3. Artefatos movidos para src/archived devem referenciar issue/PR.

## Registros

| Data       | Artefato                             | Tipo        | Motivo                                                   | Substituição                        | Remoção definitiva prevista |
| ---------- | ------------------------------------ | ----------- | -------------------------------------------------------- | ----------------------------------- | --------------------------- |
| 2026-04-01 | /app/sessoes                         | rota legada | unificação da navegação de sessões na árvore /app/turmas | /app/turmas                         | após 2 releases             |
| 2026-04-01 | /app/sessoes/nova                    | rota legada | padronização do fluxo de criação de turma                | /app/turmas/nova                    | após 2 releases             |
| 2026-04-01 | /app/sessoes/:sessionId/agendamentos | rota legada | consolidação da gestão operacional em rota canônica      | /app/turmas/:sessionId/agendamentos | após 2 releases             |
| 2026-04-01 | /app/sessoes/:sessionId/editar       | rota legada | consolidação da edição de turma em rota canônica         | /app/turmas/:sessionId/editar       | após 2 releases             |
| 2026-04-12 | src/components/RescheduleDrawer.tsx  | componente  | substituído pelo shell canônico de dialog                | src/components/Booking/RescheduleDialog.tsx | n/d                  |
| 2026-04-12 | src/components/TicketModal.tsx       | componente  | substituído pelo shell canônico de dialog                | src/components/Booking/TicketDialog.tsx     | n/d                  |
| 2026-04-12 | src/components/TicketsListModal.tsx  | componente  | substituído pelo shell canônico de dialog                | src/components/Booking/TicketsListDialog.tsx| n/d                  |
| 2026-04-12 | src/components/atomic/SidebarItem.tsx| componente  | código morto sem imports ativos                          | n/a                                 | n/d                         |
| 2026-04-12 | src/components/atomic/QuickActionCard.tsx | componente | código morto sem imports ativos                     | n/a                                 | n/d                         |
| 2026-04-12 | src/hooks/useBooking.ts              | hook        | código morto sem imports ativos                          | src/archived/hooks/useBooking.ts    | n/d                         |
| 2026-04-12 | src/components/atomic/NotificationCard.tsx | componente | código morto sem imports ativos                    | src/archived/components/atomic/NotificationCard.tsx | n/d          |
| 2026-04-12 | src/components/atomic/Icon.tsx       | componente  | código morto sem imports ativos                          | src/archived/components/atomic/Icon.tsx | n/d                    |

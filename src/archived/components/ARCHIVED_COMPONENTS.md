# Arquivados: Componentes

Este arquivo documenta componentes movidos para `src/archived/components/`
porque deixaram de ser usados ou foram substituídos por implementações
canônicas.

Arquivados:

- `src/archived/components/RescheduleDrawer.tsx` — substituído por
  `src/components/Booking/RescheduleDialog.tsx`.
- `src/archived/components/TicketModal.tsx` — substituído por
  `src/components/Booking/TicketDialog.tsx`.
- `src/archived/components/TicketsListModal.tsx` — substituído por
  `src/components/Booking/TicketsListDialog.tsx`.
- `src/archived/components/atomic/SidebarItem.tsx` — sem imports ativos.
- `src/archived/components/atomic/QuickActionCard.tsx` — sem imports ativos.

Próximos passos:

- Se algum artefato arquivado voltar a ser necessário, mova-o de volta para a
  árvore ativa correspondente e ajuste os imports consumidores.
- Se permanecer sem uso após o período de retenção definido pelo time,
  considerar remoção permanente.

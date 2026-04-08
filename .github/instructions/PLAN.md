# Plano de Correção do Fluxo de Agendamento TACF

## Resumo
Objetivo: estabilizar o fluxo crítico de TACF para o militar e alinhar a operação admin/coordenador com o estado real do domínio. O foco é eliminar os conflitos entre `agendamento`, `reagendamento`, `presença`, `resultado` e `status` que hoje fazem cliente, dashboard e telas administrativas interpretarem o mesmo booking de formas diferentes.

Diretriz escolhida:
- Escopo: fluxo crítico primeiro
- Banco: incluir mudanças em RPCs/migrations, sempre marcadas como dependentes de revisão humana do HACO antes da execução

## Mudanças Principais

### 1. Consolidar a máquina de estados do booking
- Definir explicitamente a semântica operacional de:
  - `agendado`: booking ativo na sessão vigente
  - `remarcado`: booking original substituído e não mais elegível para uso operacional direto
  - `cancelado`: booking inativo
  - `attendance_confirmed`: presença operacional, separada de status de booking
  - `swap_requests.status`: estado da solicitação, não do booking
- Criar um helper compartilhado no frontend para exibição de status, evitando regras divergentes entre dashboard, turma, ticket e histórico.
- Corrigir a tela de agendamentos da turma para exibir `booking.status` real e tratar presença como coluna separada, sem converter tudo para “cancelado” quando `attendance_confirmed = false`.

### 2. Corrigir o fluxo de aprovação de reagendamento no banco
- Substituir a aprovação atual baseada em updates diretos por uma RPC transacional única de aprovação de swap.
- A nova RPC deve:
  - validar permissão admin/coordinator
  - carregar a `swap_request` e o booking original com lock
  - validar disponibilidade e status da sessão destino
  - aplicar a remarcação de forma consistente
- Escolha de implementação para o plano:
  - manter o booking original como registro histórico com status `remarcado`
  - criar um novo booking ativo `agendado` para a nova sessão
  - ligar a mudança por auditoria/log, preservando rastreabilidade
- A RPC deve também:
  - impedir múltiplas aprovações da mesma solicitação
  - cancelar/rejeitar corretamente a solicitação
  - atualizar capacidade/contagem de forma consistente pelo próprio modelo de bookings
  - opcionalmente enfileirar comunicação ao usuário se esse comportamento já fizer parte do domínio atual
- O hook/tela administrativa de reagendamento deve parar de usar `updateSwapRequestStatus + updateBookingStatus` como orquestração de negócio e passar a chamar apenas a RPC do banco.

### 3. Unificar as regras de “booking ativo” usadas pelo militar
- Padronizar quais status contam como bloqueio para:
  - calendário mensal
  - verificação de booking já existente no semestre
  - dashboard do militar
  - ticket digital
- Escolha do plano:
  - apenas `agendado` conta como booking ativo para novas operações do militar
  - `remarcado` passa a ser histórico, não bloqueador
- Atualizar `get_booked_dates`, `get_existing_semester_booking` e consultas auxiliares para refletirem essa regra única.
- Ajustar `confirmar_agendamento` e suas pré-validações para usar o mesmo critério de booking ativo, sem divergência entre frontend e RPC.

### 4. Corrigir disponibilidade de sessões para militar e reagendamento
- Atualizar `get_sessions_availability` para retornar somente sessões realmente selecionáveis:
  - `status = 'open'`
  - dentro do intervalo solicitado
  - com vagas disponíveis
- Se necessário, expandir o retorno da RPC para incluir `session_status` e `location_name` diretamente, reduzindo composição duplicada no cliente.
- Ajustar `useSessions`, `Scheduling` e `RescheduleDrawer` para dependerem dessa fonte única e não reimplementar filtro de disponibilidade no cliente.
- Remover da UI a possibilidade de selecionar sessões fechadas/concluídas e empurrar o erro para a etapa de confirmação.

### 5. Fechar o fluxo do militar ponta a ponta
- Garantir que o dashboard do militar, ticket e histórico reflitam o booking ativo mais recente e ignorem corretamente bookings históricos remarcados.
- Revisar `fetchAppointmentContext`, `useTicket`, `OperationalDashboard` e utilitários de booking para trabalhar com a nova semântica do fluxo.
- Manter o gate já introduzido de perfil incompleto, mas garantir que ele não interfira nas operações de agendamento depois que o perfil estiver completo.

## APIs, Interfaces e Contratos
- Adicionar uma RPC explícita de aprovação de reagendamento, substituindo a orquestração por updates diretos no frontend.
- Ajustar os contratos tipados do Supabase para refletir:
  - nova RPC de aprovação
  - possível shape expandido de `get_sessions_availability`
  - eventuais campos de retorno necessários para auditoria/booking novo
- Introduzir um utilitário frontend único para:
  - classificar “booking ativo”
  - mapear exibição de status operacional
  - evitar regras ad hoc em múltiplas páginas

## Testes e Cenários
- Banco/RPC:
  - aprovar solicitação cria booking novo ativo e preserva o original como histórico
  - rejeitar solicitação não altera booking ativo
  - não aprova swap para sessão fechada, cheia ou inexistente
  - usuário com booking remarcado não fica bloqueado indevidamente para regras de leitura
- Frontend unitário/integration:
  - `Scheduling` não mostra sessão fechada como disponível
  - `RescheduleDrawer` não oferece sessões inválidas
  - `SessionBookingsManagement` exibe status real do booking e presença separadamente
  - `OperationalDashboard` usa o booking ativo correto após remarcação
- Fluxos E2E prioritários:
  - militar agenda TACF pela primeira vez
  - admin/coordinator marca presença e resultado
  - militar inapto/faltoso solicita reagendamento
  - admin aprova e o militar passa a ver a nova sessão, não a antiga
  - ticket/dashboard/histórico continuam consistentes após a aprovação

## Assumptions
- O estado desejado é: reagendamento aprovado gera novo booking ativo; o booking anterior vira histórico.
- O frontend não deve conter regra de domínio decisória sobre disponibilidade, semestre ou swap; isso fica centralizado em RPCs.
- Mudanças em RPC/migration entram no plano, mas a execução depende de revisão humana do HACO conforme a regra do projeto.
- O foco deste plano não inclui redesign visual nem refatoração ampla fora do fluxo crítico de TACF.

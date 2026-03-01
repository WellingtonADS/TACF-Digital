✅ Página de Gestão de Reagendamento concluída

Implementei o componente ReschedulingManagement.tsx com base no layout 10_tacf-digital_rescheduling_management e conectei-o ao banco de dados via Supabase, reaproveitando padrões já existentes no projeto. O visual foi ajustado para ficar o mais próximo possível do HTML do Stitch sem alterar a lógica de dados.

🧩 Alterações principais
Novo arquivo ReschedulingManagement.tsx

Busca agendamentos com swap_reason (pedido de reagendamento).
Carrega sessões e perfis em paralelo para preencher datas e nomes.
Filtragem por status (pendentes/aprovados/recusados) e pesquisa por nome/SARAM.
Tabela responsiva com botões “DEFERIR”/“INDEFERIR”.
Pop‑over para exibir justificativa e anexo mock.
Indicadores de estatística na barra superior.
Uso de PageSkeleton durante carregamento.
Serviços atualizados

bookings.ts ganhou helpers fetchSwapRequests e updateBookingStatus (pré‑requisitos para futuras evoluções).
Rotas e navegação

Importação lazy no main.tsx e rota /app/reagendamentos adicionada.
Link “Reagendamentos” incluído na barra lateral (Sidebar.tsx) com ícone Clock e pre‑fetch ao passar o mouse.
Documentação

ContextRotaAdmin.md atualizado com o caminho da rota.
🛠 Integrações adicionais
Ajuste de Sidebar.tsx para pré‑carregar o novo componente.
Lint/TypeScript combed for issues: apenas erros externos às minhas alterações persistem (scripts internos e AccessProfilesManagement.tsx).
Não foi criado nenhum teste conforme instrução.
📝 Próximos passos sugeridos
Testar a tela com registros de bookings contendo swap_reason (pode inserir via SQL ou usar um mock).
Refinar colunas com dados reais (join em profiles se necessário).
Quando tabelas swap_requests ou RPCs específicas forem criadas, migrar a lógica sem alterar o UI.
Escrever testes unitários/E2E na próxima iteração.
📍 A rota já está navegável e “lazy‑loaded” – basta acessar /app/reagendamentos em sessão administrativa.

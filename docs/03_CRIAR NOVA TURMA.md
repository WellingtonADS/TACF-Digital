Incluí “Nova Turma” no menu lateral em Sidebar.tsx, apontando para /app/turmas/nova.
Adicionei prefetch da página ClassCreationForm.tsx no onMouseEnter da sidebar.
Validação executada:
yarn lint ✅
npx tsc --noEmit ✅
Se quiser, também posso reordenar os itens da sidebar para deixar “Nova Turma” logo abaixo de “Dashboard” ou junto de “Agendamentos”, conforme seu padrão de navegação preferido.


---

Implementado

Nova página criada: ClassCreationForm.tsx
Preview da página: ClassCreationFormPreview.tsx
Rota app adicionada: /app/turmas/nova em main.tsx
Rota preview adicionada: /preview/turmas-nova em main.tsx
Índice de previews atualizado em PreviewIndex.tsx
CTA “CRIAR NOVA TURMA” do admin apontando para a nova tela em AdminDashboard.tsx
Conexão com banco

Submit usa supabase.from("sessions").insert(...) com campos reais do schema:
date
period (derivado de horário: manhã/tarde)
max_capacity
Validação de capacidade 8..21
Tratamento de conflito de sessão (23505) com mensagem amigável
Sucesso redireciona para /app/agendamentos
Cancelar volta para /app/agendamentos
Validação

yarn lint ✅
npx tsc --noEmit ✅
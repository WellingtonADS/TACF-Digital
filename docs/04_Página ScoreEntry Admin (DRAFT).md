Implementação iniciada e aplicada

Criei a página ScoreEntry.tsx com layout baseado no stitch, lista de efetivo por turma, busca por nome/SARAM, seleção do militar e formulário para lançar nota final.
Mantive integração com banco usando as conexões existentes: leitura de sessions, bookings, profiles e persistência direta em bookings.score (sem nova RPC/migration).
A página restringe acesso para admin/coordinator via useAuth, exibindo estado de acesso restrito para perfis sem permissão.
Integração de rotas e navegação

Adicionei lazy import + rota /app/lancamento-indices em main.tsx.
Incluí o item “Lançar Índices” na sidebar e prefetch no hover em Sidebar.tsx.
Validação

yarn lint executado com sucesso.
Diagnósticos de erro verificados sem problemas nos arquivos alterados (incluindo ScoreEntry.tsx).

---
Plan: Página ScoreEntry Admin (DRAFT)
A criação da página vai seguir o layout de referência em code.html, reaproveitando os padrões já usados em páginas administrativas e mantendo integração com Supabase sem nova RPC/migration.
Decisões já alinhadas: rota main.tsx em /app/lancamento-indices, acesso apenas admin/coordinator, persistência direta em bookings.score e bookings.result_details, com armazenamento efetivo só da nota final (score) nesta etapa.
Como não existe hoje uma tela de lançamento com edição de score no frontend, o plano foca em reutilizar Layout, estrutura de filtros/lista, tipagem de Database, e consultas já existentes de profiles + bookings para minimizar código novo e risco.

Steps

Levantar e isolar blocos visuais do layout alvo para adaptação ao design system atual (sem novas cores/tokens), espelhando padrões de PersonnelManagement.tsx e ClassCreationForm.tsx.
Criar src/pages/ScoreEntry.tsx com estrutura em duas colunas (lista de efetivo + painel de lançamento), usando Layout de Layout.tsx e estado local tipado.
Implementar carregamento de dados com Supabase reaproveitando estratégia de PersonnelManagement.tsx: buscar militares (profiles) e vínculos de sessão (bookings) para montar lista e seleção do avaliado.
Implementar persistência da nota final no bookings.score via supabase.from("bookings").update(...), mantendo result_details sem ampliação funcional nesta entrega (somente compatibilidade de schema).
Aplicar controle de acesso por perfil dentro da página com base em useAuth de useAuth.ts, bloqueando usuários sem role admin/coordinator com fallback de navegação.
Registrar rota lazy em main.tsx para /app/lancamento-indices e adicionar entrada de navegação/prefetch em Sidebar.tsx seguindo padrão já usado.
Atualizar índice de preview em PreviewIndex.tsx apenas se necessário para navegação interna do time (sem criar nova página preview agora, para manter escopo mínimo).
Garantir tratamento de estados (carregando/vazio/erro/salvando) com consistência visual das telas existentes e sem introduzir validação de regra de domínio no cliente.
Verification

Executar yarn lint.
Executar npx tsc --noEmit.
Validar manualmente fluxo em /app/lancamento-indices: listar militares, selecionar, lançar nota final, salvar em bookings.score, feedback de sucesso/erro, e bloqueio para perfil sem permissão.
Confirmar que não houve alteração em migrations nem policies.
Decisions

Rota: /app/lancamento-indices.
Acesso: apenas admin/coordinator.
Persistência: update direto em bookings.score e compatibilidade com result_details.
Campos: nesta fase, salvar apenas nota final (score), sem persistir corrida/flexão/abdominal.
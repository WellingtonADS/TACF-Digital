Plan: Criar página AuditLog (AuditLog.tsx)

TL;DR — Criar AuditLog reutilizando o RPC get_audit_logs e componentes existentes (Layout, PageSkeleton). Não criar novos serviços; adicionar rota /app/auditoria e item na sidebar. Visual seguirá o HTML de Stitch (filtros + tabela com botão "VER JSON"), sem alterar lógica de dados.

Steps

Criar página: adicionar src/pages/AuditLog.tsx — componente cliente que:

chama supabase.rpc('get_audit_logs') para obter até 500 registros.
usa Layout e PageSkeleton para carregamento.
parseia details (texto/JSON) para extrair ip quando disponível (mostrar "-" caso contrário).
renderiza filtros (Período, Usuário/SARAM, Tipo de Ação, Módulo) visualmente conforme Stitch (inputs/selects) — filtros aplicados no cliente (filtrar array retornado), sem alterar RPC.
tabela com colunas: Data / Hora, Usuário, Ação, Módulo (use entity), IP de Origem, Detalhes (botão que abre modal com JSON raw).
paginador visual (UI idêntica ao Stitch). Implementação simples cliente (estado page, perPage) — o RPC já limita 500 registros.
Rotas: registrar rota lazy em main.tsx para /app/auditoria com React.lazy(() => import('../pages/AuditLog')).

Sidebar: adicionar item “Logs de Auditoria” em Sidebar.tsx (prefetch on hover, ícone security ou similar) apontando para /app/auditoria.

Reusar tipagens: usar Database["public"]["Tables"]["audit_logs"]["Row"] de database.types.ts quando disponível; caso a tipagem não exista, declarar um tipo local compatível com o retorno do RPC (id, action, entity, user_id, user_name, created_at, details).

UI fidelity: alinhar classes Tailwind e estrutura ao HTML em code.html (header, filtro, tabela, paginação, widgets de resumo — widgets podem ser colocados como estáticos ou omitidos inicialmente se preferir começar pelo core tabela).

Sem dependências novas: não adicionar libs; usar supabase já exposto em supabase.ts.

Verification

Manual: executar yarn dev, abrir /app/auditoria, confirmar que a tabela carrega registros e botão "VER JSON" abre modal com details.
Qualidade: rodar yarn lint e npx tsc --noEmit e corrigir avisos apenas se referentes às mudanças novas.
Decisions

Rota escolhida: /app/auditoria (concorda com convenção em português).
Data layer: reuso do RPC get_audit_logs — não criar migrations nem mover lógica para o cliente.
Paginação: cliente com perPage e page (RPC já limita 500 linhas).
IP de Origem: extraída de details quando presente (não alterar DB schema).
Arquivos chave (para leitura/edição)

Reuso RPC / DB: get_audit_logs.sql and schema.sql
Supabase client: supabase.ts
Layout / skeleton: Layout.tsx , PageSkeleton.tsx
Routes: main.tsx
Sidebar: Sidebar.tsx
Stitch visual ref: stitch_screens/03_Admin/12_tacf-digital_audit_log/code.html

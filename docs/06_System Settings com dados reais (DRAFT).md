✅ Implementation started and completed

The new SystemSettings page has been fully built following the requirements:

TypeScript types expanded
Added system_settings, access_profiles, permissions, access_profile_permissions and audit_logs tables (plus session_period/user_role enums) to database.types.ts.

New page created in SystemSettings.tsx
• Admin‑only access (checked via useAuth).
• Sidebar with tabs (Geral, Tabelas de Avaliação, Locais/OM, Perfis de Acesso, Logs de Auditoria).
• “Geral” tab loads & edits the single system_settings row.
• “Tabelas de Avaliação” tab reproduces the design sample with static rows and PDF button.
• Placeholders for Locations/Profiles.
• Audit tab fetches RPC get_audit_logs and displays results.
• Full layout mimics the stitch design (sidebar, header, cards, tables, tailwind classes).

Navigation updates
• Sidebar: imported Settings icon, added Configurações entry and prefetch logic.
• main.tsx: lazy-loaded SystemSettings, added /app/configuracoes route (and preview route /preview/configuracoes).
• PreviewIndex.tsx: added preview/quick links for settings.

Lint/TypeScript
All code passes yarn lint and npx tsc --noEmit without errors.
ESLint warning during development resolved by refactoring audit-effect.

🧩 Files touched

File	Purpose
database.types.ts	Added new tables/enums
SystemSettings.tsx	New settings page implementation
Sidebar.tsx	Nav item & prefetch for settings
main.tsx	Lazy import + route registration (app & preview)
PreviewIndex.tsx	Added preview links for settings

---

Plan: System Settings com dados reais (DRAFT)
A página será nova, com rota /app/configuracoes e acesso apenas admin, seguindo o layout 06 em code.html. O plano reaproveita a base já consolidada (Layout, autenticação por perfil, Supabase client, padrão de lazy route/prefetch) e conecta os blocos funcionais definidos: parâmetros gerais, tabela de avaliação masc/fem, locais/OM, perfis de acesso com permissões e logs de auditoria.
Ponto-chave de viabilidade: a migration já criou system_settings, access_profiles, permissions, access_profile_permissions e audit_logs (ver 20260215_add_admin_audit_settings_access.sql), mas esses objetos não estão em database.types.ts; por isso a atualização de tipagem entra como etapa obrigatória antes da implementação da tela. O refinamento visual final será aplicado no fechamento para aproximar ao stitch sem alterar lógica de dados.

Steps

Atualizar tipagens de banco em database.types.ts para incluir system_settings, access_profiles, permissions, access_profile_permissions e audit_logs, mantendo TypeScript strict.
Criar src/pages/SystemSettings.tsx com estrutura visual fiel ao layout 06: sidebar interna de seções, abas masculino/feminino, tabela de índices, cards de parâmetros e rodapé de ações.
Implementar gate de acesso admin com reaproveitamento de useAuth.ts, exibindo estado de acesso restrito para perfis não autorizados.
Conectar bloco “Parâmetros Gerais” com leitura/escrita em system_settings (min/max capacity, períodos, flags e campos institucionais), respeitando RLS admin-only.
Conectar “Perfis de Acesso” com access_profiles + permissions + access_profile_permissions, priorizando edição simples (ativação/perfil/permissões) no MVP.
Conectar “Logs de Auditoria” com RPC existente get_audit_logs em get_audit_logs.sql, com paginação/limite no cliente sem nova RPC.
Implementar “Locais / OM” de forma conservadora: usar fonte existente em profiles.sector para visualização inicial; caso não haja tabela dedicada confiável, manter edição mínima ou read-only no MVP.
Implementar “Tabela de Avaliação por faixa etária (masc/fem)” com fallback seguro: se não houver fonte dedicada persistida, usar estado persistível em system_settings via campo JSON/metadata já suportado; manter mesma lógica de dados no refinamento visual final.
Integrar rota lazy em main.tsx para /app/configuracoes e adicionar item + prefetch em Sidebar.tsx, seguindo o padrão atual de navegação.
Aplicar refinamento visual final na própria src/pages/SystemSettings.tsx: tipografia, espaçamentos, bordas, estados ativos e hierarquia visual para aproximar ao HTML stitch sem mudar queries/regras de persistência.
Verification

Executar yarn lint.
Executar npx tsc --noEmit.
Validar manualmente fluxo admin em /app/configuracoes (carregar, editar e salvar por seção; estados de erro/loading).
Confirmar ausência de testes novos nesta etapa.
Confirmar que nenhuma alteração em policies/migrations foi necessária para o escopo planejado.
Decisions

Nova página dedicada: src/pages/SystemSettings.tsx.
Rota: /app/configuracoes.
Acesso: apenas admin.
Escopo funcional completo das 5 áreas do layout 06.
Estratégia de tipagem: atualizar database.types.ts para cobrir as tabelas já existentes no banco.
---
Implementação concluída

Criei a nova página AnalyticsDashboard.tsx baseada no layout 05, mantendo conexão real com Supabase (profiles + bookings) e sem criar RPC/migration.
A tela inclui os blocos do MVP: 4 cards de KPI, comparativo por unidade/setor, evolução mensal (linha SVG simples), tabela de revalidação pendente e botão Exportar (UI).
Acesso está restrito a admin/coordinator usando useAuth, com fallback de “Acesso restrito”.
Integração no app

Adicionei rota lazy /app/analytics em main.tsx.
Adicionei item “Analytics” + prefetch on hover em Sidebar.tsx.
Incluí atalho “Analytics (app)” em PreviewIndex.tsx.
Validação

yarn lint ✅
npx tsc --noEmit ✅
Checagem de erros nos arquivos alterados sem problemas ✅

---

Plan: Analytics Dashboard Admin (DRAFT)
A implementação será feita como nova página separada, mantendo AdminDashboard.tsx intacta para não causar regressão no que já existe. A nova tela seguirá o layout 05 em code.html, com foco em reaproveitar consultas e padrões atuais (Supabase client, hooks e estrutura de Layout/Sidebar). A rota definida é /app/analytics, com acesso restrito a admin/coordinator. O MVP incluirá cards de métricas, comparativo por unidade/setor, evolução mensal simples, tabela de revalidação pendente e botão Exportar apenas visual. Não haverá testes nesta etapa, conforme solicitado, e não serão criadas migrations/RPC novas.

Steps

Mapear e reutilizar lógica analítica já existente em AdminDashboard.tsx, useSessions.ts, useDashboard.ts e supabase.ts, isolando métricas que já podem ser obtidas via bookings, profiles, sessions e RPC de disponibilidade.
Criar a nova página src/pages/AnalyticsDashboard.tsx com estrutura visual do layout 05: header com período/exportar (UI), grid de 4 KPIs, bloco de barras por unidade/setor, bloco de evolução mensal (linha simples com dados agregados), e tabela de revalidação pendente.
Implementar controle de acesso por role na própria página com base em useAuth.ts, restringindo para admin/coordinator e exibindo estado de acesso negado para demais perfis autenticados.
Definir estratégia de dados sem criar backend novo:
Cards: agregações de bookings (contagem total, contagem com score, média de score, contagem de inaptidões conforme regra definida no frontend desta tela).
Comparativo por unidade/setor: agregação por profiles.sector combinada com últimos resultados em bookings.
Evolução mensal: série mensal com base em bookings.created_at + score.
Revalidação pendente: lista derivada de profiles.active, data do último teste e score mais recente por usuário.
Integrar lazy loading e rota /app/analytics em main.tsx, mantendo padrão de Suspense já usado no projeto.
Adicionar item de navegação na sidebar em Sidebar.tsx com prefetch on hover, respeitando o padrão de imports dinâmicos atual.
Atualizar atalhos internos em PreviewIndex.tsx apenas com rota de app (sem criar preview nova, para manter escopo mínimo).
Revisar aderência de design tokens/classes já usados em páginas atuais para não introduzir tema paralelo ao projeto.
Verification

Executar yarn lint.
Executar npx tsc --noEmit.
Validar manualmente: carregamento da rota /app/analytics, bloqueio por role, renderização dos 5 blocos MVP, estados de vazio/erro/carregando, e navegação pela sidebar.
Confirmar ausência de mudanças em migrations e rpc.
Decisions

Nova página separada: src/pages/AnalyticsDashboard.tsx.
Nova rota: /app/analytics.
Acesso: somente admin/coordinator.
Escopo MVP fechado nos 5 blocos definidos.
Sem testes nesta etapa.
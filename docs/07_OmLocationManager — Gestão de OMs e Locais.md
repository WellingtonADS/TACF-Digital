Plan: OmLocationManager — Gestão de OMs e Locais
TL;DR: Criar tabela locations no Supabase (migration + types + RLS + RPCs CRUD), implementar hook useLocations para abstração de dados, página principal OmLocationManager.tsx com grid de cards (layout do Stitch), página editora OmLocationEditor.tsx em rota separada (/app/om/:id), e seed data de exemplo. Refinamento visual ensolará o HTML do Stitch sem alterar lógica de dados. Sem testes neste momento.

Steps
FASE 1: Banco de Dados — Tabela & Schema
Criar migration supabase/migrations/20260220_create_locations_table.sql

Tabela locations com campos: id, name, address, max_capacity, status (enum), facilities (array JSON), created_at, updated_at, created_by
Status enum: 'active' | 'maintenance' | 'inactive'
Facilities como text[] (ex: ['Pista Atletismo', 'Piscina', 'Ginásio'])
Foreign key created_by → profiles.id (para auditoria)
Atualizar database.types.ts com tipo gerado:

Adicionar RLS policies em rls.sql:

SELECT: todos podem ler
INSERT/UPDATE/DELETE: apenas admin (role = 'admin')
FASE 2: Backend — RPCs para CRUD
Criar 4 RPCs em rpc:

get_locations.sql — Query com busca, paginação e filtro por status

Parameters: p_search_term, p_status, p_limit, p_offset
Retorna: array de locations + total_count para paginação
create_location.sql — Insert com validação

Parameters: p_name, p_address, p_max_capacity, p_status, p_facilities
Retorna: location criada com id
update_location.sql — Update por ID

Parameters: p_id, p_name, p_address, p_max_capacity, p_status, p_facilities
Retorna: location atualizada
delete_location.sql — Delete por ID com verificação de integridade

Parameters: p_id
Retorna: status ou erro se tiver dependências
FASE 3: Frontend Hook — Data Fetching Abstraction
Criar src/hooks/useLocations.ts:

getLocations(search, status, page, limit) → chama get_locations RPC
createLocation(data) → chama create_location RPC
updateLocation(id, data) → chama update_location RPC
deleteLocation(id) → chama delete_location RPC
Estados: loading, error, data
Error handling padrão do projeto (try/catch, toast de erro)
Padrão: seguir useDashboard.ts (RPC via supabase.rpc())

FASE 4: Página Principal — OmLocationManager.tsx
Criar src/pages/OmLocationManager.tsx:

Layout (conforme Stitch):

Header com breadcrumb + título "Gestão de Locais e OMs"
Action bar: Input busca + botão "Adicionar Nova OM" + filtro (dropdown status)
Grid de cards (3 colunas desktop, responsivo)
Card OM: ícone status badge → nome → endereço → capacidade → facilities (tags) → 2 botões (Editar, Gerenciar Horários)
Card vazio: "+ Cadastrar Nova OM"
Paginação inferior (número de página + info total)
State & Logic:

useState para: search, statusFilter, currentPage, pageSize
useLocations() para fetch com useEffect
useMemo para filtros locais (se necessário)
Navegação: botão "Editar Unidade" → /app/om/{id}, botão "Gerenciar Horários" → future page ou modal
Componentes reutilizáveis:

Card.tsx para grid
Button.tsx para ações
Input.tsx para busca
PageSkeleton.tsx para loading
FASE 5: Página Editora — OmLocationEditor.tsx
Criar src/pages/OmLocationEditor.tsx:

Route param: :id (se 'new', é create)
Form com campos: name, address, max_capacity, status (dropdown), facilities (multi-select/tags)
Botões: Salvar, Cancelar
Validação: nome obrigatório, capacidade > 0
Comportamento: POST se novo, PATCH se edição
Redirect após sucesso → /app/om-locations
Toast notificação (sucesso/erro)
Padrão: seguir ClassCreationForm.tsx ou ScoreEntry.tsx para formulário

FASE 6: Integração & Roteamento
Atualizar router (arquivo principal de rotas em main.tsx ou similar):

Rota /app/om-locations → OmLocationManager.tsx
Rota /app/om/:id → OmLocationEditor.tsx
Atualizar Sidebar.tsx:

Adicionar link "Gestão de OMs" na seção Admin
Seed data (dados de exemplo):

Criar supabase/seeds/locations_seed.sql ou incluir em migration
Inserir 4 OMs de exemplo (GPAC, BAAN, EPCAR, GSD-SP) conforme Stitch
Refinar visualmente src/pages/OmLocationManager.tsx:

Tipografia, espaçamento, cores do Stitch
Responsiveness (mobile, tablet, desktop)
Hover states nos buttons/cards
Ícones (location_on, status badge visual) — usar Icon.tsx
Verification
Testes manuais (sem testes unitários por enquanto):

Banco de dados:

Rodar migration: yarn db:apply
Verificar tabela em Supabase Studio
Inserir seed data manualmente
RPCs:

Testar no Supabase SQL Editor
SELECT * FROM get_locations(null, null, 10, 0); deve retornar locations
Frontend:

yarn dev → navegar para /app/om-locations
Verificar se cards carregam dados
Testar busca (filtra por nome)
Testar filtro status (dropdown)
Testar paginação
Clicar "Editar Unidade" → deve navegar para /app/om/{id}
Clicar "+ Adicionar Nova OM" → deve navegar para /app/om/new
Editar/criar → salvar → voltar para lista
Visual:

Comparar layout com Stitch (stitch_screens/.../code.html)
Check responsiveness (mobile, tablet, desktop)
Verificar alinhamento estilo Tailwind
TypeScript:

npx tsc --noEmit deve passar sem erros
yarn lint deve passar
Decisions
Escopo banco incluído: conforme escolha, migration + RLS + RPCs faz parte do plan (fase 1–2)
Page vs Modal para edição: página separada (/app/om/:id) melhor para UX nav; alinha com convenção Angular em SystemSettings.tsx (abas)
Hook abstraction: useLocations.ts desacopla lógica data do componente, reutilizável
Seed data real: 4 OMs no banco (dev/test), não mockado
Componentes reutilizáveis: priorizar atomic/ + layout existentes, não criar novos
Visual refinement: sem mudança de lógica, só CSS/Tailwind para alinhar com Stitch
Sem testes: conforme pedido, apenas verificação manual

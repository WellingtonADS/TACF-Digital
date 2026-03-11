---
name: visual-layout-standard
description: Padroniza layout visual no src com contrato unico de cores, tipografia, icones, loading e responsividade. Use para refatorar paginas sem regressao de consistencia.
---

# Visual Layout Standard (TACF Digital)

Skill de execucao para aplicar o padrao visual unico do projeto, com foco em consistencia, simplicidade e reuso.

Fonte canonica obrigatoria: `docs/cores fora do padrão.md`.

---

## 1) Objetivo

Aplicar um único padrão de UI no `src/` com identidade militar conforme o guia canônico:

- linguagem estrutural azul/branco/cinza (tokens primários: `primary`, `secondary`, `bg-default`, `bg-card`, `text-body`, `text-muted`, `text-inverted`, `border-default`)
- cores de estado restritas a semânticas funcionais (`success`, `error`) e variações opacas
- ícones sempre via `AppIcon` com hierarquia de tamanhos (`xs`, `sm`, `md`, `lg`) e exportação central em `src/icons`
- loading full page usando `FullPageLoading`; blocos parciais com `PageSkeleton` ou carregamento local controlado
- layout responsivo consistente com `Layout` e breakpoints oficiais (`mobile < 768`, `tablet >= 768 && < 1024`, `desktop >= 1024`)
- tipografia e espaçamento seguindo escala oficial: H1 `text-xl md:text-2xl lg:text-3xl`; H2/H3 `text-lg md:text-xl`; rótulos institucionais `text-sm uppercase`; corpo `text-sm`/`text-base`; auxiliar `text-xs`/`text-sm`; labels compactos `text-[10px]` apenas para rótulos curtos

Princípios obrigatórios:

1. DRY: não repetir o que já existe.
2. KISS: evitar complexidade desnecessária.
3. YAGNI: só implementar o que será usado agora.
4. Reuso-first: pesquisar em `src/` antes de criar algo novo.
5. Não gerar testes sem solicitação explícita.

---

## 2) Fluxo operacional (passo a passo)

### Passo 1 - Diagnóstico

Rodar auditoria no escopo alvo (`src/pages/**` ou arquivo único):

- cores estruturais fora de contrato: `amber|emerald|violet|sky|yellow|purple|dark:` (qualquer uso estrutural nesses tons deve ser migrado)
- estados para auditoria: `success|error` (avaliar se são semânticas de estado ou usos estruturais)
- legado de vermelho literal: `red-` (deve migrar para token `error` salvo justificativa)
- loading fragmentado e texto cru: `Carregando...|Carregando…|Loader2|animate-spin`
- importações diretas de `lucide-react` ou icon JSX sem `AppIcon` (novo eslint rule impede isso)

Saída esperada: lista de ocorrências por arquivo, com tipo e classificação sugerida.

### Passo 2 - Classificação de ocorrências

Classificar cada match:

1. Estado funcional:

- pode manter semântica de estado (`success/error`)

2. Visual estrutural:

- migrar para tokens estruturais (`primary`, `bg-card`, `text-body`, `text-muted`, `border-default`)

Regra crítica:

- `red-*` deve migrar para token semântico `error` equivalente
- manter `red-*` apenas com limitação técnica comprovada e justificativa no PR

### Passo 3 - Planejamento de refatoração

Ordem obrigatória:

1. `src/components/layout/*`
2. páginas de maior exposição de usuário
3. restante das páginas
4. componentes administrativos de menor exposição

Estratégia:

- mudanças pequenas por arquivo/lote lógico
- validar antes do próximo lote
- evitar alteração cega em massa sem revisão contextual

### Passo 4 - Implementação padrão

Aplicar contrato visual completo baseado nas regras do guia:

1. Layout/shell:

- toda rota sob `app/*` deve usar o `Layout` principal
- sidebar comporta-se como drawer no mobile/tablet e fixa no desktop, com offset `md:ml-64 lg:ml-72`
- não introduzir margens manuais do lado do conteúdo fora do shell

2. Cards e superfícies:

- usar `CARD_BASE_CLASS`, `CARD_ELEVATED_CLASS`, `CARD_INTERACTIVE_CLASS` ou utilitários `card-surface*`

3. Ícones:

- importar sempre de `@/icons` e renderizar via `<AppIcon />`
- tamanhos semânticos mapeados para pixels (`xs`=14, `sm`=18, `md`=24, `lg`=32)
- siga a hierarquia de tamanhos por contexto (navegação, cabeçalhos, tabelas, botões, feedback, etc.)
- tons semânticos: `default`, `muted`, `primary`, `inverse`, `danger`
- siga regras de acessibilidade (`decorative` ou `ariaLabel`/`role`)

4. Loading:

- página inteira: `FullPageLoading`
- seção/lista parcial: `PageSkeleton` ou spinner local com controle
- evitar texto cru como `Carregando...`

5. Tipografia e espaçamento:

- H1 principal: `text-xl md:text-2xl lg:text-3xl`
- H2/H3 de seção com conteúdo: `text-lg md:text-xl`
- rótulos institucionais curtos: `text-sm` uppercase
- corpo de texto: `text-sm` ou `text-base`
- texto auxiliar/metadado: `text-xs` ou `text-sm` (prefira `text-xs` quando for claramente secundário)
- labels compactos (badges/chips/colunas técnicas): `text-[10px]` somente para rótulos curtos
- evite saltos abruptos de escala e mantenha consistência entre páginas

6. Cores de texto e estado:

- texto estrutural principal: `text-body`
- apoio/metadado: `text-muted`
- sobre fundo escuro/primário: `text-inverted` ou `text-inverted/80` / `text-white/80`
- sucesso/erro: mantenha semântica `text-success`/`text-error` exclusivamente em feedback funcional
- nunca use `text-primary` para texto corrido; reserve para CTAs/links/destaques
- proíba cores estruturais proibidas (`amber`, `emerald`, `violet`, `sky`, `yellow`, `purple`)

7. Responsividade macro e containers:

- prefira `mx-auto max-w-6xl` (fluxos operacionais) ou `max-w-5xl` (conteúdo/documentação)
- padding horizontal `px-4 sm:px-6`, `lg:px-0` em desktops largos quando aplicável
- grids: mobile `grid-cols-1`, desktops densificados progressivamente (`lg:grid-cols-12` com `col-span-8/4` etc.)
- dashboards: cards de ação `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`, seções inferiores `flex-col` -> `xl:flex-row`
- validação contra overflow horizontal, truncamentos indevidos e breakpoints hardcoded

### Passo 5 - Validação

Checklist mínimo por lote:

1. `yarn lint`
2. arquivo alterado sem erros
3. sem overflow horizontal em 360px
4. desktop e mobile consistentes
5. sem retorno principal com texto cru `Carregando...`
6. sem cor estrutural fora do contrato

---

## 3) Matriz de decisão rápida

| Caso                                    | Decisão                                                     |
| --------------------------------------- | ----------------------------------------------------------- |
| Cor fora do contrato em card/header/nav | Migrar para tokens estruturais (`primary`, `bg-card`, etc.) |
| Cor de estado em feedback real          | Manter semântica `success/error`                            |
| `red-*` legado                          | Migrar para `error` ou justificar tecnicamente              |
| Ícone direto no JSX                     | Migrar para `AppIcon` e importar de `@/icons`               |
| Loading de página inteira               | `FullPageLoading`                                           |
| Loading parcial de bloco                | `PageSkeleton` ou spinner local                             |
| H2 de seção com conteúdo                | `text-lg md:text-xl`                                        |
| Rótulo curto institucional              | `text-sm uppercase`                                         |
| Texto corrido usando `text-primary`     | trocar por `text-body` e reservar `primary` para CTAs       |
| Breakpoint hardcoded fora do padrão     | alinhar com mobile/tablet/desktop oficiais                  |
| Overflow horizontal em mobile           | corrigir (mobile-first grid-cols-1 or flex-col)             |

---

## 4) Bloqueios (nao aprovar)

Bloquear alteração se houver:

1. página `app/*` sem `Layout`.
2. ícone novo fora de `AppIcon` ou import direto de `lucide-react`.
3. loading full-page sem `FullPageLoading` ou texto "Carregando...".
4. nova variação de card fora de `CARD_*`/`card-surface*`.
5. uso estrutural de `amber/emerald/violet/sky/yellow/purple` ou tokens proibidos.
6. uso de `red-*` sem justificativa técnica aprovada (deve ser `error`).
7. texto redundante sem valor de UX.
8. quebra de hierarquia tipográfica (tamanhos inconsistentes para o mesmo papel).
9. overflow horizontal em mobile ou breakpoint customizado.
10. componentes que compensam manualmente a sidebar em vez de confiar no layout.

---

## 5) Definição de pronto

Concluir quando todos forem verdadeiros:

1. toda estrutura usa azul/branco/cinza institucional e tokens oficiais.
2. estados funcionais aparecem apenas como `success/error` nos contextos corretos.
3. ícones renderizados via `AppIcon` com hierarquia de tamanho documentada.
4. tamanhos e cores de texto consistentes por papel visual; nenhum `text-primary` em para texto corrido.
5. responsividade consistente com `Layout`, containers padrão (`max-w-*`, `px-4 sm:px-6`) e breakpoints oficiais.
6. grid/mobile densificação progressiva sem overflow horizontal.
7. nenhum import direto de `lucide-react`, nenhum `red-*` indevido, nenhum estilo proibido.
8. lint limpo, `npx tsc --noEmit` sem erros.

---

## 6) Prompts de uso sugeridos

1. `Aplique a skill visual-layout-standard em src/pages/Scheduling.tsx e normalize cores, icones e loading.`
2. `Faça auditoria visual em src/pages/** com a skill visual-layout-standard e priorize paginas de usuario.`
3. `Refatore src/pages/OperationalDashboard.tsx usando a matriz de decisao da skill visual-layout-standard.`
4. `Valide se src/pages/Documents.tsx cumpre definicao de pronto da skill visual-layout-standard.`

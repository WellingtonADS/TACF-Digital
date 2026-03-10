# Estilos — OperationalDashboard.tsx

Visão geral do padrão visual usado pelo componente `OperationalDashboard.tsx`, com origem das cores, classes reutilizáveis, padrão de ícones e recomendações.

## 1) Visão geral rápida

- O projeto adota tokens semânticos (CSS variables) + Tailwind para exposição de classes utilitárias.
- Superfícies e padrões visuais (cartões, badges, texturas) são definidos em `src/index.css` via `@layer components` e consumidos por classes/utilitários Tailwind.
- Ícones são fornecidos pela biblioteca `lucide-react` e, em alguns casos, passados como `ReactNode` para componentes reutilizáveis (`Button`, `SidebarItem`).

## 2) Origem das cores (tokens)

- Definição central: `src/styles/tokens.css` — variáveis CSS RGB (ex.: `--color-primary`, `--color-bg-card`, `--color-text-muted`).
- Mapeamento para Tailwind: `tailwind.config.ts` converte essas variáveis em entradas de `colors` (ex.: `primary`, `bg-card`, `text-muted`) e alias como `emerald`, `amber`.
- Uso no JSX: classes como `bg-primary`, `bg-bg-card`, `text-text-muted`, `border-border-default` aplicam esses tokens.

Referências: [src/styles/tokens.css](src/styles/tokens.css#L1-L40), [tailwind.config.ts](tailwind.config.ts#L1-L120)

## 3) Classes e utilitários principais

- Padrões semânticos (usados pelo componente):
  - `bg-primary`, `text-primary`, `bg-bg-card`, `bg-bg-default`, `text-text-muted`, `text-text-body`, `border-border-default`.
  - Utilitários de layout e tipografia: `flex`, `grid`, `gap-*`, `rounded-*`, `p-*`, `uppercase`, `tracking-widest`, `font-extrabold`.

- Regras compostas definidas em `src/index.css` (`@layer components`):
  - `.card-surface` — superfície básica do cartão (background + border).
  - `.card-surface-interactive` — hover/elevação e transições para cartões interativos.
  - `.card-surface-elevated`, `.badge-*`, `.dashboard-hero-texture` e utilitários de impressão/`ticket-*`.

Referência: [src/index.css](src/index.css#L90-L140)

## 4) Componentes reutilizáveis relacionados

- `src/components/atomic/Card.tsx` exporta constantes usadas pelo projeto:
  - `CARD_BASE_CLASS = "card-surface rounded shadow-sm"`
  - `CARD_INTERACTIVE_CLASS = "card-surface-interactive rounded"`
  - `CARD_ELEVATED_CLASS`

- `Button` e `SidebarItem` aceitam ícones como `ReactNode` (prop `icon`) e os renderizam; `Icon.tsx` existe como wrapper SVG mínimo.

Referências: [src/components/atomic/Card.tsx](src/components/atomic/Card.tsx#L1-L40), [src/components/atomic/Button.tsx](src/components/atomic/Button.tsx#L1-L40), [src/components/atomic/Icon.tsx](src/components/atomic/Icon.tsx#L1-L20)

## 5) Padrão de ícones

- Biblioteca: `lucide-react` (imports como `CalendarPlus`, `Shield`, `CheckCircle`).
- Uso: componentes são usados diretamente no JSX, com props como `size` e `className`. Em menus/sidebars, um `iconMap` atribui componentes do Lucide às rotas.
- Observação: não há (ainda) um wrapper `UiIcon` que normalize `size`/`role`/`aria-hidden` globalmente.

Exemplos: [src/pages/OperationalDashboard.tsx](src/pages/OperationalDashboard.tsx#L1-L40), [src/components/layout/Sidebar.tsx](src/components/layout/Sidebar.tsx#L1-L80)

## 6) Responsividade e acessibilidade

- Responsividade: breakpoints `md:`, `lg:`, `xl:` controlam espaçamento e tamanhos (p.ex. ícone/colunas do grid).
- Acessibilidade: botões usam elementos semânticos (`button` / `a`) e classes de foco (`focus-ring`), mas a normalização de atributos ARIA em ícones não é consistente.

## 7) Recomendações práticas

1. Documentar `CARD_BASE_CLASS` e `CARD_INTERACTIVE_CLASS` em um README de componentes para referência rápida.
2. Criar um wrapper `UiIcon` que normalize `size`, `className`, `role` e `aria-hidden` e migrar gradualmente usos críticos (`Sidebar`, `Topbar`).
3. Verificar contraste nas combinações `bg-primary` + `text-*` para garantir acesso conforme WCAG.

## 8) Referências rápidas

- `src/styles/tokens.css` — definição das variáveis de cor.
- `tailwind.config.ts` — mapeamento dos tokens para classes Tailwind.
- `src/index.css` — regras de superfície e utilitários (`card-surface*`, `dashboard-hero-texture`).
- `src/components/atomic/Card.tsx` — constantes `CARD_*` usadas pelo JSX.
- `src/components/atomic/Icon.tsx`, `Button.tsx`, `Sidebar.tsx` — padrões de uso de ícones.

---

Arquivo reescrito e organizado com base no conteúdo de `src/`.

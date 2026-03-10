# GUIA UNICO OFICIAL - PADRAO VISUAL E REFATORACAO DO /src

Status: documento canonico unico para UI no repositorio.
Escopo: cores, layout, icones, loading, cards, padrao de refatoracao e controle de qualidade.

Este guia substitui qualquer interpretacao difusa de padrao visual. Se houver conflito entre documentos, este arquivo prevalece.

## 1) Objetivo tecnico

Padronizar todo o `src/` com identidade militar institucional, evitando regressao de UX e divergencia entre telas.

Diretriz central:

- linguagem estrutural em azul/branco/cinza;
- cores de estado apenas para estado funcional real;
- reuso maximo de componentes base;
- zero duplicacao de regra visual ad-hoc.

## 2) Fontes de verdade obrigatorias

1. Tokens: `src/styles/tokens.css`
2. Exposicao Tailwind: `tailwind.config.ts`
3. Superficies de card: `src/index.css` (`card-surface*`) e `src/components/atomic/Card.tsx`
4. Icone padrao: `src/components/atomic/AppIcon.tsx`
5. Loading full page: `src/components/FullPageLoading.tsx`

Regra absoluta: antes de criar estilo/componente novo, provar que nao existe equivalente reutilizavel nesses pontos.

## 3) Contrato visual do projeto

### 3.1 Paleta estrutural permitida

Uso estrutural (cabecalhos, cards, navegacao, secoes, containers):

- `primary`, `secondary`
- `bg-default`, `bg-card`
- `text-body`, `text-muted`, `text-inverted`
- `border-default`

Uso de estado (somente semantica funcional):

- `success`, `error` (e variantes de opacidade)
- `red-*` deve ser migrado para token semantico `error` equivalente

Proibido como linguagem principal da pagina:

- `amber`, `emerald`, `violet`, `sky`, `yellow`, `purple` em blocos estruturais.

#### Hierarquia obrigatoria de cores de texto

1. Conteudo principal:

- texto de titulo e conteudo primario: `text-body`

2. Conteudo de apoio:

- descricao, ajuda, metadata, placeholders: `text-muted`

3. Conteudo sobre fundo escuro/primario:

- texto principal: `text-inverted`
- texto de apoio: `text-inverted/80` ou `text-white/80` quando o bloco for legado em `text-white`

4. Estados funcionais:

- sucesso: `text-success` ou combinacao semantica equivalente do tema
- erro/bloqueio: `text-error` ou combinacao semantica equivalente do tema

Regra:

- `text-primary` nao deve substituir texto corrido; usar apenas para CTA, links e destaque de acao
- proibido usar cor de estado (`success/error`) para texto estrutural de secao

### 3.2 Contrato de icones

Biblioteca unica: `lucide-react`.

Renderizacao padrao:

- sempre via `AppIcon` (nao usar `<IconLucide size=... className=...>` direto)
- obrigatorio migrar para `AppIcon` em todo arquivo alterado durante refatoracao

Tamanhos semanticos:

- `xs`: apoio textual
- `sm`: listas densas
- `md`: botoes e acoes principais
- `lg`: destaque

Hierarquia obrigatoria de tamanhos (deve seguir em todas as paginas):

1. Navegacao global (Sidebar/Topbar):

- item de menu e icone de acao: `md`
- icone de apoio secundario: `sm`

2. Titulos e cabecalhos de secao:

- icone ao lado do titulo de secao: `md`
- icone de destaque em hero/cartao principal: `lg`

3. Tabelas, listas e linhas densas:

- icones de linha/coluna/acao compacta: `sm`
- icones inline em texto auxiliar: `xs`

4. Botoes:

- botao primario/secundario de pagina: `md`
- botao pequeno/compacto: `sm`

5. Feedback de estado:

- icone em badge/chip de estado: `sm`
- icone em bloco de alerta/feedback principal: `md`

Regra de consistencia:

- o mesmo papel visual deve manter o mesmo tamanho em toda a aplicacao
- proibido usar `lg` em contexto de linha densa
- proibido reduzir para `xs` em acao principal
- qualquer excecao deve ser funcional e documentada no PR

Tons semanticos:

- `default`, `muted`, `primary`, `inverse`, `danger`

Padrao unico de estilo de icone:

- cor, tamanho e tone devem ser semanticos e consistentes por contexto
- proibido variar tamanho/cor de icone sem regra funcional
- toda pagina deve manter o mesmo padrao de tamanhos (`xs|sm|md|lg`) para papeis equivalentes

#### 3.2.1 Componente `AppIcon` (contrato obrigatorio)

- Todos os ícones devem ser renderizados via componente wrapper `AppIcon` localizado em `src/components/atomic/AppIcon.tsx`.
- Assinatura mínima (props): `icon` (componente Lucide), `size?: 'xs' | 'sm' | 'md' | 'lg' | number`, `className?: string`, `ariaLabel?: string`, `decorative?: boolean`.
- Comportamento de acessibilidade:
  - `decorative=true` → `aria-hidden="true"` e sem `role`/`aria-label`.
  - caso contrário → `role="img"` e `aria-label` a partir de `ariaLabel` (ou texto adjacente visível).
- `AppIcon` deve mapear tokens semânticos de tamanho (`xs|sm|md|lg`) para pixels padrão do projeto (ver seção 3.2.4).

#### 3.2.2 Export central de ícones

- Criar `src/icons/index.ts` que re-exporte apenas os ícones aprovados do `lucide-react`.
- Importar ícones sempre de `@/icons` (ou `src/icons`) em vez de `lucide-react` diretamente.
- Novo ícone só pode ser adicionado exportando-o em `src/icons/index.ts` e documentando o motivo no PR.

#### 3.2.3 Proibição de import direto e regra ESLint

- Proibir imports diretos de `lucide-react` usando ESLint rule `no-restricted-imports`.
- Exemplo de entrada ESLint (adicionar em `eslint.config.js`):

```js
rules: {
	'no-restricted-imports': ['error', {
		paths: [{ name: 'lucide-react', message: 'Importe ícones via src/icons em vez de lucide-react.' }]
	}]
}
```

#### 3.2.4 Padrão de tamanhos (tokens)

- Mapear tamanhos semânticos para valores-padrão:
  - `xs` → `14` (icon inline / texto auxiliar)
  - `sm` → `18` (listas densas, badges)
  - `md` → `24` (botoes e acoes principais)
  - `lg` → `32` (hero / destaque de cartao)
- Estes valores são defaults do `AppIcon`, mas o wrapper aceita valor numérico quando necessário.

#### 3.2.5 Uso em cards e responsividade

- Em estruturas como `actionCards`, mantenha `icon`, `iconBg` e `iconColor` no objeto de configuração e renderize via `AppIcon`:

```ts
// src/pages/Example.tsx
import AppIcon from '@/components/atomic/AppIcon';
import { CalendarPlus } from '@/icons';

<div className="...">
	<div className="icon-wrapper">
		<AppIcon icon={CalendarPlus} size="md" className="text-primary" ariaLabel="Próximo evento" />
	</div>
</div>
```

- Para responsividade, controle visual pelo `className` (Tailwind) e mantenha os tamanhos semânticos consistentes (`sm` → `md` nas telas maiores somente com justificativa funcional).

#### 3.2.6 Acessibilidade e semântica

- Nunca transmitir informação crítica apenas pelo ícone; sempre haver rótulo textual ou `aria-label` claro.
- Ícones decorativos: `decorative=true`. Ícones que representam estado/ação: fornecer `ariaLabel` e, preferencialmente, texto visível.

#### 3.2.7 Checklist de migração (por arquivo alterado)

1. Adicionar `import { X } from '@/icons'` em vez de `lucide-react`.
2. Substituir usos diretos por `<AppIcon icon={X} size="md" ariaLabel="..." />` conforme necessário.
3. Validar cores usando tokens (`text-primary`, `text-muted`, `bg-primary/5`, etc.).
4. Rodar `yarn lint` e `npx tsc --noEmit`.
5. Teste visual em mobile/desktop e marque no PR que a migração segue o contrato (tamanhos, cores e acessibilidade).

#### 3.2.8 Exceções e documentação

- Qualquer exceção ao contrato (novo tamanho, estilo ou uso de outra biblioteca) deve ser documentada no PR com justificativa funcional e aprovada pelo time de UX.

### 3.3 Contrato de loading

Obrigatorio:

- pagina/rota inteira: `FullPageLoading`
- secao parcial/lista: `PageSkeleton` ou loading local controlado

Proibido:

- retorno principal da tela com texto cru `Carregando...`

### 3.4 Contrato de layout

Obrigatorio:

- shell principal de pagina: `Layout`
- superficies: `CARD_BASE_CLASS`, `CARD_ELEVATED_CLASS`, `CARD_INTERACTIVE_CLASS` ou `card-surface*`
- manter padrao de container por dominio (nao inventar novo grid/container por tela)

Proibido:

- mistura de linguagens concorrentes na mesma pagina (ex.: hero institutional + card aleatorio de outro estilo)

### 3.5 Contrato oficial de responsividade (container + grid)

Esta secao e obrigatoria para todas as rotas `app/*` e existe para eliminar o problema recorrente de paginas com comportamento diferente entre mobile/tablet/desktop.

#### 3.5.1 Breakpoints oficiais do projeto

Fonte: `src/hooks/useResponsive.ts`.

- `mobile`: `< 768`
- `tablet`: `>= 768 e < 1024`
- `desktop`: `>= 1024`

Regra: nenhuma pagina deve inventar breakpoints diferentes para layout principal.

#### 3.5.2 Responsividade macro (shell)

Fonte: `src/components/layout/Layout.tsx`.

Comportamento obrigatorio:

1. Sidebar:

- mobile/tablet: drawer com overlay
- desktop: fixa

2. Offset de conteudo quando sidebar fixa:

- `md:ml-64 lg:ml-72`

3. Padding de area principal:

- `p-4 sm:p-6 lg:p-10`

Regra: paginas nao devem compensar sidebar com margem manual adicional fora do `Layout`.

#### 3.5.3 Padrao de container por pagina

Container de conteudo recomendado para paginas de app:

- base: `mx-auto`
- largura: `max-w-6xl` (fluxos operacionais) ou `max-w-5xl` (conteudo/documentacao)
- padding horizontal: `px-4 sm:px-6`
- em desktop grande, permitir `lg:px-0` quando ja houver espacamento suficiente do `Layout`

Regra: nao usar largura fluida total sem justificativa de dominio.

#### 3.5.4 Padrao de grid responsivo

Para telas de fluxo com painel lateral (ex.: agendamentos):

1. Mobile primeiro:

- `grid-cols-1`

2. Desktop com composicao:

- `lg:grid-cols-12`
- principal: `lg:col-span-8`
- lateral: `lg:col-span-4`

Para dashboards:

- cards de acao: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`
- secoes inferiores: `flex-col` -> `xl:flex-row`

Regra: o layout deve densificar progressivamente com `sm/md/lg/xl`, nunca trocar radicalmente a estrutura entre breakpoints.

#### 3.5.5 Escala tipografica e espacamento

Padrao minimo:

- titulos principais: `text-xl md:text-2xl lg:text-3xl`
- gaps: `gap-6 sm:gap-8`
- paddings internos de card/bloco: `p-4 sm:p-6`

Regra: evitar saltos de escala abruptos (ex.: `text-sm` para `text-4xl` sem etapa intermediaria).

#### 3.5.5.1 Hierarquia obrigatoria de tamanhos de texto

Aplicar esta escala em todas as paginas refatoradas:

1. Titulo principal de pagina (H1):

- `text-xl md:text-2xl lg:text-3xl`

2. Titulo de secao (H2/H3):

- H2/H3 de secao com conteudo principal abaixo: `text-lg md:text-xl`
- rotulo institucional curto de contexto: `text-sm` uppercase
- proibido alternar os dois padroes para o mesmo papel na mesma pagina

3. Corpo principal:

- `text-sm` ou `text-base`

4. Texto auxiliar/metadado:

- `text-xs` ou `text-sm` (preferir `text-xs` apenas quando realmente auxiliar)

5. Labels compactos (badge/chip/coluna tecnica):

- `text-[10px]` somente para rotulo curto, nunca para paragrafo

Regras de consistencia:

- o mesmo papel textual deve manter o mesmo tamanho entre paginas
- nao misturar multiplos tamanhos para o mesmo nivel de titulo na mesma tela
- evitar usar `text-[10px]` em blocos de leitura continua

#### 3.5.6 Estados e legenda responsiva

1. Legendas e badges devem quebrar/empilhar sem overflow.
2. Botoes de acao em mobile devem ocupar largura util quando necessario.
3. Linhas de apoio devem usar `text-xs` ou `text-sm`, nunca comprimir com `text-[10px]` para texto principal.

#### 3.5.7 Anti-padroes de responsividade (bloqueio)

Bloquear alteracao quando houver:

1. pagina sem `Layout` em rota `app/*`;
2. container divergente sem justificativa (`max-w` aleatorio);
3. breakpoints hardcoded fora do padrao do projeto;
4. overflow horizontal em mobile;
5. sidebar/offset corrigidos manualmente na pagina;
6. dois grids concorrentes para o mesmo bloco sem necessidade.

#### 3.5.8 Checklist obrigatorio por pagina refatorada

Antes de fechar cada pagina:

1. usa `Layout` como shell;
2. usa container padrao (`max-w-*` + `px-4 sm:px-6`);
3. mobile com `grid-cols-1` ou `flex-col` funcional;
4. desktop com densificacao progressiva (`lg`/`xl`);
5. sem overflow horizontal em 360px;
6. sem textos truncados indevidos;
7. lint limpo.

#### 3.5.9 Referencias praticas para copiar padrao

1. `src/pages/Scheduling.tsx`

- exemplo de grid `1 -> 12 colunas` com `8/4` e legendas funcionais.

2. `src/pages/OperationalDashboard.tsx`

- exemplo de hero + cards + composicao progressiva `sm/lg/xl`.

3. `src/components/layout/Layout.tsx`

- exemplo de comportamento macro de responsividade do app.

## 4) Metodo oficial de refatoracao (passo a passo)

### Passo 1 - Diagnostico orientado

Rodar buscas no `src/`:

- cores estruturais fora de contrato: `amber|emerald|violet|sky|yellow|purple|dark:`
- estados funcionais para auditoria (nao para remocao cega): `success|error`
- icones nao padronizados: uso direto de `lucide-react` no JSX
- loading fragmentado: `Carregando...|Carregando…|Loader2|animate-spin`

Busca complementar de migracao semantica:

- localizar uso legado de vermelho literal: `red-`

Regra de migracao semantica de cor:

- se houver `red-*` em estado funcional, migrar para token semantico `error` equivalente
- manter `red-*` apenas quando houver limitacao tecnica comprovada no token e aprovacao explicita no PR

### Passo 2 - Classificacao da ocorrencia

Cada match deve ser classificado como:

- `Estado funcional` -> manter semantica de estado
- `Visual estrutural` -> migrar para tokens estruturais

Regra de decisao obrigatoria:

- `success/error` em feedback, disponibilidade, confirmacao, erro, bloqueio: permitido
- `success/error` em cabecalho institucional, superficie principal, navegacao, bloco decorativo: proibido

### Passo 3 - Refatorar sem lote cego

Ordem obrigatoria:

1. Layout base e componentes compartilhados
2. Paginas de maior exposicao de usuario
3. Fluxos administrativos

Regra:

- aplicar mudanca pequena por arquivo/lote logico;
- validar antes de seguir para proximo lote.

Ordem obrigatoria de migracao de icones (legado -> padrao):

1. `src/components/layout/*` (topbar/sidebar/shell)
2. `src/pages/*` de maior exposicao de usuario
3. restante das paginas
4. componentes administrativos de menor exposicao

### Passo 4 - Validacao

Checklist tecnico por lote:

1. `yarn lint`
2. problemas do arquivo alterado = zero
3. validacao visual em desktop e mobile
4. confirmar que nao voltou cor fora de contrato no bloco alterado

## 5) DRY / KISS / YAGNI obrigatorios para UI

1. DRY: padrao visual definido uma vez, reutilizado em todo lugar.
2. KISS: preferir a menor alteracao que corrige inconsistencias.
3. YAGNI: nao criar abstracao "para talvez usar depois".
4. Nao criar novo utilitario se ja existir equivalente em `atomic/`, `index.css` ou utilitarios base.
5. Padrao unico: todo arquivo alterado deve sair com cores, tamanhos e estilos alinhados ao contrato deste guia.
6. NUNCA repetir algo ja criado: metodo/propriedade deve existir em um unico lugar e ser reaproveitado.
7. Evitar complexidade desnecessaria: se pode ser simples, deve ser simples.
8. So implementar quando houver uso real imediato.
9. Antes de criar/refatorar, pesquisar no `src/` por equivalente existente.
10. Nao gerar testes sem solicitacao explicita.
11. Manter conexoes e contratos existentes com banco de dados/RPCs.
12. Toda alteracao visual deve terminar com refinamento visual final aderente ao conceito do projeto.

## 6) Registro de mudancas do guia

Para manter este guia normativo e objetivo, nao registrar historico detalhado de refatoracoes aqui.
Historico operacional deve ficar em documento de acompanhamento separado quando necessario.

## 7) Regras de bloqueio (nao pode aprovar PR se houver)

Bloquear PR quando houver:

1. cor estrutural fora do contrato sem justificativa funcional;
2. loading full-page sem `FullPageLoading`;
3. icone novo fora de `AppIcon` em refatoracao;
4. nova variacao de card fora de `CARD_*`/`card-surface*`;
5. texto redundante/ornamental sem valor de UX.
6. uso de `red-*` sem justificativa tecnica aprovada;
7. arquivo alterado sem aderencia a hierarquia de tamanhos de icone e texto.

## 8) Checklist final de aceite

Considerar concluido somente se todos forem verdadeiros:

1. toda estrutura usa azul/branco/cinza institucional;
2. `success/error` aparecem apenas em estado funcional;
3. sem duplicacao visual ad-hoc introduzida;
4. lint limpo apos cada lote;
5. telas alteradas consistentes entre desktop e mobile;
6. componentes-base reutilizados corretamente.
7. arquivo alterado com icones via `AppIcon` no contexto aplicavel;
8. arquivo alterado com hierarquia de texto e cores semanticas consistente.

## 9) Politica de manutencao deste guia

1. Este arquivo e o unico documento oficial de padrao visual/refatoracao.
2. Qualquer nova regra deve entrar aqui, com criterio objetivo.
3. Nao manter checklist paralelo em outro documento para o mesmo assunto.
4. Sempre registrar aqui as refatoracoes estruturais concluidas para preservar contexto.

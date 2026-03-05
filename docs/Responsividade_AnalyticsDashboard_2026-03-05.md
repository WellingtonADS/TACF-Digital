# Problemas de Responsividade - AnalyticsDashboard

Arquivo analisado: `src/pages/AnalyticsDashboard.tsx`
Data: 2026-03-05

## Achados principais

1. Grid de presets com 4 colunas fixas no mobile

- Linha: `src/pages/AnalyticsDashboard.tsx:608`
- Código: `grid grid-cols-4 ... w-full`
- Efeito: botões de período ficam apertados e podem estourar texto em telas menores.

2. Barra de tabs sem quebra, apenas scroll horizontal escondido

- Linhas: `src/pages/AnalyticsDashboard.tsx:656`, `src/pages/AnalyticsDashboard.tsx:684`
- Código: `overflow-x-auto no-scrollbar` + `flex-shrink-0`
- Efeito: o usuário perde indicação visual de que há conteúdo fora da tela.

3. Tabela "Revalidacao Pendente" com largura mínima alta

- Linha: `src/pages/AnalyticsDashboard.tsx:938`
- Código: `min-w-[860px]`
- Efeito: recorte/scroll lateral constante no mobile; colunas finais somem no viewport inicial.

4. Tabela "Desempenho por Unidade" também com largura mínima alta

- Linha: `src/pages/AnalyticsDashboard.tsx:1087`
- Código: `min-w-[760px]`
- Efeito: mesmo problema de overflow horizontal em telas estreitas.

5. Campo de busca sem largura mínima de conforto no bloco de ações

- Linhas: `src/pages/AnalyticsDashboard.tsx:874`, `src/pages/AnalyticsDashboard.tsx:883`
- Código: `w-full sm:w-auto`
- Efeito: em larguras intermediárias, o campo pode ficar estreito demais ao lado de botões.

6. Filtros sem regra específica para stack em telas pequenas

- Linha: `src/pages/AnalyticsDashboard.tsx:917`
- Código: `flex flex-wrap items-end gap-4`
- Efeito: agrupamento irregular e quebra visual quando há muitos filtros ativos.

## Correções sugeridas (curtas)

1. Presets: trocar para `grid-cols-2` no mobile e `sm:flex` a partir de `sm`.
2. Tabs: manter scroll, mas exibir scrollbar fina ou gradiente lateral de indicação.
3. Tabelas: criar versão "cards" para `sm` e manter tabela apenas em `md+`.
4. Busca/Filtros: definir `min-w` útil (`sm:min-w-[220px]`) e stack vertical em `sm`.
5. Ações dos filtros: priorizar layout `w-full` no mobile com botões em linha separada.

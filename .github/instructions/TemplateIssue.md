📋 Template de Issue / Task
Markdown
### ISSUE-[ID]: [Título Curto e Descritivo]

**Type:** [Feature / Bugfix / Refactor / Security / Chore]
**Priority:** [Low (P3) / Medium (P2) / High (P1) / Critical (P0)]
**Effort Estimate:** [X] Story Points

**Contexto Técnico:**
* Estado Atual: ...
* Problema/Risco Identificado: ...

**Objetivo:**
**Especificações Técnicas:**
* **[Componente/Lógica Principal]:** [Ex: Adicionar interceptor no axios...]
* **[Banco de Dados/Store]:** [Ex: Criar nova coluna ou estado global...]
* **[UI/UX]:** [Ex: Bloquear botão enquanto carrega...]

**Critérios de Aceite:**
* [ ] [Comportamento esperado 1]
* [ ] [Comportamento esperado 2]
* [ ] [Caso de borda coberto]

**Matriz de Impacto:**
* **CRIAR:** `src/...`
* **MODIFICAR:** `src/...`
* **DELETAR:** `src/...`

💡 Dicas para manter o padrão alto (como no seu exemplo)
Contexto Técnico vs. Objetivo: Use o Contexto para explicar o "passado" (o que está quebrado ou incompleto) e o Objetivo para o "futuro" (o que o sucesso dessa task traz de valor).

Matriz de Impacto: Essa seção é excelente para estimar complexidade. Se você listar muitos arquivos em "MODIFICAR", talvez a task esteja grande demais e precise ser quebrada (Split).

Especificações Técnicas: Tente manter os nomes das funções ou hooks sugeridos (ex: useDriverPermissions), pois isso economiza tempo de decisão na hora de codar.

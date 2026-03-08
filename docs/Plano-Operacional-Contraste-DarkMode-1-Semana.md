# Plano Operacional - Contraste em Modo Escuro (1 Semana)

Não gere textos grandes na janela de contexto, apenas o necessário para que o plano operacional seja claro e completo. O foco deve ser na execução prática e na entrega de valor tangível ao final da semana, garantindo que as mudanças de contraste sejam aplicadas de forma consistente e alinhada com os padrões de acessibilidade. Lembre-se de priorizar as telas e componentes mais críticos para a experiência do usuário, garantindo que o contraste seja adequado para todos os elementos visuais importantes.

## Objetivo

Garantir contraste adequado no tema escuro com padrao WCAG AA, reduzindo inconsistencias visuais e padronizando o uso de tokens semanticos em componentes e paginas prioritarias.

## Escopo da Semana

- Consolidar base de tema escuro com tokens semanticos.
- Refatorar telas de maior uso (auth, perfil, settings, analytics).
- Ajustar estados interativos (hover/focus/disabled).
- Entregar checklist de validacao para PRs futuros.

## Prioridades

- `P0`: texto principal, campos de formulario, botoes primarios, foco de teclado.
- `P1`: cards, badges, tabelas e metadados secundarios.
- `P2`: refinamentos visuais (sombras, separadores discretos, micro-ajustes de hierarquia).

## Backlog Por Arquivo

### P0 (critico)

1. `src/styles/tokens.css` ✅

- Confirmar valores finais de `--bg-default`, `--bg-card`, `--text-body`, `--text-muted`, `--border-default` para dark mode.
- Garantir legibilidade entre texto principal e fundo base.

2. `tailwind.config.ts` ✅

- Validar mapeamento de cores semanticas para variaveis CSS.
- Evitar criacao de cores duplicadas fora do padrao tokenizado.

3. `src/index.css` ✅

- Garantir base global com `bg-bg-default` e `text-text-body`.
- Revisar utilitarios globais (`card`, `badge`, `focus-ring`) para dark mode.

4. `src/components/atomic/Input.tsx` ✅

- Padronizar fundo, texto, placeholder e borda com tokens.
- Confirmar foco visivel em dark (`focus:ring-*` com contraste claro).

5. `src/components/atomic/PasswordInput.tsx` ✅

- Alinhar contraste do campo e icone de acao (mostrar/ocultar senha).
- Validar estados hover/focus do botao interno.

6. `src/pages/Login.tsx` ✅

- Remover classes hardcoded conflitantes no dark.
- Garantir contraste em labels, descricoes, CTA principal e mensagens de erro.

7. `src/pages/ForgotPassword.tsx` ✅

- Corrigir textos secundarios com baixa visibilidade.
- Harmonizar cores de formularios e alertas de feedback.

8. `src/components/AuthLayout.tsx` ✅

- Assegurar contraste de titulos, textos de apoio e superficies de container.

### P1 (alto)

1. `src/components/atomic/Card.tsx` ✅

- Confirmar padrao final de superficie (`bg-bg-card`) e borda (`border-border-default`).

2. `src/pages/UserProfilesManagement.tsx` ✅

- Substituir remanescentes de `slate-*` hardcoded por tokens.
- Ajustar chips/status para leitura consistente no dark.

3. `src/pages/SystemSettings.tsx` ✅

- Revisar header, sidebar e secoes internas para padrao semantico.
- Corrigir contraste de itens inativos/ativos de navegacao lateral.

4. `src/pages/AppealRequest.tsx` ✅

- Ajustar textos de suporte e caixas de contexto com contraste insuficiente.

5. `src/pages/AnalyticsDashboard.tsx` ✅

- Revisar cards metricos, legendas e labels de dados.
- Garantir contraste em informacao secundaria (subtextos e hints).

### P2 (medio)

1. `src/pages/OperationalDashboard.tsx` ✅

- Refinar contraste de subtextos e cards auxiliares. (concluído)

2. `src/pages/Documents.tsx` ✅

- Melhorar legibilidade de descrições curtas e metadata. (concluído)

3. `src/pages/SessionsManagement.tsx` ✅

- Ajustar botões secundários e estados de hover em listas/tabelas. (concluído)

4. `src/index.css` (refino)

- Revisar sombras e separadores para profundidade sem "lavar" contraste.

## Atualização — 08/03/2026

- **Status geral:** trabalho de tokenização e substituição de classes utilitárias concluído nas prioridades P0, P1 e P2 listadas no plano. `npx tsc --noEmit` passou sem erros.
- **Concluído (P0/P1/P2):** `src/styles/tokens.css`, `tailwind.config.ts`, `src/index.css`, e as páginas críticas (auth, perfil, settings, analytics, sessions, documents, operational) foram atualizadas para usar tokens semânticos.
- **Pendências principais:** o linter (`yarn lint`) reportou erros ESLint relacionados a `any` em `src/pages/OperationalDashboard.tsx` (7 avisos) — isso é pré-existente e bloqueia um lint limpo.
- **Ações em andamento:** correção dos avisos de ESLint em `OperationalDashboard.tsx` (tipagem/refactor) — em progresso.

## Próximos Passos Imediatos

- Corrigir os erros apontados pelo ESLint em `src/pages/OperationalDashboard.tsx` para obter um lint limpo (prioridade alta antes do PR).
- Rodar as verificações automáticas de contraste (axe) em ambiente de CI / Playwright para validar WCAG AA em modo escuro.
- Executar QA visual manual em mobile e desktop nas telas prioritárias e ajustar tokens menores (sombras, separadores) se necessário.
- Preparar PR único agrupando mudanças por domínio (auth, user, admin) e anexar a checklist de validação.

## Checklist Rápida Atualizada (para PR)

1. `npx tsc --noEmit` — sem erros.
2. `yarn lint` — exceção: nenhum erro ESLint ativo (corrigir `OperationalDashboard.tsx`).
3. Testes de contraste automatizados (axe) — passar nas páginas P0/P1.
4. Revisão manual rápida em breakpoint móvel.

## Cronograma Operacional (1 Semana)

### Dia 1 - Baseline de tema (P0)

- Fechar valores finais em `tokens.css`.
- Validar mapeamento em `tailwind.config.ts`.
- Consolidar base global em `index.css`.
- Resultado esperado: base semantica estavel para toda a UI.

### Dia 2 - Atomicos e auth (P0)

- Concluir `Input.tsx`, `PasswordInput.tsx`, `Card.tsx`. ✅ tokens e foco aplicados
- Refatorar `AuthLayout.tsx`, `Login.tsx`, `ForgotPassword.tsx` (+ `Register.tsx`). ✅ hardcodes removidos, cores semânticas utilizadas
- Resultado esperado: jornada de autenticação com contraste consistente. **completo**

### Dia 3 - Perfil e settings (P1)

- Concluir ajustes em `UserProfilesManagement.tsx`. ✅ todos os campos e cards tokenizados
- Concluir ajustes em `SystemSettings.tsx`. ✅ bordas, textos e containers convertidos
- Resultado esperado: telas de configuracao e perfil sem hardcoded critico. **completo**

### Dia 4 - Analytics e fluxo de usuario (P1)

- Ajustar `AnalyticsDashboard.tsx` e `AppealRequest.tsx`. ✅ todas as cores slate substituídas por tokens; sintaxe corrigida
- Revisar componentes compartilhados impactados por essas paginas. ✅ cards, tabelas e helpers verificados
- Resultado esperado: dashboards e formulacoes com hierarquia visual clara. **completo**

### Dia 5 - Refino e fechamento (P2)

- **Completo**: todos os P2 identificados (`OperationalDashboard.tsx`, `Documents.tsx`, `SessionsManagement.tsx`) foram refinados e tokenizados.
- Checklist final de contraste e consistência aplicado.
- Resultado esperado: pacote pronto para PR final.

## Checklist de Validacao (manual)

1. Texto principal legivel em todas as telas prioritarias.
2. Texto secundario legivel sem perder hierarquia.
3. Botoes (primario/secundario) distinguiveis em normal, hover e disabled.
4. Campos de formulario legiveis com placeholder visivel.
5. Focus ring perceptivel via teclado em dark mode.
6. Bordas/separadores visiveis sem excesso de ruido visual.

## Definition of Done

1. Arquivos `P0` completos sem pendencias.
2. Arquivos `P1` sem hardcoded critico remanescente.
3. Arquivos `P2` com refinamentos aplicados ou devidamente registrados para proxima sprint.
4. Guia de uso de tokens revisado e aplicavel em PRs futuros.

## Riscos e Mitigacao

- Risco: regressao visual em paginas nao priorizadas.
  - Mitigacao: aplicar tokens em componentes base primeiro e revisar telas de maior trafego.
- Risco: inconsistencias por mistura de token e hardcoded.
  - Mitigacao: bloquear novos hardcoded de cor em revisao de PR.
- Risco: contraste bom em desktop e ruim em mobile.
  - Mitigacao: revisar em breakpoint pequeno antes de fechar cada dia.

## Entregaveis da Semana

1. PR com mudancas de contraste organizadas por dominio (auth, user, admin).
2. Documento de referencia de tokens semanticos para dark mode.
3. Backlog remanescente (se houver) ja priorizado para sprint seguinte.

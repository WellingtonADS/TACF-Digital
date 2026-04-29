# Operacao, Build e Qualidade

## Comandos principais

- desenvolvimento: `yarn dev`
- lint: `yarn lint`
- build: `yarn build`
- preview: `yarn preview`
- testes de integracao (Vitest): `yarn test:integration`
- verificacao SQL estrutural: `yarn db:check`

## Observacao de branch

Nesta branch, `db:apply` e `db:seed` estao definidos em `package.json`, mas dependem de `scripts/db/applyMigrations.cjs`, ausente no workspace atual.

## Fluxo recomendado de entrega

1. Implementar alteracao.
2. Rodar lint e typecheck.
3. Rodar testes de integracao.
4. Validar impacto em rotas e permissoes quando houver mudanca de acesso.
5. Atualizar documentacao tecnica/wiki quando houver alteracao estrutural.

## Politica de mudancas sensiveis

- Nao alterar RLS/schema sem revisao humana.
- Evitar expor dados sensiveis no frontend.
- Priorizar correcoes de autorizacao no backend (RLS/RPC) e refletir no frontend.

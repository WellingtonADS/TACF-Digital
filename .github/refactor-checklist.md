# Refactor Checklist — Frontend Conformity

Checklist objetivo para o epic `refactor/frontend-conformity-2026-02`.

- [x] Criar plano em `.github/REFACTOR_PLAN.md`
- [x] Criar checklist (este arquivo)
- [x] Criar stubs de issues em `.github/issues/`
- [x] Criar branch `refactor/frontend-conformity-2026-02` e commitar artefatos iniciais

Sprint-level tasks:

- [ ] Tipagem estrita: atualizar `src/services/*` e `supabase` RPC wrappers
- [ ] Extrair hooks: `useSessions`, `useBookings`, `useAuth` onde aplicável
- [ ] Migrar ícones para `src/components/ui/icons.tsx` (MUI wrapper)
- [ ] Remover `any` e padrões inseguros (ex.: setState in effect)
- [ ] Lazy-load heavy libs: `jspdf`, `jspdf-autotable`
- [ ] Testes: adicionar/atualizar testes Vitest para hooks e serviços
- [ ] Lint & types: `yarn lint` e `npx tsc --noEmit`
- [ ] Abrir PR com descrição, checklist e instruções de teste

Deployment / QA notes:

- Rodar `yarn && yarn lint && npx tsc --noEmit && yarn test` antes do PR
- Documentar mudanças que demandem migrações ou RLS updates

# Status - Padrao "Tabela em md+ / Cards no mobile"

Data: 2026-03-05

## Ajustado nesta rodada

- `src/pages/AccessProfilesManagement.tsx`
- `src/pages/PersonnelManagement.tsx`
- `src/pages/ReschedulingManagement.tsx`
- `src/pages/SessionBookingsManagement.tsx`
- `src/pages/SystemSettings.tsx`

## Ja estava com fallback mobile antes

- `src/pages/AnalyticsDashboard.tsx`
- `src/pages/AuditLog.tsx`
- `src/pages/ResultsHistory.tsx`
- `src/pages/SessionsManagement.tsx` (forca cards em viewport compacto)

## Observacao

Ainda existem tabelas em `md+` com `min-w[...]`, o que e esperado no novo padrao.
O requisito agora e: em `<md`, renderizar cards; em `md+`, tabela.

## Validacao

- `yarn lint`: ok
- `npx tsc --noEmit`: ok

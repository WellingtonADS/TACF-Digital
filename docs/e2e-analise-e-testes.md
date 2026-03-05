# E2E — Análise das páginas e teste funcional (MVP)

## Escopo aplicado

- Estratégia de autenticação: login real via Supabase.
- Perfis cobertos: `user` e `admin`.
- Abordagem DRY: elementos repetidos centralizados em Page Objects.
- YAGNI: foco apenas em páginas e fluxos operacionais visíveis no código atual.
- Responsividade: validação em `375px` (mobile) e `1440px` (desktop).

## Mapeamento de páginas (src/pages)

### Páginas públicas priorizadas

- `Login.tsx`
- `Register.tsx`
- `ForgotPassword.tsx`

### Páginas operacionais priorizadas (user)

- `OperationalDashboard.tsx`
- `Documents.tsx`

### Páginas operacionais priorizadas (admin)

- `AdminDashboard.tsx`
- `SessionsManagement.tsx`

### Páginas não priorizadas no MVP E2E (YAGNI)

- Fluxos com marcação de desenvolvimento/placeholder (ex.: recurso e partes de reagendamento avançado).

## Auditoria DRY (elementos centralizados)

Componentes repetidos entre páginas e utilizados nos testes:

- `Layout` (estrutura geral)
- `Sidebar` (menu lateral por perfil)
- `Topbar` (controle mobile)
- `Breadcrumbs` (navegação contextual)

Centralização E2E criada em:

- `tests/e2e/page-objects/AuthPage.ts`
- `tests/e2e/page-objects/AppShell.ts`

## Testes implementados

- `tests/e2e/auth-smoke.spec.ts`
  - Renderização e identidade visual básica das telas públicas.
- `tests/e2e/route-guards.spec.ts`
  - Redirecionamento para login em rotas protegidas sem sessão.
- `tests/e2e/user-smoke.spec.ts`
  - Login user + navegação principal + responsividade + logout.
- `tests/e2e/admin-smoke.spec.ts`
  - Login admin + dashboard + navegação para turmas + responsividade + logout.

## Código do teste funcional (exemplo)

```ts
import { expect, test } from "@playwright/test";
import { AppShell } from "./page-objects/AppShell";
import { AuthPage } from "./page-objects/AuthPage";
import { getCredentials } from "./support/credentials";

test.describe("User smoke", () => {
  test("deve autenticar usuário, navegar no menu e manter layout responsivo", async ({
    page,
  }) => {
    const authPage = new AuthPage(page);
    const shell = new AppShell(page);
    const credentials = getCredentials("user");

    await authPage.login(credentials.email, credentials.password);
    await expect(page).toHaveURL(/\/app(\/)?$/);
    await expect(
      page.getByText("Seja bem-vindo ao portal de agendamento do HACO"),
    ).toBeVisible();
    await shell.assertResponsiveShell();

    await shell.navigateBySidebar("Documentos");
    await expect(page).toHaveURL(/\/app\/documentos$/);
    await expect(
      page.getByRole("heading", { name: "Documentos e Normas" }),
    ).toBeVisible();
    await shell.assertBreadcrumbVisible();

    await shell.navigateBySidebar("Dashboard");
    await expect(page).toHaveURL(/\/app(\/)?$/);
    await expect(
      page.getByText("Seja bem-vindo ao portal de agendamento do HACO"),
    ).toBeVisible();

    await shell.logout();
  });
});
```

## Execução

Pré-requisitos (env):

- `E2E_USER_EMAIL`
- `E2E_USER_PASSWORD`
- `E2E_ADMIN_EMAIL`
- `E2E_ADMIN_PASSWORD`

Observação:

- Se as credenciais de `user` ou `admin` não estiverem definidas, os testes autenticados desse perfil são marcados como `skip` automaticamente; os smoke públicos e guardas continuam executando.

Comandos:

- `yarn test:e2e`
- `yarn test:e2e:headed`

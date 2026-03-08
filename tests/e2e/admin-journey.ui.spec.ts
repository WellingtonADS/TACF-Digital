import { expect, test } from "@playwright/test";
import {
  assertAdminDirectRouteAccess,
  assertAdminMenuNavigation,
  assertAdminShellVisible,
  closeMobileSidebar,
  openMobileSidebar,
} from "./support/adminJourneyAssertions";
import {
  ADMIN_DIRECT_ROUTE_SMOKE,
  ADMIN_MENU_CASES,
} from "./support/adminJourneyData";
import { loginAsAdmin, logout } from "./support/auth";

test.describe("Jornada admin E2E - fluxo e layout UI", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("desktop: navega menu admin com layout consistente", async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "desktop-1440",
      "Fluxo desktop restrito ao projeto desktop-1440.",
    );

    await assertAdminShellVisible(page);

    for (const routeCase of ADMIN_MENU_CASES) {
      await assertAdminMenuNavigation(page, routeCase);
    }
  });

  test("desktop: smoke de rotas administrativas diretas", async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "desktop-1440",
      "Smoke de rotas diretas restrito ao projeto desktop-1440.",
    );

    for (const route of ADMIN_DIRECT_ROUTE_SMOKE) {
      await assertAdminDirectRouteAccess(page, route);
    }
  });

  test("mobile: menu lateral abre e fecha mantendo acesso admin", async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "mobile-375",
      "Teste mobile restrito ao projeto mobile-375.",
    );

    await expect(
      page.getByRole("button", { name: "Abrir menu" }),
    ).toBeVisible();

    await openMobileSidebar(page);
    await page.getByRole("link", { name: "Visão Geral" }).click();
    await expect(page).toHaveURL(/\/app\/admin$/);

    await openMobileSidebar(page);
    await closeMobileSidebar(page);
  });

  test("logout admin encerra sessao e retorna ao login", async ({ page }) => {
    await assertAdminShellVisible(page);
    await logout(page);
    await expect(page.getByRole("button", { name: "ENTRAR" })).toBeVisible();
  });
});

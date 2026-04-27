import { expect, test, type Page } from "@playwright/test";
import { adminCredentials } from "./fixtures/auth";
import { LoginPage } from "./pages/LoginPage";

async function waitForPageReady(page: Page) {
  await expect(page.getByTestId("full-page-loading")).toHaveCount(0, {
    timeout: 60000,
  });
}

async function loginAsAdmin(page: Page) {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(adminCredentials.email, adminCredentials.password);
  await expect(page).toHaveURL(/\/app(\/admin)?/, { timeout: 15000 });
  await waitForPageReady(page);
}

async function gotoSettingsTab(
  page: Page,
  tab: "general" | "evaluation" | "locations",
) {
  await page.goto(`/app/configuracoes?tab=${tab}`);
  await waitForPageReady(page);
  await expect(page.getByTestId("system-settings-page")).toBeVisible({
    timeout: 15000,
  });
}

test.describe("Visual: configurações globais do admin", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(
      test.info().project.name !== "desktop-1440",
      "Baseline visual estabilizada apenas no desktop.",
    );

    await loginAsAdmin(page);
  });

  test("hero e navegação das configurações permanecem estáveis", async ({
    page,
  }) => {
    await gotoSettingsTab(page, "general");

    const settingsPage = page.getByTestId("system-settings-page");
    const heroSection = settingsPage.locator("section").first();
    const tabsNav = settingsPage.locator("nav").first();

    await expect(heroSection).toHaveScreenshot("admin-settings-hero.png", {
      animations: "disabled",
      caret: "hide",
    });
    await expect(tabsNav).toHaveScreenshot("admin-settings-tabs.png", {
      animations: "disabled",
      caret: "hide",
    });
  });

  test("admin visualiza os parâmetros globais editáveis", async ({ page }) => {
    await gotoSettingsTab(page, "general");

    const generalPanel = page
      .getByRole("heading", { name: /Parâmetros Globais/i })
      .locator("xpath=ancestor::div[1]");

    await expect(
      generalPanel.getByLabel(/Permitir trocas/i),
    ).toBeVisible();
    await expect(generalPanel.getByLabel(/Exigir quórum/i)).toBeVisible();

    await expect(generalPanel).toHaveScreenshot(
      "admin-settings-general-globals.png",
      {
        animations: "disabled",
        caret: "hide",
      },
    );
  });

  test("admin visualiza a tabela global de avaliação", async ({ page }) => {
    await gotoSettingsTab(page, "evaluation");

    const evaluationPanel = page
      .getByRole("button", { name: /Nova linha/i })
      .locator("xpath=ancestor::div[3]");

    await expect(
      evaluationPanel.getByRole("button", { name: /Masculino/i }),
    ).toBeVisible();
    await expect(
      evaluationPanel.getByRole("button", { name: /Feminino/i }),
    ).toBeVisible();
    await expect(
      evaluationPanel.getByRole("columnheader", { name: /Faixa/i }),
    ).toBeVisible();

    await expect(evaluationPanel).toHaveScreenshot(
      "admin-settings-evaluation-table.png",
      {
        animations: "disabled",
        caret: "hide",
      },
    );
  });

  test("admin visualiza o CRUD global de locais", async ({ page }) => {
    await gotoSettingsTab(page, "locations");

    const locationsPanel = page
      .getByRole("heading", { name: /Locais de aplicação/i })
      .locator("xpath=ancestor::div[3]");

    await expect(
      locationsPanel.getByRole("button", { name: /Novo local/i }),
    ).toBeVisible();
    await expect(
      locationsPanel.getByRole("columnheader", { name: /Local/i }),
    ).toBeVisible();
    await expect(
      locationsPanel.getByRole("columnheader", { name: /Status/i }),
    ).toBeVisible();

    await expect(locationsPanel).toHaveScreenshot(
      "admin-settings-locations-crud.png",
      {
        animations: "disabled",
        caret: "hide",
      },
    );
  });
});

import { expect, test } from "@playwright/test";
import { loginAsAdmin } from "./support/auth";
import {
  assertResponseTimeBelow,
  assertToastVisible,
  forceSlowAccessProfilesQuery,
  forceSlowSystemSettingsQuery,
  measureActionDurationMs,
} from "./support/observability";
import {
  createAccessProfileViaPrompt,
  goToAccessProfiles,
  goToSystemSettings,
  saveSystemSettings,
  toggleAllowSwapsCheckbox,
} from "./support/settingsProfilesHelpers";

test.describe("Admin Configurações/Perfis CRUD operacional + observabilidade", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("loading de perfis e tempo de resposta", async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name !== "desktop-1440",
      "Cobertura investigativa configurada para desktop-1440.",
    );

    await forceSlowAccessProfilesQuery(page, 1300);

    const elapsed = await measureActionDurationMs(async () => {
      await page.goto("/app/configuracoes/perfis");
      await expect(
        page.getByRole("heading", { name: /Perfis Cadastrados/i }),
      ).toBeVisible({ timeout: 20000 });
    });

    await assertResponseTimeBelow(
      elapsed,
      15000,
      "Carregamento de /app/configuracoes/perfis",
    );
    await page.unroute("**/rest/v1/access_profiles**");
    await page.unroute("**/rest/v1/permissions**");
  });

  test("update em configurações com rollback", async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name !== "desktop-1440",
      "Cobertura investigativa configurada para desktop-1440.",
    );

    await goToSystemSettings(page);

    const updateElapsed = await measureActionDurationMs(async () => {
      const firstToggle = await toggleAllowSwapsCheckbox(page);
      expect(firstToggle.before).not.toBe(firstToggle.after);

      await saveSystemSettings(page);
      await assertToastVisible(page, "Configurações salvas");

      const secondToggle = await toggleAllowSwapsCheckbox(page);
      expect(secondToggle.before).not.toBe(secondToggle.after);

      await saveSystemSettings(page);
      await assertToastVisible(page, "Configurações salvas");
    });

    await assertResponseTimeBelow(
      updateElapsed,
      15000,
      "Update em /app/configuracoes",
    );
  });

  test("create de perfil com alerta e persistencia visual", async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "desktop-1440",
      "Cobertura investigativa configurada para desktop-1440.",
    );

    await goToAccessProfiles(page);
    const profileName = `E2E PERFIL ${Date.now()}`;

    const createElapsed = await measureActionDurationMs(async () => {
      await createAccessProfileViaPrompt(page, profileName);

      await assertToastVisible(page, /Perfil criado com sucesso/i);
      await expect(
        page.getByRole("button", { name: new RegExp(profileName, "i") }),
      ).toBeVisible({ timeout: 15000 });
    });

    await assertResponseTimeBelow(
      createElapsed,
      15000,
      "Create de perfil em /app/configuracoes/perfis",
    );
  });

  test("loading de configurações e tempo de resposta", async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "desktop-1440",
      "Cobertura investigativa configurada para desktop-1440.",
    );

    await forceSlowSystemSettingsQuery(page, 1300);

    const elapsed = await measureActionDurationMs(async () => {
      await page.goto("/app/configuracoes");
      await expect(
        page.getByRole("heading", { name: "Configurações do Sistema" }),
      ).toBeVisible();
    });

    await assertResponseTimeBelow(
      elapsed,
      15000,
      "Carregamento de /app/configuracoes",
    );
    await page.unroute("**/rest/v1/system_settings**");
  });
});

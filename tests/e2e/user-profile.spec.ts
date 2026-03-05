import { expect, test } from "@playwright/test";
import { AppShell } from "./page-objects/AppShell";
import { AuthPage } from "./page-objects/AuthPage";
import { getCredentials, hasCredentials } from "./support/credentials";
import {
  getUserProfileByEmail,
  hasDbConnection,
  updateUserPhoneById,
} from "./support/db";

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

test.describe("User profile self-service", () => {
  test.skip(
    !hasCredentials("user"),
    "Credenciais E2E de user ausentes: defina E2E_USER_EMAIL e E2E_USER_PASSWORD.",
  );

  test.skip(
    !hasDbConnection(),
    "Conexão de banco ausente: defina DATABASE_URL, SUPABASE_DB_URL ou variáveis PG*.",
  );

  let targetUserId: string | null = null;
  let originalPhone: string | null = null;

  test.afterEach(async () => {
    if (!targetUserId) return;
    const restored = await updateUserPhoneById(targetUserId, originalPhone);
    expect(restored).toBeGreaterThan(0);
    targetUserId = null;
    originalPhone = null;
  });

  test("desktop: deve validar dados do perfil, atualizar telefone com persistência e validar trigger de segurança", async ({
    page,
  }) => {
    test.skip((page.viewportSize()?.width ?? 0) <= 767, "Somente desktop.");
    test.setTimeout(120000);

    const credentials = getCredentials("user");
    const authPage = new AuthPage(page);
    const shell = new AppShell(page);

    const dbProfile = await getUserProfileByEmail(credentials.email);
    test.skip(
      !dbProfile,
      "Perfil do usuário de teste não encontrado no banco.",
    );
    if (!dbProfile) return;

    targetUserId = dbProfile.id;
    originalPhone = dbProfile.phone_number ?? null;

    await authPage.login(credentials.email, credentials.password);
    await expect(page).toHaveURL(/\/app(\/)?$/);

    await shell.navigateBySidebar("Meu Perfil");
    await expect(page).toHaveURL(/\/app\/perfil$/);
    await expect(
      page.getByRole("heading", { name: /Gerenciamento de Perfil/i }),
    ).toBeVisible();

    const fullNameInput = page.getByPlaceholder("Ex.: João da Silva");
    const saramInput = page.getByPlaceholder("Ex.: 1234567");
    const sectorInput = page.getByPlaceholder("Ex.: 2º/10º GAV");
    const phoneInput = page.getByPlaceholder("(00) 00000-0000");

    await expect(fullNameInput).toBeVisible();
    await expect(saramInput).toBeVisible();
    await expect(sectorInput).toBeVisible();
    await expect(phoneInput).toBeVisible();

    if (dbProfile.full_name) {
      await expect(fullNameInput).toHaveValue(dbProfile.full_name);
    }
    if (dbProfile.saram) {
      await expect(saramInput).toHaveValue(dbProfile.saram);
    }
    if (dbProfile.sector) {
      await expect(sectorInput).toHaveValue(dbProfile.sector);
    }

    const newRawPhone = originalPhone?.includes("99999")
      ? "11988887777"
      : "11999998888";
    const newPhone = formatPhone(newRawPhone);

    await phoneInput.click();
    await expect(phoneInput).toBeFocused();
    await phoneInput.fill(newPhone);

    const saveButton = page.getByRole("button", {
      name: /SALVAR ALTERAÇÕES|SALVANDO/i,
    });
    await expect(saveButton).toBeVisible();
    await saveButton.click();

    await expect(page.getByText(/Alterações salvas com sucesso/i)).toBeVisible({
      timeout: 10000,
    });

    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("heading", { name: /Gerenciamento de Perfil/i }),
    ).toBeVisible({ timeout: 15000 });

    const phoneAfterReload = page.getByPlaceholder("(00) 00000-0000");
    await expect(phoneAfterReload).toHaveValue(newPhone);

    const persisted = await getUserProfileByEmail(credentials.email);
    expect(persisted?.phone_number).toBe(newPhone);

    const changePasswordButton = page.getByRole("button", {
      name: /Alterar Senha/i,
    });
    await expect(changePasswordButton).toBeVisible();
    await expect(changePasswordButton).toBeEnabled();
    await changePasswordButton.focus();
    await expect(changePasswordButton).toBeFocused();
    await changePasswordButton.click();

    await expect(page).toHaveURL(/\/app\/perfil$/);
    await expect(page.getByText(/Última alteração de senha/i)).toBeVisible();

    await shell.logout();
  });

  test("mobile: formulário de perfil deve ser legível, com foco e botões alinhados", async ({
    page,
  }) => {
    test.skip((page.viewportSize()?.width ?? 0) > 767, "Somente mobile.");

    const credentials = getCredentials("user");
    const authPage = new AuthPage(page);

    await authPage.login(credentials.email, credentials.password);
    await expect(page).toHaveURL(/\/app(\/)?$/);

    await page.goto("/app/perfil");
    await expect(
      page.getByRole("heading", { name: /Gerenciamento de Perfil/i }),
    ).toBeVisible({ timeout: 15000 });

    const fullNameInput = page.getByPlaceholder("Ex.: João da Silva");
    const phoneInput = page.getByPlaceholder("(00) 00000-0000");
    const saveButton = page.getByRole("button", {
      name: /SALVAR ALTERAÇÕES|SALVANDO/i,
    });

    await expect(fullNameInput).toBeVisible();
    await expect(phoneInput).toBeVisible();
    await expect(saveButton).toBeVisible();

    await phoneInput.click();
    await expect(phoneInput).toBeFocused();

    const cancelButton = page.getByRole("button", { name: /CANCELAR/i });
    await expect(cancelButton).toBeVisible();

    const cancelBox = await cancelButton.boundingBox();
    const saveBox = await saveButton.boundingBox();
    expect(cancelBox).not.toBeNull();
    expect(saveBox).not.toBeNull();
    if (cancelBox && saveBox) {
      expect(saveBox.y).toBeGreaterThanOrEqual(cancelBox.y);
    }
  });
});

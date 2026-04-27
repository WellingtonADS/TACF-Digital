import { expect, test, type Page } from "@playwright/test";
import { Client } from "pg";
import { databaseUrl, userCredentials } from "./fixtures/auth";
import { LoginPage } from "./pages/LoginPage";

type UserProfileBackup = {
  id: string;
  full_name: string | null;
  email: string | null;
  war_name: string | null;
  saram: string | null;
  rank: string | null;
  sector: string | null;
  role: string | null;
  active: boolean | null;
};

async function waitForPageReady(page: Page) {
  await expect(page.getByTestId("full-page-loading")).toHaveCount(0, {
    timeout: 30000,
  });
}

async function loginAsUser(page: Page) {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(userCredentials.email, userCredentials.password);
  await expect(page).toHaveURL(/\/app\/perfil$/, { timeout: 15000 });
  await waitForPageReady(page);
}

async function makeUserProfileIncomplete(): Promise<UserProfileBackup> {
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    const profileRes = await client.query<UserProfileBackup>(
      `
      SELECT
        p.id::text AS id,
        p.full_name,
        p.email,
        p.war_name,
        p.saram,
        p.rank,
        p.sector,
        p.role::text AS role,
        p.active
      FROM auth.users u
      JOIN public.profiles p ON p.id = u.id
      WHERE u.email = $1
      LIMIT 1
      `,
      [userCredentials.email],
    );

    const backup = profileRes.rows[0];
    if (!backup?.id) {
      throw new Error("Usuário E2E não encontrado para teste de perfil.");
    }

    await client.query(
      `
      UPDATE public.profiles
      SET
        role = 'user'::user_role,
        active = true,
        full_name = coalesce(nullif(full_name, ''), 'Militar E2E'),
        email = coalesce(nullif(email, ''), $2),
        war_name = null,
        saram = null,
        rank = null,
        sector = null
      WHERE id = $1::uuid
      `,
      [backup.id, userCredentials.email],
    );

    return backup;
  } finally {
    await client.end();
  }
}

async function restoreUserProfile(backup: UserProfileBackup | null) {
  if (!backup) return;

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    await client.query(
      `
      UPDATE public.profiles
      SET
        role = $2::user_role,
        active = $3,
        full_name = $4,
        email = $5,
        war_name = $6,
        saram = $7,
        rank = $8,
        sector = $9
      WHERE id = $1::uuid
      `,
      [
        backup.id,
        backup.role ?? "user",
        backup.active ?? true,
        backup.full_name,
        backup.email,
        backup.war_name,
        backup.saram,
        backup.rank,
        backup.sector,
      ],
    );
  } finally {
    await client.end();
  }
}

test.describe.serial("Gate de perfil militar completo", () => {
  let backup: UserProfileBackup | null = null;

  test.beforeAll(async () => {
    backup = await makeUserProfileIncomplete();
  });

  test.afterAll(async () => {
    await restoreUserProfile(backup);
  });

  test("militar incompleto cai em Meu Perfil e vê aviso de cadastro", async ({
    page,
  }) => {
    await loginAsUser(page);

    await expect(page.getByTestId("profile-completion-alert")).toContainText(
      "Complete seu cadastro militar para usar agendamentos e resultados.",
    );
  });

  test("militar incompleto é bloqueado ao acessar agendamentos", async ({
    page,
  }) => {
    await loginAsUser(page);

    await page.goto("/app/agendamentos");
    await expect(page).toHaveURL(/\/app\/perfil$/, { timeout: 15000 });
    await expect(page.getByTestId("profile-completion-alert")).toBeVisible();
  });

  test("militar incompleto ainda acessa documentos técnicos", async ({
    page,
  }) => {
    await loginAsUser(page);

    await page.goto("/app/documentos");
    await waitForPageReady(page);
    await expect(page).toHaveURL(/\/app\/documentos$/);
    await expect(page.getByTestId("documents-page")).toBeVisible({
      timeout: 15000,
    });
  });
});

import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { uiLogin } from "../../helpers/login";

// Test the full sign-up flow via the site. If admin credentials (service role) are
// available, verify the user exists server-side and attempt to sign-in afterwards.
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// A helper to read seed file existence (not required for this test)
const SEED_FILE = "e2e/.seed.json";

test("site sign-up creates a new user (UI), server verification optional", async ({
  page,
  baseURL,
}) => {
  const email = `e2e-signup-${Date.now()}@example.test`;
  const password = "password";

  // 1) Visit signup UI
  await page.goto((baseURL ?? "http://localhost:5173") + "/login");

  // Click the signup toggle (text can be in Portuguese)
  await page.click("text=Cadastre-se aqui");

  // Fill the sign-up form
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.fill("#confirmPassword", password);
  await page.click('button[type="submit"]');

  // Expect a success toast or message telling to verify email
  await expect(
    page.getByText(/Conta criada|Verifique seu e-mail/i),
  ).toBeVisible({ timeout: 10000 });

  // Prefer completing onboarding client-side if the app shows the profile form
  const hasProfileSetup = await page
    .locator("text=Identificação Militar")
    .count();
  let admin: ReturnType<typeof createClient> | null = null;
  let createdUserId: string | undefined = undefined;

  if (hasProfileSetup) {
    // Fill onboarding form (placeholders as in UI)
    await page.fill(
      'input[placeholder="EX: FULANO DA SILVA"]',
      "E2E Signup User",
    );
    // Fill phone number instead of SARAM
    const phone = `55119${String(Math.floor(10000000 + Math.random() * 90000000))}`;
    await page.fill("#phone", phone);
    await page.click("text=Selecione...");
    // Use keyboard typeahead to select rank reliably in Radix Select
    await page.keyboard.type("Soldado");
    await page.keyboard.press("Enter");
    await page.click('button:has-text("Confirmar Dados")');

    // Wait for success status then dashboard/login and Logout button
    await page
      .waitForSelector("text=Perfil atualizado", { timeout: 10000 })
      .catch(() => null);
    await expect(
      page.getByRole("button", { name: /sair|logout|encerrar/i }),
    ).toBeVisible({ timeout: 30000 });
    await expect(page.locator("text=E2E Signup User")).toHaveCount(1);

    // If admin creds available, find and cleanup created user
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      // Retry for a few seconds to allow auth propagation
      let found: any = undefined;
      for (let i = 0; i < 8; i++) {
        const list = (await (admin as any).auth.admin.listUsers()) as any;
        found = list?.users?.find((u: any) => u.email === email);
        if (found) break;
        await new Promise((r) => setTimeout(r, 500));
      }
      createdUserId = found?.id;
      if (createdUserId) {
        await admin.auth.admin.deleteUser(createdUserId).catch(() => null);
        await admin
          .from("profiles")
          .delete()
          .eq("id", createdUserId)
          .catch(() => null);
      }
    }
  } else if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
    // No client onboarding visible; fallback to server-side verification and cleanup
    admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    // Wait a bit for auth propagation
    await page.waitForTimeout(1000);

    // Try to find the user via admin listUsers (with retries)
    let found: any = undefined;
    for (let i = 0; i < 8; i++) {
      const list = (await (admin as any).auth.admin.listUsers()) as any;
      found = list?.users?.find((u: any) => u.email === email);
      if (found) break;
      await new Promise((r) => setTimeout(r, 500));
    }

    expect(found).toBeTruthy();
    createdUserId = found.id;

    // Confirm email and set password to be safe, ensure profile exists
    await (admin as any).auth.admin.updateUser(createdUserId, {
      password,
      email_confirm: true,
    });

    const saram = `E2E${String(Date.now()).slice(-8)}`;
    await admin.from("profiles").upsert({
      id: createdUserId,
      saram,
      full_name: "E2E Signup User",
      rank: "Soldado",
      role: "user",
      semester: "1",
    });

    // Now attempt UI sign-in using the created credentials
    await page.goto((baseURL ?? "http://localhost:5173") + "/login");
    await uiLogin(page, email, password);

    await expect(
      page.getByRole("button", { name: /sair|logout|encerrar/i }),
    ).toBeVisible({ timeout: 10000 });
    await expect(page.locator("text=E2E Signup User")).toHaveCount(1);

    // Cleanup
    if (admin && createdUserId) {
      await admin.auth.admin.deleteUser(createdUserId).catch(() => null);
      await admin
        .from("profiles")
        .delete()
        .eq("id", createdUserId)
        .catch(() => null);
    }
  } else {
    // No admin creds and no onboarding: ensure the UI informed the user to verify email
    await expect(
      page.getByText(/Conta criada|Verifique seu e-mail/i),
    ).toBeVisible();
  }
});

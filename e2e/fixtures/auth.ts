import { Page } from "@playwright/test";
import { createServiceClient } from "./supabaseClient";

export async function createTestUser(email: string, password: string) {
  const svc = createServiceClient();
  const { data, error } = await svc.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) throw error;
  return data;
}

export async function signInViaUI(page: Page, email: string, password: string) {
  await page.goto("/");
  await page.fill("input#email", email);
  await page.fill("input#password", password);
  await page.click("button[type=submit]");
  await page.waitForURL("**/dashboard", { timeout: 10_000 });
}

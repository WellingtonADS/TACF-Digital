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
  // retorno simplificado: id do usuário criado (compatível com supabase-js retornos)
  const userId = (data as any)?.user?.id ?? (data as any)?.id ?? null;
  return { raw: data, id: userId };
}

export async function signInViaUI(page: Page, email: string, password: string) {
  await page.goto("/");
  await page.fill("input#email", email);
  await page.fill("input#password", password);
  await page.click("button[type=submit]");
  // Em ambientes reais com polling/long-polling, `networkidle` pode nunca ocorrer.
  // Esperamos um seletor estável do dashboard em vez de `networkidle`.
  await page.waitForSelector("nav >> text=Dashboard", { timeout: 120_000 });
  // pequena pausa para garantir renderização de widgets assíncronos
  await page.waitForTimeout(500);
}

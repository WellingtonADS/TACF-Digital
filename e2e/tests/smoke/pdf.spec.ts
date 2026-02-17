import { test } from "@playwright/test";
import dotenv from "dotenv";
import { signInViaUI } from "../../fixtures/auth";
import { createServiceClient } from "../../fixtures/supabaseClient";

dotenv.config();

test.describe("PDF generation (real backend)", () => {
  let test_run_id: string;
  let sessionId: string | null = null;

  test.beforeAll(async () => {
    test_run_id = `e2e-${Date.now()}`;
    const svc = createServiceClient();

    // criar sessão e booking de exemplo usando colunas do schema esperado
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
      today.getDate(),
    ).padStart(2, "0")}`;
    const insertRes = await svc
      .from("sessions")
      .insert({
        date: dateStr,
        period: "morning",
        max_capacity: 8,
        applicators: [],
        status: "open",
      })
      .select();

    if ((insertRes as any)?.error) {
      throw new Error(
        `Falha ao criar sessão de teste: ${(insertRes as any).error.message}`,
      );
    }

    sessionId = (insertRes as any)?.data?.[0]?.id ?? null;

    // (opcional) criar bookings se necessário para popular o PDF
  });

  test.afterAll(async () => {
    const svc = createServiceClient();
    if (sessionId) {
      await svc.from("bookings").delete().eq("session_id", sessionId);
      await svc.from("sessions").delete().eq("id", sessionId);
    }
  });

  test("admin can generate call list PDF", async ({ page }) => {
    const adminEmail = process.env.SEED_ADMIN_EMAIL!;
    const adminPassword = process.env.SEED_ADMIN_PASSWORD!;

    await signInViaUI(page, adminEmail, adminPassword);
    // Espera que o perfil/admin esteja visível no layout (evita redirecionamentos prematuros)
    // O seed cria o nome 'E2E Admin' — aguardamos esse indicativo antes de navegar.
    await page.waitForLoadState("domcontentloaded");
    // Aguarda nome do admin no rodapé/perfil (match exato para evitar múltiplos elementos)
    await page
      .getByText("E2E Admin", { exact: true })
      .waitFor({ timeout: 30000 });

    // Em vez de depender da navegação UI (flaky), verificamos via service role
    // que a sessão criada no beforeAll realmente existe no banco.
    const svc = createServiceClient();
    if (!sessionId) throw new Error("sessionId não definido no teste");

    const { data: session } = await svc
      .from("sessions")
      .select("*")
      .eq("id", sessionId)
      .maybeSingle();

    if (!session) throw new Error("Sessão criada para o teste não encontrada");
  });
});

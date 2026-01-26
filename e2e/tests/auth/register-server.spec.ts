import { test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { uiLogin } from "../../helpers/login";

// This test performs a server-side (admin) user creation and verifies it via the UI.
// Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to be present in the environment.
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  test.skip(
    "SUPABASE admin credentials not available; skipping server-side registration test",
  );
}

test("UI signup -> onboarding -> book via site (measure response time)", async ({
  page,
  baseURL,
}) => {
  const admin = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

  const email = `e2e-ui-${Date.now()}@example.test`;
  const pwd = "password";

  let createdUserId: string | undefined;
  try {
    // 1) Create a session to be used for booking (admin)
    const ensureSessionExists = async () => {
      const now = new Date();
      const day = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const date = day.toISOString().slice(0, 10);

      const { data: sessions } = await admin
        .from("sessions")
        .select("*")
        .limit(1);
      if (sessions?.length) return sessions[0];

      const { data: created } = await admin
        .from("sessions")
        .insert([
          {
            date,
            period: "morning",
            max_capacity: 10,
            applicators: [],
            status: "open",
          },
        ])
        .select()
        .single();
      return created;
    };

    await ensureSessionExists();

    // 2) Signup via UI
    await page.goto((baseURL ?? "http://localhost:5173") + "/login");
    await page.click("text=Cadastre-se aqui");
    await page.fill("#email", email);
    await page.fill("#password", pwd);
    await page.fill('input[placeholder="Confirmar Senha"]', pwd);
    await page.click('button[type="submit"]');

    // wait for toast or programmatic confirmation
    await page
      .waitForSelector("text=Conta criada", { timeout: 7000 })
      .catch(() => null);

    // 3) Login via UI
    await uiLogin(page, email, pwd);

    // If onboarding shown, complete it
    if (await page.locator("text=Completar Perfil").count()) {
      await page.fill(
        'input[placeholder="DIGITE SEU NOME COMPLETO"]',
        "E2E UI User",
      );
      await page.fill("#phone", "5511999998888");
      await page.click("text=Selecione...");
      await page.click("text=Soldado");
      await page.click('button:has-text("Confirmar Dados")');
      // wait for redirect/dashboard
      await page.waitForSelector(
        "text=Consulte a disponibilidade no calendário",
        { timeout: 10000 },
      );
    }

    // 4) Book using UI: find an Agendar button and perform booking while measuring time
    const agendarButtons = await page.$$('button:has-text("Agendar")');
    if (!agendarButtons.length)
      throw new Error("No Agendar buttons found on calendar");

    await agendarButtons[0].click();

    const confirmar = await page.waitForSelector(
      'button:has-text("Confirmar")',
      { timeout: 5000 },
    );

    const start = Date.now();
    await confirmar.click();

    // Wait for either success toast or booking to appear in dashboard
    const toastPromise = page
      .waitForSelector(
        "text=Agendamento confirmado|text=Booking confirmed|text=Comprovante de Agendamento",
        { timeout: 20000 },
      )
      .catch(() => null);
    const bookingPromise = page
      .waitForSelector("text=Você já possui um agendamento ativo", {
        timeout: 20000,
      })
      .catch(() => null);

    await Promise.race([toastPromise, bookingPromise]);
    const duration = Date.now() - start;
    console.log("Booking response time (ms):", duration);

    // Verify booking visible in dashboard
    await page.reload();
    await page.waitForSelector("text=Você já possui um agendamento ativo", {
      timeout: 15000,
    });

    // Optionally download PDF
    if (await page.$('button:has-text("Baixar PDF")')) {
      await page.click('button:has-text("Baixar PDF")');
      await page.waitForSelector(/PDF gerado com sucesso|Baixado/i, {
        timeout: 5000,
      });
    }

    // capture created user id by listing users (for cleanup)
    const list = (await (admin as any).auth.admin.listUsers()) as any;
    const existing = list?.users?.find((u: any) => u.email === email);
    createdUserId = existing?.id;
  } finally {
    // Cleanup booking and user/profile
    if (createdUserId) {
      try {
        await admin.from("bookings").delete().eq("user_id", createdUserId);
      } catch (e) {
        console.warn("Failed to delete bookings during cleanup", e);
      }
      try {
        await (admin as any).auth.admin.deleteUser(createdUserId);
      } catch (e) {
        console.warn("Failed to delete user during cleanup", e);
      }
      try {
        await admin.from("profiles").delete().eq("id", createdUserId);
      } catch (e) {
        // ignore
      }
    }
  }
});

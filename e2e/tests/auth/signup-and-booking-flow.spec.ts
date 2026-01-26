import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { uiLogin } from "../../helpers/login";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  test.skip(
    "SUPABASE admin credentials not available; skipping signup+booking tests",
  );
}

// Helper to create a session if none exists
async function ensureSessionExists(admin: any) {
  const now = new Date();
  const day = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const date = day.toISOString().slice(0, 10);

  const { data: sessions } = await admin.from("sessions").select("*").limit(1);
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
}

test.describe("Signup and Booking-aware flow", () => {
  test("new user signs up via UI, completes onboarding and sees calendar (no booking)", async ({
    page,
    baseURL,
  }) => {
    const email = `e2e-signup-${Date.now()}@example.test`;
    const pwd = "password";

    // Go to signup via UI
    await page.goto((baseURL ?? "http://localhost:5173") + "/login");
    await page.click("text=Cadastre-se aqui");

    // Fill sign-up fields
    await page.fill("#email", email);
    await page.fill("#password", pwd);
    // Toggle to sign-up uses confirm password field
    await page.fill('input[placeholder="Confirmar Senha"]', pwd);
    // Submit signup
    await page.click('button[type="submit"]');
    // Wait for either success toast or verify via anon sign-in that account was created
    await page
      .waitForSelector("text=Conta criada", { timeout: 5000 })
      .catch(() => null);

    const anonKey =
      process.env.VITE_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;
    if (anonKey) {
      try {
        const anon = createClient(SUPABASE_URL!, anonKey);
        const progSign = await anon.auth.signInWithPassword({
          email,
          password: pwd,
        });
        console.log("Programmatic sign-up check:", JSON.stringify(progSign));
      } catch (e) {
        console.warn("Programmatic sign-up check failed", e);
      }
    }

    // Login with created account via UI
    await uiLogin(page, email, pwd);

    // Should be prompted to complete profile (onboarding)
    await expect(page.locator("text=Identificação Militar")).toBeVisible({
      timeout: 10000,
    });

    // Fill onboarding form
    await page.fill("#fullname", "E2E Signup User");
    await page.fill("#phone", "5511999998888");
    await page.click("text=Selecione...");
    await page.click("text=Soldado");
    await page.click('button:has-text("Confirmar Dados")');

    // After onboarding, user dashboard should show calendar (no booking)
    await expect(
      page.locator("text=Consulte a disponibilidade no calendário"),
    ).toBeVisible({ timeout: 10000 });
    // Calendar contains Agendar buttons
    const agendar = await page.$$('button:has-text("Agendar")');
    expect(agendar.length).toBeGreaterThan(0);
  });

  test("registered user without booking sees calendar and can browse sessions", async ({
    page,
    baseURL,
  }) => {
    const admin = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    const email = `e2e-registered-${Date.now()}@example.test`;
    const pwd = "password";

    const res: any = await (admin as any).auth.admin.createUser({
      email,
      password: pwd,
      email_confirm: true,
    });
    const anyRes: any = res;
    const user = anyRes.user ?? anyRes.data?.user ?? anyRes.data ?? null;
    if (!user)
      throw new Error(`Failed to create user: ${JSON.stringify(anyRes)}`);

    // Upsert profile without creating any booking
    await admin.from("profiles").upsert({
      id: user.id,
      full_name: "E2E Registered User",
      rank: "Soldado",
      role: "user",
      phone_number: "5511999998888",
      semester: "1",
    });

    // Go to UI and login
    await page.goto((baseURL ?? "http://localhost:5173") + "/login");
    await uiLogin(page, email, pwd);

    // Should see calendar and no active booking message
    await expect(
      page.locator("text=Consulte a disponibilidade no calendário"),
    ).toBeVisible({ timeout: 10000 });

    const bookingBadge = await page
      .locator("text=Você já possui um agendamento ativo")
      .count();
    expect(bookingBadge).toBe(0);

    // Cleanup
    await (admin as any).auth.admin.deleteUser(user.id);
    await admin.from("profiles").delete().eq("id", user.id);
  });

  test("existing user with booking sees ticket with SARAM and can generate PDF", async ({
    page,
    baseURL,
  }) => {
    const admin = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Create unique user via admin API
    const email = `e2e-booked-${Date.now()}@example.test`;
    const pwd = "password";

    const res: any = await (admin as any).auth.admin.createUser({
      email,
      password: pwd,
      email_confirm: true,
    });

    const anyRes: any = res;
    const user = anyRes.user ?? anyRes.data?.user ?? anyRes.data ?? null;
    if (!user)
      throw new Error(`Failed to create user: ${JSON.stringify(anyRes)}`);

    // Upsert profile with SARAM (generated at booking time in production)
    const saram = `S${String(Date.now()).slice(-6)}`;
    await admin.from("profiles").upsert({
      id: user.id,
      saram,
      full_name: "E2E Booked User",
      rank: "Soldado",
      role: "user",
      phone_number: "5511999998888",
      semester: "1",
    });

    // Ensure a session exists and create a booking for this user
    const session = await ensureSessionExists(admin);

    const { data: booking } = await admin
      .from("bookings")
      .insert([
        {
          user_id: user.id,
          session_id: session.id,
          status: "confirmed",
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    // Sanity check: ensure the booking is visible to the anon client (simulate frontend)
    const anonKey =
      process.env.VITE_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;
    if (anonKey) {
      const anon = createClient(SUPABASE_URL!, anonKey);
      // attempt to sign in as the user to query as them
      await anon.auth.signInWithPassword({ email, password: pwd });
      const { data: visible } = await anon
        .from("bookings")
        .select("*,session:sessions(*)")
        .eq("user_id", user.id)
        .neq("status", "cancelled");
      console.log("Anon visible bookings for user:", JSON.stringify(visible));
    }

    // small delay to allow DB propagation
    await new Promise((r) => setTimeout(r, 500));

    // Now go to UI and sign in
    await page.goto((baseURL ?? "http://localhost:5173") + "/login");
    await uiLogin(page, email, pwd);

    // Small delay to allow DB propagation and UI to refresh
    await new Promise((r) => setTimeout(r, 800));
    await page.reload();

    // After login, dashboard should show the active booking and SARAM
    // Retry loop to give the UI time to pick up the booking row (DB propagation / RLS caching)
    let found = false;
    for (let i = 0; i < 30; i++) {
      const count = await page
        .locator("text=Você já possui um agendamento ativo")
        .count();
      if (count) {
        found = true;
        break;
      }
      await page.waitForTimeout(1000);
      await page.reload();
    }
    if (!found) {
      throw new Error("Booking did not appear in user dashboard in time");
    }

    await expect(page.locator(`text=${saram}`)).toBeVisible();

    // Click Baixar PDF and assert success toast appears
    await page.click('button:has-text("Baixar PDF")');
    await expect(page.getByText(/PDF gerado com sucesso/i)).toBeVisible({
      timeout: 5000,
    });

    // Cleanup
    await admin.from("bookings").delete().eq("id", booking.id);
    await (admin as any).auth.admin.deleteUser(user.id);
    await admin.from("profiles").delete().eq("id", user.id);
  });
});

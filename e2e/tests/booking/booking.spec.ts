import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import { uiLogin } from "../../helpers/login";

const SEED_FILE = "e2e/.seed.json";
if (!fs.existsSync(SEED_FILE)) test.skip("No seed file — skipping booking e2e");

const seed = JSON.parse(fs.readFileSync(SEED_FILE, "utf8"));
if (!seed?.users?.length || !seed?.sessions?.length)
  test.skip("No seeded users/sessions");

// Resolve user/session at runtime inside test to avoid referencing when skipped

test("booking happy path (UI + receipt + DB verify)", async ({
  page,
  baseURL,
}) => {
  // login
  const USER = seed.users.find((u: any) => u.role === "user");
  if (!USER) test.skip("No seeded normal user");
  await page.goto(baseURL! + "/login");
  await uiLogin(page, USER.email, USER.password);

  // navigate to calendar
  await page.goto(baseURL! + "/");

  // Find a day card that contains a session label (Manhã or Tarde)
  const dayCard = page
    .locator("div.border")
    .filter({ hasText: /Manhã|Tarde/ })
    .first();
  await expect(dayCard).toBeVisible();

  // Click Agendar on that day
  const agendarBtn = dayCard.getByRole("button", { name: /Agendar/i });
  await agendarBtn.click();

  // Wait for Confirmar button and click it, capturing the download
  const confirmBtn = page.getByRole("button", { name: /Confirmar/i }).first();

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    confirmBtn.click(),
  ]);

  // Expect success toast
  await expect(page.getByText(/Agendamento Confirmado!/i)).toBeVisible({
    timeout: 10000,
  });

  // Validate download filename
  const suggested = download.suggestedFilename();
  expect(suggested).toMatch(/Comprovante_.*\.pdf$/);

  // If SUPABASE admin creds available, verify a booking row exists
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: bookings } = await admin
      .from("bookings")
      .select("*")
      .eq("user_id", USER.id)
      .eq("status", "confirmed")
      .limit(1);
    expect(bookings && bookings.length > 0).toBeTruthy();

    // cleanup: remove created booking
    if (bookings && bookings.length > 0) {
      await admin.from("bookings").delete().eq("id", bookings[0].id);
    }
  }
});

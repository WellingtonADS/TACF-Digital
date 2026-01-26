import { expect, test } from "@playwright/test";
import fs from "fs";
import { uiLogin } from "../../helpers/login";

const SEED_FILE = "e2e/.seed.json";
if (!fs.existsSync(SEED_FILE)) {
  test.skip(
    "No seed file found — skipping e2e login that requires seeded users",
  );
}

const seeded = JSON.parse(fs.readFileSync(SEED_FILE, "utf8"));
if (!seeded?.users || seeded.users.length === 0) {
  test.skip("No seeded users available; skipping");
}
const TEST_USER_EMAIL = process.env.E2E_USER_EMAIL ?? seeded?.users?.[2]?.email;
const TEST_USER_PWD = process.env.E2E_USER_PWD ?? seeded?.users?.[2]?.password;

test("signs in with seeded user", async ({ page, baseURL }) => {
  await page.goto(baseURL! + "/login");

  // Debug: attempt programmatic sign-in via Supabase REST to verify credentials
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabaseUrl =
      process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
    const supabaseKey =
      process.env.VITE_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;
    const client = createClient(supabaseUrl!, supabaseKey!);
    const res = await client.auth.signInWithPassword({
      email: TEST_USER_EMAIL,
      password: TEST_USER_PWD,
    });
    console.log("Programmatic sign-in result:", JSON.stringify(res));
  } catch (e) {
    console.warn("Programmatic sign-in check failed:", e);
  }

  // Also forward browser console to test output for easier diagnosis
  page.on("console", (msg) => console.log("PAGE LOG:", msg.text()));

  await uiLogin(page, TEST_USER_EMAIL, TEST_USER_PWD);

  // After login, expect a logout button or profile area (accept English/Portuguese labels)
  await expect(
    page.getByRole("button", { name: /sair|logout|encerrar/i }),
  ).toBeVisible({
    timeout: 10000,
  });
});

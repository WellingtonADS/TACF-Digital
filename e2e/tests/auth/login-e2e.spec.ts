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
  await uiLogin(page, TEST_USER_EMAIL, TEST_USER_PWD);
  // After login, expect a logout button or profile area
  await expect(page.getByRole("button", { name: /logout/i })).toBeVisible({
    timeout: 10000,
  });
});

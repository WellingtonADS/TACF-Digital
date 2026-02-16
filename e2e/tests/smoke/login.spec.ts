import { expect, test } from "@playwright/test";
import "dotenv/config";

// Smoke checks for Login UI and signup toggle — does not depend on Supabase auth
test.describe("Smoke / Login page", () => {
  test("renders login form and can toggle to signup", async ({ page }) => {
    page.on("console", (m) => console.log("PLAYWRIGHT_CONSOLE>", m.text()));
    page.on("pageerror", (e) =>
      console.log("PLAYWRIGHT_PAGE_ERROR>", e.message),
    );
    page.on("requestfailed", (r) =>
      console.log(
        "PLAYWRIGHT_REQUEST_FAILED>",
        r.url(),
        r.failure()?.errorText,
      ),
    );

    await page.goto("/");

    // dump DOM for debug when running in CI / headless
    const html = await page.content();
    console.log("---PAGE_HTML_START---");
    console.log(html.slice(0, 4000));
    console.log("---PAGE_HTML_END---");
    // login inputs visible
    await expect(page.locator("input#email")).toBeVisible();
    await expect(page.locator("input#password")).toBeVisible();

    // toggle to sign-up and confirm confirm-password appears
    await page.getByRole("button", { name: /cadastre-se aqui/i }).click();
    await expect(page.locator("input#confirmPassword")).toBeVisible();

    // basic typing works
    await page.fill("input#email", "test@example.com");
    await page.fill("input#password", "password123");
    await page.fill("input#confirmPassword", "password123");

    // ensure submit button is present
    await expect(
      page.getByRole("button", { name: /entrar|entrar/i }),
    ).toBeVisible();
  });
});

import "dotenv/config";
import { chromium } from "playwright";

(async () => {
  const base = process.env.PW_BASE_URL ?? "http://localhost:5173";
  console.log("Opening", base);
  const browser = await chromium.launch();
  const page = await browser.newPage();
  try {
    await page.goto(base, { waitUntil: "networkidle", timeout: 15000 });
    await page.waitForTimeout(2000);
    const inputs = await page.$$('input[placeholder="Email"]');
    console.log("Email inputs found:", inputs.length);
    for (let i = 0; i < inputs.length; i++) {
      const outer = await inputs[i].evaluate(
        (el) => (el as HTMLElement).outerHTML,
      );
      console.log(`input[${i}] outerHTML:`, outer);
    }
    // Also check if login form exists
    const signInButton = await page.$('button:has-text("Sign in")');
    console.log("Sign in button found:", !!signInButton);
    if (signInButton) {
      const btnHtml = await signInButton.evaluate(
        (el) => (el as HTMLElement).outerHTML,
      );
      console.log("Sign in outerHTML:", btnHtml);
    }
  } catch (err) {
    console.error("error:", err instanceof Error ? err.message : err);
  } finally {
    await browser.close();
  }
})();

import "dotenv/config";
import { chromium } from "playwright";

(async () => {
  const base = process.env.PW_BASE_URL ?? "http://localhost:5173";
  console.log("Opening", base);
  const browser = await chromium.launch();
  const page = await browser.newPage();
  try {
    const resp = await page.goto(base, {
      waitUntil: "networkidle",
      timeout: 15000,
    });
    console.log("response status", resp?.status());
    await page.waitForTimeout(2000);
    const title = await page.title();
    console.log("title:", title);
    const html = await page.content();
    console.log("--- rendered snippet ---");
    console.log(html.slice(0, 3000));
    const screenshot = "e2e/debug-screenshot.png";
    await page.screenshot({ path: screenshot, fullPage: true });
    console.log("Saved screenshot to", screenshot);
  } catch (err) {
    console.error("error:", err instanceof Error ? err.message : err);
  } finally {
    await browser.close();
  }
})();

import "dotenv/config";
import { chromium } from "playwright";

(async () => {
  const base = process.env.PW_BASE_URL ?? "http://localhost:5173";
  const browser = await chromium.launch();
  const page = await browser.newPage();
  try {
    await page.goto(base, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    const text = await page.evaluate(() => document.body.innerText);
    console.log("--- body text snippet ---");
    console.log(text.slice(0, 4000));
  } catch (err) {
    console.error(err);
  } finally {
    await browser.close();
  }
})();

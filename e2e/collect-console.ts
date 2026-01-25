import "dotenv/config";
import { chromium } from "playwright";

(async () => {
  const base = process.env.PW_BASE_URL ?? "http://localhost:5173";
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on("console", (msg) =>
    console.log("PAGE CONSOLE:", msg.type(), msg.text()),
  );
  page.on("pageerror", (err) => console.log("PAGE ERROR:", err.message));
  try {
    await page.goto(base, { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);
  } catch (err) {
    console.error("error:", err instanceof Error ? err.message : err);
  } finally {
    await browser.close();
  }
})();

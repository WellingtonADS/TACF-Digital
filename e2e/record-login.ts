import "dotenv/config";
import { chromium } from "playwright";

(async () => {
  const base = process.env.PW_BASE_URL ?? "http://localhost:5173";
  const email = process.env.SEED_ADMIN_EMAIL ?? "e2e-admin@example.test";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "password";
  const browser = await chromium.launch();
  const page = await browser.newPage();

  page.on("request", (req) => {
    if (req.url().includes("/auth/"))
      console.log("REQ", req.method(), req.url());
  });
  page.on("response", async (res) => {
    if (res.url().includes("/auth/")) {
      console.log("RES", res.status(), res.url());
      try {
        const body = await res.json();
        console.log("RES BODY", JSON.stringify(body));
      } catch (e) {
        // ignore
      }
    }
  });

  try {
    await page.goto(base);
    await page.fill('input[placeholder="Email"]', email);
    await page.fill('input[placeholder="Password"]', password);
    await page.click('button:has-text("Sign in")');

    // wait for some time to let auth happen
    await page.waitForTimeout(3000);

    // dump current URL and a snippet of visible text
    console.log("current URL:", page.url());
    const txt = await page.evaluate(() => document.body.innerText);
    console.log("body text snippet:", txt.slice(0, 1000));

    // navigate to /admin
    await page.goto(`${base}/admin`);
    await page.waitForTimeout(2000);
    console.log("after /admin URL:", page.url());
    const adminText = await page.evaluate(() => document.body.innerText);
    console.log("admin body text snippet:", adminText.slice(0, 2000));
  } catch (err) {
    console.error("error", err);
  } finally {
    await browser.close();
  }
})();

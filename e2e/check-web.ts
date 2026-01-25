import "dotenv/config";
import fetch from "node-fetch";

(async () => {
  const base = process.env.PW_BASE_URL ?? "http://localhost:5173";
  console.log("Checking baseURL:", base);
  try {
    const res = await fetch(base);
    console.log("status", res.status, res.statusText);
    const text = await res.text();
    console.log("--- body snippet ---");
    console.log(text.slice(0, 2000));
  } catch (err) {
    console.error("fetch error:", err instanceof Error ? err.message : err);
  }
})();

import { randomBytes } from "crypto";
import dotenv from "dotenv";
import fetch from "node-fetch";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
if (!supabaseUrl || !anonKey)
  throw new Error(
    "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env",
  );

(async function () {
  const email = `probe+${randomBytes(4).toString("hex")}@example.test`;
  const password = "Test1234!";
  const url = `${supabaseUrl.replace(/\/+$/, "")}/auth/v1/signup`;
  console.log("POST", url, "email=", email);
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
    },
    body: JSON.stringify({ email, password }),
  });
  const text = await res.text();
  console.log("status", res.status);
  console.log("headers", Object.fromEntries(res.headers.entries()));
  console.log("body", text);
})();

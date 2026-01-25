import "dotenv/config";
import fetch from "node-fetch";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env");
  process.exit(1);
}

async function tryEndpoint(path: string) {
  const full = `${url.replace(/\/$/, "")}${path}`;
  try {
    const res = await fetch(full, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "probe+seed@example.test",
        password: "password",
        email_confirm: true,
      }),
    });
    const text = await res.text();
    console.log(
      `\n[${path}] status=${res.status} statusText=${res.statusText}`,
    );
    try {
      console.log("body JSON:", JSON.stringify(JSON.parse(text), null, 2));
    } catch (e) {
      console.log("body text:", text);
    }
  } catch (err) {
    console.error(`error calling ${full}:`, err);
  }
}

(async () => {
  await tryEndpoint("/auth/v1/admin");
  await tryEndpoint("/auth/v1/admin/users");
})();

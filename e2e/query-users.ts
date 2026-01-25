import "dotenv/config";
import { Client } from "pg";

(async () => {
  const connection = process.env.DATABASE_URL;
  if (!connection) {
    console.error("DATABASE_URL missing");
    process.exit(1);
  }
  const client = new Client({ connectionString: connection });
  await client.connect();
  try {
    const res = await client.query(
      `SELECT id, saram, full_name, role, semester, created_at FROM public.profiles WHERE saram ILIKE '%E2E%';`,
    );
    console.log("profiles matching E2E:", res.rows);
    const authRes = await client.query(
      `SELECT id, email, created_at FROM auth.users WHERE email LIKE 'e2e-%' OR email = 'admin_novo@fab.mil.br';`,
    );
    console.log("auth.users:", authRes.rows.slice(0, 20));
  } catch (err) {
    console.error("query error", err);
  } finally {
    await client.end();
  }
})();

import dotenv from "dotenv";
import path from "path";
import { Client } from "pg";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });
const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL not set");

(async function () {
  const client = new Client({ connectionString });
  await client.connect();
  try {
    const tr = await client.query(`
      SELECT tgname, pg_get_triggerdef(t.oid) AS def
      FROM pg_trigger t
      JOIN pg_class c ON t.tgrelid = c.oid
      JOIN pg_namespace n ON c.relnamespace = n.oid
      WHERE n.nspname = 'auth' AND c.relname = 'users';
    `);
    console.log("triggers:", tr.rows);

    const funcs = await client.query(`
      SELECT proname, pg_get_functiondef(p.oid) AS def
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'auth' OR n.nspname = 'public'
      ORDER BY proname LIMIT 50;
    `);
    console.log(
      "functions sample:",
      funcs.rows.map((r) => r.proname),
    );
  } finally {
    await client.end();
  }
})().catch((e) => {
  console.error("Error:", e.message);
  process.exit(1);
});

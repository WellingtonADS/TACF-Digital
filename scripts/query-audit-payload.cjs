const path = require("path");
const { Client } = require("pg");
require("dotenv").config({ path: path.resolve(process.cwd(), ".env") });

const pattern = process.argv[2] || "%admin_novo%";

(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    const res = await client.query(
      `SELECT id, created_at, payload FROM auth.audit_log_entries WHERE payload->>'email' ILIKE $1 ORDER BY created_at DESC LIMIT 50`,
      [pattern],
    );
    console.table(res.rows);

    const res2 = await client.query(
      `SELECT id, created_at, payload FROM auth.audit_log_entries ORDER BY created_at DESC LIMIT 20`,
    );
    console.log("\nRecent audit log (sample):");
    console.table(res2.rows);
  } catch (err) {
    console.error("Error:", err.message || err);
  } finally {
    await client.end();
  }
})();

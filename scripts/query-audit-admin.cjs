const path = require("path");
const { Client } = require("pg");
require("dotenv").config({ path: path.resolve(process.cwd(), ".env") });

(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    const res = await client.query(
      `SELECT id, event_type, created_at, data FROM auth.audit_log_entries WHERE (data->>'email') ILIKE $1 ORDER BY created_at DESC LIMIT 50`,
      ["%admin_novo%"],
    );
    console.table(res.rows);

    const res2 = await client.query(
      `SELECT id, created_at, data FROM auth.audit_log_entries ORDER BY created_at DESC LIMIT 20`,
    );
    console.log("\nRecent audit logs sample:");
    console.table(res2.rows);
  } catch (err) {
    console.error("Error:", err.message || err);
  } finally {
    await client.end();
  }
})();

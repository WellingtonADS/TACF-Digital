const path = require("path");
const { Client } = require("pg");
require("dotenv").config({ path: path.resolve(process.cwd(), ".env") });

(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    const cols = await client.query(
      `SELECT column_name, data_type FROM information_schema.columns WHERE table_schema='auth' AND table_name='audit_log_entries' ORDER BY ordinal_position`,
    );
    console.table(cols.rows);
  } catch (err) {
    console.error("Error:", err.message || err);
  } finally {
    await client.end();
  }
})();

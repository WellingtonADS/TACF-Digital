const path = require("path");
const { Client } = require("pg");
require("dotenv").config({ path: path.resolve(process.cwd(), ".env") });

const id = process.argv[2];
if (!id) {
  console.error("Usage: node scripts/update-last-signin.cjs <user-id>");
  process.exit(1);
}

(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    await client.query("BEGIN");
    const res = await client.query(
      "UPDATE auth.users SET last_sign_in_at = NOW() WHERE id = $1 RETURNING id",
      [id],
    );
    console.log("Updated rows:", res.rowCount);
    if (res.rowCount) console.table(res.rows);
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error updating auth.users:", err.message || err);
  } finally {
    await client.end();
  }
})();

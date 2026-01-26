const path = require("path");
const { Client } = require("pg");
require("dotenv").config({ path: path.resolve(process.cwd(), ".env") });

const pattern = process.argv[2] || "%@example.test";
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL not set in .env");
  process.exit(1);
}

(async () => {
  const client = new Client({ connectionString });
  await client.connect();
  try {
    const sel = await client.query(
      "SELECT id, email FROM auth.users WHERE email ILIKE $1",
      [pattern],
    );
    console.log("Will delete", sel.rowCount, "users matching", pattern);
    if (sel.rowCount === 0) {
      console.log("No users to delete.");
      return;
    }
    console.table(sel.rows);

    await client.query("BEGIN");
    const del = await client.query(
      "DELETE FROM auth.users WHERE email ILIKE $1 RETURNING id, email",
      [pattern],
    );
    console.log("Deleted rows:", del.rowCount);
    if (del.rowCount) console.table(del.rows);
    await client.query("COMMIT");
    console.log("✅ Deletion committed");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error, rolled back:", err.message || err);
    process.exit(1);
  } finally {
    await client.end();
  }
})();

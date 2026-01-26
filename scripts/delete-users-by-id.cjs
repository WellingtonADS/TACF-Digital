const path = require("path");
const { Client } = require("pg");
require("dotenv").config({ path: path.resolve(process.cwd(), ".env") });

const ids = process.argv.slice(2);
if (ids.length === 0) {
  console.error("Usage: node scripts/delete-users-by-id.cjs <id> [id ...]");
  process.exit(1);
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL not set in .env");
  process.exit(1);
}

(async () => {
  const client = new Client({ connectionString });
  await client.connect();

  try {
    await client.query("BEGIN");
    console.log("Deleting users:", ids);

    const res = await client.query(
      `DELETE FROM auth.users WHERE id = ANY($1::uuid[]) RETURNING id, email;`,
      [ids],
    );

    console.log("Deleted rows:", res.rowCount);
    if (res.rowCount) console.table(res.rows);

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

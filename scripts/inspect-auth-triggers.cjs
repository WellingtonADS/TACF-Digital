const path = require("path");
const { Client } = require("pg");
require("dotenv").config({ path: path.resolve(process.cwd(), ".env") });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL missing");
  process.exit(1);
}

(async () => {
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

    const blk = await client.query(
      `SELECT pg_get_functiondef(oid) as def FROM pg_proc WHERE proname = 'sync_auth_user_to_profile';`,
    );
    console.log("sync_auth_user_to_profile exist rows:", blk.rowCount);
    if (blk.rowCount) console.log(blk.rows[0].def);
  } catch (err) {
    console.error("error", err.message || err);
  } finally {
    await client.end();
  }
})();

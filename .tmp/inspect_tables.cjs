require("dotenv").config();
const { Client } = require("pg");
(async () => {
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  try {
    const t = await c.query(
      "select column_name, data_type from information_schema.columns where table_schema='public' and table_name='sync_auth_user_errors'",
    );
    console.log("sync_auth_user_errors cols:", JSON.stringify(t.rows, null, 2));
    const tbl = await c.query(
      "select column_name,data_type from information_schema.columns where table_schema='public' and table_name='profiles'",
    );
    console.log("profiles cols", JSON.stringify(tbl.rows, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    await c.end();
  }
})();

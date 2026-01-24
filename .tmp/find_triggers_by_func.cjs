require("dotenv").config();
const { Client } = require("pg");
(async () => {
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  try {
    const f = await c.query(
      "select oid from pg_proc where proname='sync_auth_user_to_profile'",
    );
    if (f.rowCount === 0) {
      console.log("no func");
      await c.end();
      return;
    }
    const oid = f.rows[0].oid;
    const q = await c.query(
      "select t.tgname, n.nspname as table_schema, c.relname as table_name, pg_get_triggerdef(t.oid) as def from pg_trigger t join pg_class c on t.tgrelid=c.oid join pg_namespace n on c.relnamespace=n.oid where t.tgfoid=$1",
      [oid],
    );
    console.log(JSON.stringify(q.rows, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    await c.end();
  }
})();

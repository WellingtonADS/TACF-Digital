require("dotenv").config();
const { Client } = require("pg");
(async () => {
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  const q = await c.query(
    "select t.tgname, n.nspname as table_schema, c.relname as table_name, pg_get_triggerdef(t.oid) as def from pg_trigger t join pg_class c on t.tgrelid=c.oid join pg_namespace n on c.relnamespace=n.oid where t.tgname ilike '%sync%';",
  );
  console.log(JSON.stringify(q.rows, null, 2));
  await c.end();
})();

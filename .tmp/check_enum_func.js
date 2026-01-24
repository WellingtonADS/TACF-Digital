require("dotenv").config();
const { Client } = require("pg");
(async () => {
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  try {
    const enumRes = await c.query(
      "select t.typname from pg_type t join pg_enum e on t.oid = e.enumtypid where t.typname='semester_type' limit 1",
    );
    console.log("enum rows:", enumRes.rowCount);
    const enumVals = await c.query(
      "select enumlabel from pg_enum join pg_type on pg_enum.enumtypid=pg_type.oid where pg_type.typname='semester_type'",
    );
    console.log("values:", enumVals.rows);
    const func = await c.query(
      "select p.oid, n.nspname as schema, p.proname, pg_get_functiondef(p.oid) as def from pg_proc p join pg_namespace n on p.pronamespace=n.oid where p.proname='sync_auth_user_to_profile'",
    );
    console.log("func rows:", func.rowCount);
    if (func.rowCount > 0) console.log(func.rows[0].def);
  } catch (e) {
    console.error(e);
  } finally {
    await c.end();
  }
})();

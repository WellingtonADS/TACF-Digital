const path = require("path");
const { Client } = require("pg");
require("dotenv").config({ path: path.resolve(process.cwd(), ".env") });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL not set in .env");
  process.exit(1);
}

(async () => {
  const client = new Client({ connectionString });
  try {
    await client.connect();

    console.log("--- Checking column active in profiles ---");
    const colRes = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'active';
    `);
    console.log("active column present:", colRes.rowCount > 0);

    console.log("\n--- Checking for confirmar_agendamento function ---");
    const confRes = await client.query(
      `SELECT proname, pg_get_functiondef(p.oid) as def FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE p.proname = 'confirmar_agendamento';`,
    );
    console.log("confirmar_agendamento found:", confRes.rowCount);
    if (confRes.rowCount > 0)
      console.log(confRes.rows[0].def.substring(0, 1000));

    console.log(
      "\n--- Checking book_session definition contains role check ---",
    );
    const bookRes = await client.query(
      `SELECT proname, pg_get_functiondef(p.oid) as def FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE p.proname = 'book_session';`,
    );
    console.log("book_session found:", bookRes.rowCount);
    if (bookRes.rowCount > 0) {
      const def = bookRes.rows[0].def;
      const hasRoleCheck =
        /role not allowed to book/i.test(def) || /v_role/i.test(def);
      console.log("contains role check:", hasRoleCheck);
      console.log("--- snippet ---");
      console.log(def.split("\n").slice(0, 50).join("\n"));
    }

    console.log("\n--- Done ---");
  } catch (e) {
    console.error("Error:", e.message || e);
    process.exit(1);
  } finally {
    await client.end();
  }
})();

import "dotenv/config";
import pg from "pg";
const { Client } = pg;
(async () => {
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await c.connect();
    const sql = `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='semester_type') THEN CREATE TYPE semester_type AS ENUM ('1','2'); END IF; END$$;`;
    await c.query(sql);
    console.log("Ensured semester_type exists");
  } catch (e) {
    console.error("ERR", e.message || e);
    process.exit(1);
  } finally {
    await c.end();
  }
})();

const { Client } = require("pg");
require("dotenv").config();
const c = new Client({
  connectionString: process.env.DATABASE_URL || process.env.SUPABASE_DB_URL,
});
c.connect()
  .then(() =>
    c.query(
      "SELECT id, name, status, total_count FROM public.get_locations(NULL, NULL, 20, 0)",
    ),
  )
  .then((r) => {
    console.table(r.rows);
    c.end();
  })
  .catch((e) => {
    console.error(e.message);
    c.end();
  });

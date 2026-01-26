const path = require("path");
const { Client } = require("pg");
require("dotenv").config({ path: path.resolve(process.cwd(), ".env") });

const email = process.argv[2];
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

(async () => {
  const client = new Client({ connectionString });
  await client.connect();
  try {
    console.log("Listing auth schema tables...");
    const tablesRes = await client.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'auth' ORDER BY table_name`,
    );
    const tables = tablesRes.rows.map((r) => r.table_name);
    console.table(tables);

    if (email) {
      console.log(
        `\nSearching for rows containing email: ${email} in auth.* tables`,
      );
      for (const t of tables) {
        try {
          const q = await client.query(
            `SELECT * FROM auth."${t}" WHERE email ILIKE $1 OR (raw_user_meta_data->>'email') ILIKE $1 LIMIT 5`,
            [email],
          );
          if (q.rowCount) {
            console.log(`\nTable auth.${t} - matches:`);
            console.table(q.rows);
          }
        } catch (err) {
          // ignore tables without email
        }
      }
    }

    console.log("\nChecking public.sync_auth_user_errors for recent rows");
    const errRes = await client.query(
      `SELECT id, created_at, error_text, new_payload FROM public.sync_auth_user_errors ORDER BY created_at DESC LIMIT 50`,
    );
    console.table(errRes.rows);

    console.log(
      "\nChecking public.sync_auth_user_errors_archive for recent rows",
    );
    const archRes = await client.query(
      `SELECT id, created_at, error_text, new_payload FROM public.sync_auth_user_errors_archive ORDER BY created_at DESC LIMIT 50`,
    );
    console.table(archRes.rows);

    console.log(
      "\nChecking pg_stat_activity for recent failed connections (last 60s)",
    );
    const actRes = await client.query(
      `SELECT pid, usename, application_name, client_addr, backend_start, state, query FROM pg_stat_activity WHERE backend_start > NOW() - INTERVAL '60 seconds' ORDER BY backend_start DESC LIMIT 50`,
    );
    console.table(actRes.rows);
  } catch (err) {
    console.error("Error:", err.message || err);
  } finally {
    await client.end();
  }
})();

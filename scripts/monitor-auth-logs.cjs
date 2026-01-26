const path = require("path");
const { Client } = require("pg");
require("dotenv").config({ path: path.resolve(process.cwd(), ".env") });

const email = process.argv[2] || null; // optional filter
const duration = parseInt(process.argv[3], 10) || 120; // seconds
const interval = parseInt(process.argv[4], 10) || 3; // seconds

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

(async () => {
  const client = new Client({ connectionString });
  await client.connect();
  console.log(
    `Monitoring auth logs for ${duration}s (poll every ${interval}s). Filter email: ${email ?? "none"}`,
  );

  const start = new Date();
  let lastAudit = start.toISOString();
  let lastSyncErr = start.toISOString();
  let lastActivity = start.toISOString();

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const endTime = Date.now() + duration * 1000;

  try {
    while (Date.now() < endTime) {
      // audit_log_entries (payload)
      try {
        const payloadQuery = email
          ? `SELECT id, created_at, payload FROM auth.audit_log_entries WHERE created_at >= $1 AND payload->>'email' ILIKE $2 ORDER BY created_at DESC LIMIT 50`
          : `SELECT id, created_at, payload FROM auth.audit_log_entries WHERE created_at >= $1 ORDER BY created_at DESC LIMIT 50`;
        const params = email ? [lastAudit, `%${email}%`] : [lastAudit];
        const a = await client.query(payloadQuery, params);
        if (a.rowCount) {
          console.log("\n== New auth.audit_log_entries ==");
          console.table(
            a.rows.map((r) => ({
              id: r.id,
              created_at: r.created_at,
              payload: r.payload,
            })),
          );
          lastAudit = new Date().toISOString();
        }
      } catch (err) {
        console.error("Error querying audit_log_entries:", err.message || err);
      }

      // sync_auth_user_errors
      try {
        const sQuery = `SELECT id, created_at, error_text, new_payload FROM public.sync_auth_user_errors WHERE created_at >= $1 ORDER BY created_at DESC LIMIT 50`;
        const s = await client.query(sQuery, [lastSyncErr]);
        if (s.rowCount) {
          console.log("\n== New sync_auth_user_errors ==");
          console.table(
            s.rows.map((r) => ({
              id: r.id,
              created_at: r.created_at,
              error_text: r.error_text,
              new_payload: r.new_payload,
            })),
          );
          lastSyncErr = new Date().toISOString();
        }
      } catch (err) {
        console.error(
          "Error querying sync_auth_user_errors:",
          err.message || err,
        );
      }

      // pg_stat_activity recent active queries (last interval*2 seconds)
      try {
        const actQ = `SELECT pid, usename, application_name, client_addr, backend_start, state, query FROM pg_stat_activity WHERE backend_start >= NOW() - INTERVAL '1 minute' ORDER BY backend_start DESC LIMIT 50`;
        const act = await client.query(actQ);
        if (act.rowCount) {
          // Print only if something new by timestamp
          const recent = act.rows.filter(
            (r) => new Date(r.backend_start) > new Date(lastActivity),
          );
          if (recent.length) {
            console.log("\n== Recent pg_stat_activity entries ==");
            console.table(
              recent.map((r) => ({
                pid: r.pid,
                usename: r.usename,
                application_name: r.application_name,
                client_addr: r.client_addr,
                backend_start: r.backend_start,
                state: r.state,
                query: r.query
                  ? r.query.length > 120
                    ? r.query.slice(0, 120) + "..."
                    : r.query
                  : "",
              })),
            );
            lastActivity = new Date().toISOString();
          }
        }
      } catch (err) {
        console.error("Error querying pg_stat_activity:", err.message || err);
      }

      await sleep(interval * 1000);
    }
    console.log("\nMonitoring finished.");
  } catch (err) {
    console.error("Fatal error in monitor loop:", err.message || err);
  } finally {
    await client.end();
  }
})();

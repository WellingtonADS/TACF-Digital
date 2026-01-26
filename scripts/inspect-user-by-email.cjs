const fs = require("fs");
const path = require("path");
const { Client } = require("pg");
require("dotenv").config({ path: path.resolve(process.cwd(), ".env") });

const emailArg = process.argv[2];
if (!emailArg) {
  console.error(
    "Usage: node scripts/inspect-user-by-email.cjs <email-or-pattern>",
  );
  process.exit(1);
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL not set in .env");
  process.exit(1);
}

(async () => {
  const client = new Client({ connectionString });
  await client.connect();

  try {
    console.log("Reading auth.users columns...");
    const colsRes = await client.query(
      `SELECT column_name FROM information_schema.columns WHERE table_schema='auth' AND table_name='users' ORDER BY ordinal_position`,
    );
    const cols = colsRes.rows.map((r) => r.column_name);
    console.log("auth.users columns:", cols.join(", "));

    const desired = [
      "id",
      "email",
      "aud",
      "created_at",
      "email_confirmed_at",
      "raw_user_meta_data",
      "user_metadata",
    ];
    const selectCols = desired.filter((c) => cols.includes(c));
    if (selectCols.length === 0) selectCols.push("id", "email");

    console.log(
      "Searching auth.users for:",
      emailArg,
      "selecting:",
      selectCols.join(", "),
    );

    const uRes = await client.query(
      `SELECT ${selectCols.join(", ")} FROM auth.users WHERE email ILIKE $1`,
      [emailArg],
    );
    console.log("auth.users rows:", uRes.rowCount);
    console.table(uRes.rows);

    for (const u of uRes.rows) {
      const uid = u.id;
      const pRes = await client.query(
        `SELECT id, email, saram, full_name, rank, semester, created_at FROM public.profiles WHERE id = $1 OR email ILIKE $2`,
        [uid, emailArg],
      );
      console.log("\nprofiles rows for user id", uid, ":", pRes.rowCount);
      console.table(pRes.rows);

      const bRes = await client.query(
        `SELECT id, session_id, status, created_at FROM public.bookings WHERE user_id = $1`,
        [uid],
      );
      console.log("\nbookings count for user id", uid, ":", bRes.rowCount);
      if (bRes.rowCount) console.table(bRes.rows);

      const sRes = await client.query(
        `SELECT id, booking_id, requested_by, new_session_id, status, created_at FROM public.swap_requests WHERE requested_by = $1 OR processed_by = $1`,
        [uid],
      );
      console.log("\nswap_requests count for user id", uid, ":", sRes.rowCount);
      if (sRes.rowCount) console.table(sRes.rows);

      const errRes = await client.query(
        `SELECT id, created_at, error_text, new_payload FROM public.sync_auth_user_errors WHERE (new_payload->>'id') = $1 OR (new_payload->>'email') ILIKE $2 ORDER BY created_at DESC LIMIT 20`,
        [uid, emailArg],
      );
      console.log(
        "\nsync_auth_user_errors rows for user id",
        uid,
        ":",
        errRes.rowCount,
      );
      if (errRes.rowCount) console.table(errRes.rows);

      // Check for any FK referencing this auth user id in other tables
      const fkRes = await client.query(
        `SELECT t.table_schema, t.table_name, kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage ccu
          ON ccu.constraint_name = tc.constraint_name
        JOIN information_schema.tables t
          ON t.table_name = tc.table_name AND t.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY' AND ccu.column_name = 'id' AND ccu.table_name = 'users'
        ORDER BY t.table_schema, t.table_name;`,
      );
      console.log("\nForeign key targets referencing auth.users.id:");
      console.table(fkRes.rows);
    }

    if (uRes.rowCount === 0) {
      console.log(
        "No matching auth.users found. You may have already deleted test users.",
      );
    }
  } catch (err) {
    console.error("Error:", err.message || err);
  } finally {
    await client.end();
  }
})();

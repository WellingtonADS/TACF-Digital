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

    console.log("\n===== DB MIGRATION EFFECTS REPORT =====\n");

    // Tables
    const tables = await client.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name`,
    );
    console.log("Tables in public schema:");
    console.log(tables.rows.map((r) => ` - ${r.table_name}`).join("\n"));

    // Key columns
    const keyTables = ["profiles", "sessions", "bookings", "swap_requests"];
    for (const t of keyTables) {
      const cols = await client.query(
        `SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_schema='public' AND table_name=$1 ORDER BY ordinal_position`,
        [t],
      );
      console.log(`\nColumns in ${t}:`);
      if (cols.rowCount === 0) console.log(" - (table not found)");
      else
        console.log(
          cols.rows
            .map(
              (c) =>
                ` - ${c.column_name} : ${c.data_type} ${c.is_nullable === "NO" ? "NOT NULL" : ""}`,
            )
            .join("\n"),
        );
    }

    // Indexes
    const idx = await client.query(
      `SELECT indexname, indexdef FROM pg_indexes WHERE schemaname='public' ORDER BY indexname`,
    );
    console.log("\nIndexes (public):");
    console.log(idx.rows.map((r) => ` - ${r.indexname}`).join("\n"));

    // Functions of interest
    const funcsToCheck = [
      "book_session",
      "confirmar_agendamento",
      "approve_swap",
      "get_sessions_availability",
    ];
    for (const f of funcsToCheck) {
      const res = await client.query(
        `SELECT proname, pg_get_functiondef(p.oid) as def FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE p.proname = $1`,
        [f],
      );
      console.log(`\nFunction '${f}': found: ${res.rowCount}`);
      if (res.rowCount > 0) {
        console.log(res.rows[0].def.split("\n").slice(0, 20).join("\n"));
      }
    }

    // Triggers (and definitions)
    const triggers = await client.query(
      `SELECT tgname, tgrelid::regclass::text as table_name, pg_get_triggerdef(oid) as def FROM pg_trigger WHERE NOT tgisinternal ORDER BY tgname`,
    );
    console.log("\nTriggers (user-defined):");
    if (triggers.rowCount === 0) console.log(" - none");
    else {
      for (const r of triggers.rows) {
        console.log(` - ${r.tgname} on ${r.table_name}`);
        console.log(r.def);
      }
    }

    // Policies (RLS, show qual/with_check)
    const policies = await client.query(
      `SELECT schemaname, tablename, policyname, permissive, roles, qual, with_check as withcheck FROM pg_policies WHERE schemaname='public' ORDER BY tablename, policyname`,
    );
    console.log("\nRLS Policies (public):");
    if (policies.rowCount === 0) console.log(" - none");
    else {
      for (const p of policies.rows) {
        console.log(
          ` - ${p.tablename} :: ${p.policyname} [roles=${p.roles}] permissive=${p.permissive}`,
        );
        console.log(`   qual: ${p.qual}`);
        console.log(`   with_check: ${p.withcheck}`);
      }
    }

    // Specific migration-created tables
    const checks = [
      { name: "sync_auth_user_errors", type: "table" },
      { name: "auth_inserts", type: "table" },
      { name: "sync_auth_user_audit", type: "table" },
    ];
    for (const ck of checks) {
      const r = await client.query(
        `SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=$1`,
        [ck.name],
      );
      console.log(`\nMigration table '${ck.name}': exists: ${r.rowCount > 0}`);
    }

    // Sample data counts and sanity checks
    const profileCount = await client.query(
      `SELECT count(*) as c FROM public.profiles`,
    );
    const inactiveCount = await client.query(
      `SELECT count(*) as c FROM public.profiles WHERE active IS FALSE`,
    );
    console.log(
      `\nProfiles total: ${profileCount.rows[0].c}  | inactive: ${inactiveCount.rows[0].c}`,
    );

    // Example: are there profiles with null semester? (shouldn't)
    const nullSemester = await client.query(
      `SELECT count(*) as c FROM public.profiles WHERE semester IS NULL`,
    );
    console.log(`Profiles with NULL semester: ${nullSemester.rows[0].c}`);

    // List columns added by migrations that we care about
    const colChecks = ["email", "active"];
    for (const c of colChecks) {
      const r = await client.query(
        `SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name=$1`,
        [c],
      );
      console.log(`profiles.${c}: present: ${r.rowCount > 0}`);
    }

    console.log("\n===== END OF REPORT =====\n");
  } catch (e) {
    console.error("Error:", e.message || e);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
})();

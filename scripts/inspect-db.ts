import dotenv from "dotenv";
import path from "path";
import { Client } from "pg";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });
const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL not set in .env");

async function run() {
  const client = new Client({ connectionString });
  await client.connect();
  try {
    console.log("=== ENUMS ===");
    const enums = await client.query(
      `SELECT n.nspname AS schema, t.typname AS name, array_agg(e.enumlabel ORDER BY e.enumsortorder) AS values
       FROM pg_type t
       JOIN pg_enum e ON t.oid = e.enumtypid
       JOIN pg_namespace n ON t.typnamespace = n.oid
       GROUP BY n.nspname, t.typname
       ORDER BY t.typname;`,
    );
    for (const r of enums.rows) {
      // handle array returned either as JS array or Postgres array string like '{a,b}'
      let vals: string[] = [];
      if (Array.isArray(r.values)) vals = r.values;
      else if (
        typeof r.values === "string" &&
        r.values.startsWith("{") &&
        r.values.endsWith("}")
      ) {
        vals = r.values
          .slice(1, -1)
          .split(",")
          .map((s: string) => s.replace(/^"|"$/g, ""));
      } else if (r.values) vals = [String(r.values)];
      console.log(`${r.schema}.${r.name}: ${vals.join(", ")}`);
    }

    console.log("\n=== TABLES (public) ===");
    const tables = await client.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;`,
    );
    for (const r of tables.rows) console.log(r.table_name);

    console.log("\n=== COLUMNS (bookings, sessions, profiles) ===");
    const cols = await client.query(
      `SELECT table_name, column_name, data_type FROM information_schema.columns
       WHERE table_schema='public' AND table_name IN ('bookings','sessions','profiles')
       ORDER BY table_name, ordinal_position;`,
    );
    for (const r of cols.rows)
      console.log(`${r.table_name}.${r.column_name} -> ${r.data_type}`);

    console.log("\n=== FUNCTIONS (public) ===");
    const funcs = await client.query(
      `SELECT p.oid, n.nspname, p.proname, pg_get_function_arguments(p.oid) AS args, pg_get_functiondef(p.oid) AS def, pg_get_userbyid(p.proowner) AS owner, p.prosecdef
       FROM pg_proc p
       JOIN pg_namespace n ON p.pronamespace = n.oid
       WHERE n.nspname = 'public'
       ORDER BY p.proname;`,
    );
    for (const r of funcs.rows) {
      console.log(
        `- ${r.proname} (owner: ${r.owner}, secdef: ${r.prosecdef}) args: ${r.args}`,
      );
    }

    console.log("\n=== CONSTRAINTS (bookings) ===");
    const cons = await client.query(
      `SELECT conname, contype, pg_get_constraintdef(c.oid) AS def
       FROM pg_constraint c
       JOIN pg_class t ON c.conrelid = t.oid
       WHERE t.relname = 'bookings';`,
    );
    for (const r of cons.rows)
      console.log(`${r.conname} (${r.contype}) => ${r.def}`);

    console.log("\n=== CHECK CONSTRAINTS (sessions) ===");
    const checks = await client.query(
      `SELECT conname, pg_get_constraintdef(c.oid) AS def
       FROM pg_constraint c
       JOIN pg_class t ON c.conrelid = t.oid
       WHERE t.relname = 'sessions' AND c.contype = 'c';`,
    );
    for (const r of checks.rows) console.log(`${r.conname} => ${r.def}`);

    console.log("\n=== RLS POLICIES (public schema) ===");
    const policies = await client.query(
      `SELECT polname, polrelid::regclass::text AS table_name, polcmd, polpermissive, polroles::text, polqual::text, polwithcheck::text
       FROM pg_policy
       WHERE polrelid IN (
         SELECT oid FROM pg_class WHERE relnamespace = 'public'::regnamespace
       )
       ORDER BY table_name, polname;`,
    );
    if (policies.rowCount === 0)
      console.log("No policies found in public schema");
    for (const r of policies.rows)
      console.log(
        `${r.table_name} - ${r.polname} => cmd=${r.polcmd} roles=${r.polroles} qual=${r.polqual} withcheck=${r.polwithcheck}`,
      );
  } finally {
    await client.end();
  }
}

run().catch((e) => {
  console.error("Error:", e.message);
  process.exit(1);
});

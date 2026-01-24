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
    console.log("Checking check-constraints on table public.sessions");

    const res = await client.query(
      `SELECT c.oid, c.conname, pg_get_constraintdef(c.oid) as def
       FROM pg_constraint c
       JOIN pg_class t ON c.conrelid = t.oid
       WHERE t.relname = 'sessions' AND c.contype = 'c'
       ORDER BY c.conname;`,
    );

    if (res.rowCount === 0) {
      console.log("No check constraints found on sessions");
      return;
    }

    for (const r of res.rows) {
      console.log(`- ${r.conname} => ${r.def}`);
    }

    // Check if 'scopes' column exists
    const col = await client.query(
      `SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='sessions' AND column_name='scopes'`,
    );
    const scopesExists = col.rowCount > 0;
    console.log(`\nColumn 'scopes' exists on sessions: ${scopesExists}`);

    // Decide actions: drop duplicate capacity constraint and drop scopes constraint if column missing
    const dropCandidates: string[] = [];
    // If both capacity constraints exist and are identical, pick one to drop
    const capacityConstraints = res.rows.filter((r: any) =>
      /max_capacity/.test(r.def),
    );
    if (capacityConstraints.length > 1) {
      console.log("\nFound multiple max_capacity constraints:");
      capacityConstraints.forEach((c: any) => console.log(`  - ${c.conname}`));
      // choose the one with name different from 'sessions_capacity_check' to drop, favor keeping 'sessions_capacity_check'
      const toDrop = capacityConstraints
        .filter((c: any) => c.conname !== "sessions_capacity_check")
        .map((c: any) => c.conname);
      dropCandidates.push(...toDrop);
    }

    // If a constraint references scopes but the column doesn't exist, drop it
    const scopesConstraints = res.rows.filter((r: any) => /scopes/.test(r.def));
    if (scopesConstraints.length > 0 && !scopesExists) {
      console.log("\nFound scopes constraints but column missing:");
      scopesConstraints.forEach((c: any) =>
        console.log(`  - ${c.conname} => ${c.def}`),
      );
      dropCandidates.push(...scopesConstraints.map((c: any) => c.conname));
    }

    if (dropCandidates.length === 0) {
      console.log(
        "\nNo constraints to drop automatically. Manual review may be needed.",
      );
      return;
    }

    console.log(`\nDropping constraints: ${dropCandidates.join(", ")}`);

    await client.query("BEGIN");
    try {
      for (const name of dropCandidates) {
        console.log(`Dropping constraint ${name} on public.sessions`);
        await client.query(
          `ALTER TABLE public.sessions DROP CONSTRAINT IF EXISTS "${name}"`,
        );
      }
      await client.query("COMMIT");
      console.log("✅ Constraints dropped successfully");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    }
  } finally {
    await client.end();
  }
}

run().catch((e) => {
  console.error("Error:", e.message);
  process.exit(1);
});

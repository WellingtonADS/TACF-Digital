require("dotenv").config();
const { Client } = require("pg");

async function main() {
  const databaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL not found in env");
    process.exit(1);
  }

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    await client.query("BEGIN");

    // Add title to sessions
    await client.query(
      `ALTER TABLE IF EXISTS public.sessions ADD COLUMN IF NOT EXISTS title text;`,
    );

    // Add metadata JSONB to sessions and bookings
    await client.query(
      `ALTER TABLE IF EXISTS public.sessions ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;`,
    );
    await client.query(
      `ALTER TABLE IF EXISTS public.bookings ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;`,
    );

    // Add capacity column (some tests use 'capacity' instead of max_capacity)
    await client.query(
      `ALTER TABLE IF EXISTS public.sessions ADD COLUMN IF NOT EXISTS capacity integer;`,
    );
    // If capacity is null and max_capacity exists, populate it
    await client.query(
      `UPDATE public.sessions SET capacity = max_capacity WHERE capacity IS NULL AND max_capacity IS NOT NULL;`,
    );

    // Add title to other tables if needed (no-op if exists)
    await client.query(
      `ALTER TABLE IF EXISTS public.sessions ADD COLUMN IF NOT EXISTS summary text;`,
    );

    await client.query("COMMIT");
    console.log("Migrations applied successfully.");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Migration failed:", err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { Client } from "pg";

dotenv.config();

const MIGRATIONS_DIR = path.resolve(process.cwd(), "supabase", "migrations");
const DATABASE_URL =
  process.env.DATABASE_URL ||
  process.env.SUPABASE_DB_URL ||
  process.env.SUPABASE_URL;

if (!DATABASE_URL) {
  console.error(
    "DATABASE_URL or SUPABASE_DB_URL must be set in .env to run migrations.",
  );
  process.exit(1);
}

async function applyMigration(file) {
  const sql = fs.readFileSync(file, "utf8");
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();
  try {
    console.log(`Applying ${path.basename(file)}...`);
    await client.query("BEGIN");
    await client.query(sql);
    await client.query("COMMIT");
    console.log(`Applied ${path.basename(file)}`);
  } catch (e) {
    await client.query("ROLLBACK");
    console.error(`Error applying ${path.basename(file)}:`, e.message || e);
    throw e;
  } finally {
    await client.end();
  }
}

async function main() {
  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  for (const file of files) {
    const full = path.join(MIGRATIONS_DIR, file);
    try {
      await applyMigration(full);
    } catch (e) {
      console.error("Migration failed, aborting.");
      process.exit(1);
    }
  }
  console.log("All migrations applied.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

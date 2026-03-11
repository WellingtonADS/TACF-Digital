#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
require("dotenv").config();
const { Client } = require("pg");

async function main() {
  const dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
  if (!dbUrl) {
    console.error("ERROR: DATABASE_URL not set in environment.");
    process.exit(1);
  }

  const client = new Client({ connectionString: dbUrl });
  await client.connect();

  try {
    const migrationsDir = path.resolve(process.cwd(), "supabase", "migrations");
    if (!fs.existsSync(migrationsDir)) {
      console.error("No supabase/migrations directory found.");
      process.exit(0);
    }

    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    if (files.length === 0) {
      console.log("No .sql files found in supabase/migrations.");
      process.exit(0);
    }

    for (const file of files) {
      const full = path.join(migrationsDir, file);
      console.log(`Applying migration: ${file}`);
      const sql = fs.readFileSync(full, "utf8");
      try {
        await client.query("BEGIN");
        await client.query(sql);
        await client.query("COMMIT");
        console.log(`✓ Applied ${file}`);
      } catch (err) {
        await client.query("ROLLBACK");
        console.error(`✗ Failed to apply ${file}:`, err.message || err);
        process.exit(1);
      }
    }

    console.log("\nAll migrations applied successfully.");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});

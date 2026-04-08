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
    const applySqlDirectory = async (dirPath, label) => {
      if (!fs.existsSync(dirPath)) {
        console.warn(`No ${label} directory found at ${dirPath}. Skipping.`);
        return;
      }

      const files = fs
        .readdirSync(dirPath)
        .filter((file) => file.endsWith(".sql"))
        .sort();

      if (files.length === 0) {
        console.log(`No .sql files found in ${label}.`);
        return;
      }

      for (const file of files) {
        const full = path.join(dirPath, file);
        console.log(`Applying ${label}: ${full}`);
        const sql = fs.readFileSync(full, "utf8");
        try {
          await client.query("BEGIN");
          await client.query(sql);
          await client.query("COMMIT");
          console.log(`Applied ${file}`);
        } catch (err) {
          await client.query("ROLLBACK");
          console.error(`Failed to apply ${file}:`, err.message || err);
          throw err;
        }
      }
    };

    const migrationsDir = path.resolve(process.cwd(), "supabase", "migrations");
    const rpcDir = path.resolve(process.cwd(), "supabase", "rpc");

    await applySqlDirectory(migrationsDir, "migrations");
    await applySqlDirectory(rpcDir, "RPCs");

    console.log("Done applying migrations and RPC SQL files.");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

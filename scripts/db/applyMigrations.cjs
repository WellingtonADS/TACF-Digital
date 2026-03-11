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
    const rpcDir = path.resolve(process.cwd(), "supabase", "rpc");
    if (!fs.existsSync(rpcDir)) {
      console.error("No supabase/rpc directory found. Nothing to apply.");
      process.exit(0);
    }

    const files = fs
      .readdirSync(rpcDir)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    if (files.length === 0) {
      console.log("No .sql files found in supabase/rpc.");
      process.exit(0);
    }

    for (const file of files) {
      const full = path.join(rpcDir, file);
      console.log(`Applying: ${full}`);
      const sql = fs.readFileSync(full, "utf8");
      try {
        await client.query("BEGIN");
        await client.query(sql);
        await client.query("COMMIT");
        console.log(`Applied ${file}`);
      } catch (err) {
        await client.query("ROLLBACK");
        console.error(`Failed to apply ${file}:`, err.message || err);
      }
    }

    console.log("Done applying RPC SQL files.");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

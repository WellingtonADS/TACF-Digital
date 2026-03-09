#!/usr/bin/env node
/*
  runSingleMigration.cjs
  - Executa um único arquivo SQL usando a string de conexão encontrada em .env (DATABASE_URL / SUPABASE_DB_URL / PG*).
  - Uso: node scripts/db/runSingleMigration.cjs <path-to-sql>
*/

const fs = require("fs");
const path = require("path");
const { Client } = require("pg");
require("dotenv").config();

function getConnectionString() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  if (process.env.SUPABASE_DB_URL) return process.env.SUPABASE_DB_URL;
  if (process.env.PGHOST) {
    const host = process.env.PGHOST;
    const port = process.env.PGPORT || 5432;
    const user = process.env.PGUSER || process.env.USER || "";
    const password = process.env.PGPASSWORD || "";
    const database = process.env.PGDATABASE || "";
    return `postgresql://${user}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
  }
  return null;
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error(
      "Usage: node scripts/db/runSingleMigration.cjs <path-to-sql>",
    );
    process.exit(2);
  }

  const sqlPath = path.resolve(process.cwd(), args[0]);
  if (!fs.existsSync(sqlPath)) {
    console.error("SQL file not found:", sqlPath);
    process.exit(2);
  }

  const conn = getConnectionString();
  if (!conn) {
    console.error(
      "Connection string not found. Configure DATABASE_URL or PG* env vars.",
    );
    process.exit(2);
  }

  const client = new Client({ connectionString: conn });
  try {
    await client.connect();
    const sql = fs.readFileSync(sqlPath, "utf8");
    console.log("Executing SQL file:", sqlPath);
    await client.query("BEGIN");
    await client.query(sql);
    await client.query("COMMIT");
    console.log("Migration applied successfully.");
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch (e) {}
    console.error("Error applying migration:", err.message || err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();

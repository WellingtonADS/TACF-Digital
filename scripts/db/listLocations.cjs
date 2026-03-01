#!/usr/bin/env node
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
  const conn = getConnectionString();
  if (!conn) {
    console.error("No connection string");
    process.exit(2);
  }
  const client = new Client({ connectionString: conn });
  try {
    await client.connect();
    const res = await client.query(
      `SELECT id, name, address, status, created_at FROM public.locations ORDER BY created_at DESC LIMIT 20`,
    );
    console.log("Latest locations:");
    console.table(res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

main();

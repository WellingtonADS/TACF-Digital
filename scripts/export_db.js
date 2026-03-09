/*
Node.js script to export all tables to CSV files and dump policies/RPCs.
Uses CONNECTION string from environment variable DATABASE_URL (same as .env)
Requires `pg` package (already a dependency).

Usage:
  node scripts/export_db.js

Outputs:
  exports/tables/<schema>.<table>.csv
  exports/policies.sql
  exports/rpc_functions.sql
*/

import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { Client } from "pg";

// load environment variables from .env file if present
dotenv.config();

async function main() {
  const conn = process.env.DATABASE_URL;
  if (!conn) {
    console.error("Please set DATABASE_URL in environment");
    process.exit(1);
  }

  const client = new Client({ connectionString: conn });
  await client.connect();

  const exportDir = path.resolve("exports");
  const tablesDir = path.join(exportDir, "tables");
  fs.mkdirSync(tablesDir, { recursive: true });

  // list tables
  const { rows: tables } = await client.query(`
    SELECT table_schema, table_name
    FROM information_schema.tables
    WHERE table_type='BASE TABLE'
      AND table_schema NOT IN ('pg_catalog','information_schema')
    ORDER BY table_schema, table_name;
  `);

  for (const { table_schema, table_name } of tables) {
    const schemaDir = path.join(tablesDir, table_schema);
    fs.mkdirSync(schemaDir, { recursive: true });
    const filename = path.join(schemaDir, `${table_schema}.${table_name}.csv`);
    console.log("exporting", table_schema + "." + table_name);
    const stream = fs.createWriteStream(filename);
    // try COPY first (may fail for partitioned tables)
    let data;
    try {
      const copyQuery = `COPY \"${table_schema}\".\"${table_name}\" TO STDOUT WITH CSV HEADER`;
      await client.query(copyQuery);
      // COPY to STDOUT is not streaming content easily in this simple script,
      // so intentionally fall through to SELECT fallback below
      throw new Error("skip-copy");
    } catch (err) {
      // ignore errors; we'll fetch via SELECT instead
    }
    // select fallback
    const sel = await client.query(
      `SELECT * FROM \"${table_schema}\".\"${table_name}\"`,
    );
    data = sel.rows;
    if (data.length === 0) {
      // write header only
      const { rows: colsInfo } = await client.query(
        `
        SELECT column_name FROM information_schema.columns
        WHERE table_schema=$1 AND table_name=$2 ORDER BY ordinal_position`,
        [table_schema, table_name],
      );
      const hdr = colsInfo.map((r) => r.column_name).join(",") + "\n";
      stream.write(hdr);
    } else {
      const hdr = Object.keys(data[0]).join(",") + "\n";
      stream.write(hdr);
      for (const row of data) {
        const line =
          Object.values(row)
            .map((v) => {
              if (v == null) return "";
              return String(v).replace(/"/g, '""');
            })
            .join(",") + "\n";
        stream.write(line);
      }
    }
    stream.end();
  }

  // policies
  const { rows: policies } = await client.query(`
    SELECT
      'CREATE POLICY ' || quote_ident(pol.polname) || ' ON ' || quote_ident(ns.nspname) || '.' || quote_ident(c.relname) ||
      ' FOR ' || (CASE pol.polcmd WHEN 'r' THEN 'SELECT' WHEN 'a' THEN 'INSERT' WHEN 'u' THEN 'UPDATE' WHEN 'd' THEN 'DELETE' WHEN 't' THEN 'TRUNCATE' END) ||
      ' TO ' || COALESCE(array_to_string(ARRAY(SELECT quote_ident(r::text) FROM unnest(pol.polroles) as r), ', '), 'PUBLIC') ||
      (CASE WHEN pg_get_expr(pol.polqual, pol.polrelid) IS NOT NULL THEN ' USING (' || pg_get_expr(pol.polqual, pol.polrelid) || ')' ELSE '' END) ||
      (CASE WHEN pg_get_expr(pol.polwithcheck, pol.polrelid) IS NOT NULL THEN ' WITH CHECK (' || pg_get_expr(pol.polwithcheck, pol.polrelid) || ')' ELSE '' END) || ';' AS policy_sql
    FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace ns ON ns.oid = c.relnamespace
    ORDER BY ns.nspname, c.relname, pol.polname;
  `);
  const policiesFile = path.join(exportDir, "policies.sql");
  fs.writeFileSync(
    policiesFile,
    policies
      .map((r) => r.policy_sql)
      .filter(Boolean)
      .join("\n"),
  );

  // functions/RPCs
  const { rows: funcs } = await client.query(`
    SELECT pg_get_functiondef(p.oid) AS def
    FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname NOT IN ('pg_catalog','information_schema')
    ORDER BY n.nspname, p.proname;
  `);
  const rpcFile = path.join(exportDir, "rpc_functions.sql");
  fs.writeFileSync(rpcFile, funcs.map((r) => r.def).join("\n\n"));

  await client.end();
  console.log("exports complete");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { Client } from "pg";

// Loads .env from project root (use .env or configure CI secrets)
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("❌ DATABASE_URL not found in .env");
  process.exit(1);
}

// CLI flags
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run") || args.includes("-n");
const only = args.find((a) => a.startsWith("--only="))?.split("=")[1];

function resolveFiles(): string[] {
  const root = process.cwd();
  const files: string[] = [];

  // 1. Schema
  const schema = path.resolve(root, "schema.sql");
  files.push(schema);

  // 2. All migrations in supabase/migrations ordered by filename
  const migrationsDir = path.resolve(root, "supabase/migrations");
  if (fs.existsSync(migrationsDir)) {
    const ms = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith(".sql"))
      .sort()
      .map((f) => path.resolve(migrationsDir, f));
    files.push(...ms);
  }

  // 3. RPC functions
  const rpcDir = path.resolve(root, "supabase/rpc");
  if (fs.existsSync(rpcDir)) {
    const rs = fs
      .readdirSync(rpcDir)
      .filter((f) => f.endsWith(".sql"))
      .sort()
      .map((f) => path.resolve(rpcDir, f));
    files.push(...rs);
  }

  // 4. Policies (apply last)
  const policiesDir = path.resolve(root, "supabase/policies");
  if (fs.existsSync(policiesDir)) {
    const ps = fs
      .readdirSync(policiesDir)
      .filter((f) => f.endsWith(".sql"))
      .sort()
      .map((f) => path.resolve(policiesDir, f));
    files.push(...ps);
  }

  // If user requested a single file
  if (only) {
    const onlyPath = path.resolve(root, only);
    if (fs.existsSync(onlyPath)) return [onlyPath];
    console.warn("⚠️ --only specified but file not found:", onlyPath);
  }

  return files;
}

async function run() {
  const files = resolveFiles();

  if (files.length === 0) {
    console.error("❌ No SQL files found to apply");
    process.exit(1);
  }

  console.log(
    `🔍 Applying ${files.length} SQL file(s)` + (dryRun ? " (dry-run)" : ""),
  );

  const client = new Client({ connectionString });
  try {
    if (!dryRun) await client.connect();

    for (const f of files) {
      if (!fs.existsSync(f)) {
        console.warn("⚠️  SQL file not found, skipping:", f);
        continue;
      }
      const rel = path.relative(process.cwd(), f);
      const sql = fs.readFileSync(f, "utf8");
      console.log(`📁 ${dryRun ? "Would execute" : "Executing"}: ${rel}`);
      if (!dryRun) {
        try {
          await client.query(sql);
        } catch (err) {
          // Surface file-level error and stop
          const message = err instanceof Error ? err.message : String(err);
          console.error(`❌ Error executing ${rel}:`, message);
          throw err;
        }
      }
    }

    if (!dryRun) console.log("✅ All DB scripts applied");
    else console.log("✅ Dry-run complete. No changes applied.");
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("❌ Error applying DB scripts:", message);
    process.exit(1);
  } finally {
    if (!dryRun) await client.end();
  }
}

run();

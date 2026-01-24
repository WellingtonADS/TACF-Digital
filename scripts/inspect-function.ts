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
    const res = await client.query(
      "SELECT p.oid, p.proname, pg_get_functiondef(p.oid) as def, pg_get_function_arguments(p.oid) as args, p.prorettype FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE p.proname = 'book_session';"
    );
    console.log("Found", res.rowCount, "functions named book_session");
    for (const r of res.rows) {
      console.log("---- OID:", r.oid, "name:", r.proname, "----");
      console.log(r.def);
      console.log("--------------------------------------------\n");
    }
  } finally {
    await client.end();
  }
}

run().catch((e) => {
  console.error("Error:", e.message);
  process.exit(1);
});

import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { Client } from "pg";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("❌ DATABASE_URL not found in .env");
  process.exit(1);
}

const sqlPath = path.resolve(process.cwd(), "tests.sql");
if (!fs.existsSync(sqlPath)) {
  console.error("❌ tests.sql not found in project root");
  process.exit(1);
}

const sql = fs.readFileSync(sqlPath, "utf8");

async function run() {
  const client = new Client({ connectionString });

  client.on("notice", (msg) => {
    console.log("NOTICE:", msg.message);
  });

  try {
    console.log("🔌 Connecting to database...");
    await client.connect();
    console.log("📁 Executing tests.sql... (this may take a few seconds)");

    await client.query(sql);
    console.log("✅ tests.sql executed successfully");
  } catch (err: unknown) {
    const e = err as { message?: string; code?: string; position?: string };
    console.error("❌ Error executing tests.sql:", e.message ?? String(err));
    if (e.code) console.error("SQL Error Code:", e.code);
    if (e.position) {
      const pos = parseInt(e.position, 10);
      console.error("Error position:", pos);
      const head = sql.slice(Math.max(0, pos - 60), pos + 60);
      console.error(
        "\n--- Context around error ---\n",
        head,
        "\n--- End context ---\n",
      );
    }
  } finally {
    await client.end();
  }
}

run();

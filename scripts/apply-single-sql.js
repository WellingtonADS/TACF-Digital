const fs = require("fs");
const path = require("path");
const { Client } = require("pg");
require("dotenv").config({ path: path.resolve(process.cwd(), ".env") });

const fileArg = process.argv[2];
if (!fileArg) {
  console.error("Usage: node scripts/apply-single-sql.js <sql-file>");
  process.exit(1);
}

const fullPath = path.resolve(process.cwd(), fileArg);
if (!fs.existsSync(fullPath)) {
  console.error("SQL file not found:", fullPath);
  process.exit(1);
}

const sql = fs.readFileSync(fullPath, "utf8");
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL not set in .env");
  process.exit(1);
}

(async () => {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log("Executing SQL file:", fileArg);
    await client.query(sql);
    console.log("✅ SQL applied");
  } catch (err) {
    console.error("Error applying SQL:", err.message || err);
    process.exit(1);
  } finally {
    await client.end();
  }
})();

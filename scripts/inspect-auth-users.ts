import dotenv from "dotenv";
import path from "path";
import { Client } from "pg";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });
const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL not set");
(async function () {
  const client = new Client({ connectionString });
  await client.connect();
  try {
    const res = await client.query(
      "SELECT column_name, data_type FROM information_schema.columns WHERE table_schema='auth' AND table_name='users' ORDER BY ordinal_position",
    );
    console.log(res.rows);
  } finally {
    await client.end();
  }
})().catch((e) => {
  console.error("Error:", e.message);
  process.exit(1);
});

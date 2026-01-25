import "dotenv/config";
import { Client } from "pg";

(async () => {
  const connection = process.env.DATABASE_URL;
  if (!connection) return console.error("DATABASE_URL missing");
  const client = new Client({ connectionString: connection });
  await client.connect();
  try {
    const id = "3e50be95-0bb3-4b0f-b28c-cc979401bb00";
    const r = await client.query("select * from public.profiles where id=$1", [
      id,
    ]);
    console.log("profile rows:", r.rows);
  } catch (e) {
    console.error(e);
  } finally {
    await client.end();
  }
})();

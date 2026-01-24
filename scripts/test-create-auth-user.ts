import { randomUUID } from "crypto";
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
    const id = randomUUID();
    const instance_id = randomUUID();
    const raw_user_meta_data = {
      saram: "T" + Math.floor(Math.random() * 100000),
      full_name: "Test User",
      rank: "Soldier",
      semester: "1",
    };
    console.log("Inserting auth.users with id", id);
    const q = `INSERT INTO auth.users (instance_id, id, aud, role, email, raw_user_meta_data, created_at, updated_at) VALUES($1,$2,$3,$4,$5,$6, NOW(), NOW()) RETURNING id`;
    try {
      const res = await client.query(q, [
        instance_id,
        id,
        "authenticated",
        "authenticated",
        `${id}@example.test`,
        raw_user_meta_data,
      ]);
      console.log("Inserted auth.user id", res.rows[0].id);
    } catch (err: any) {
      console.error("Error inserting auth.user:", err.message);
      // print full error
      console.error(err);
      process.exit(1);
    }

    // check for created profile
    const profile = await client.query(
      "SELECT * FROM public.profiles WHERE id=$1",
      [id],
    );
    console.log("Profile rows:", profile.rowCount);
    if (profile.rowCount > 0) console.log(profile.rows[0]);
  } finally {
    await client.end();
  }
})().catch((e) => {
  console.error("Error:", e);
  process.exit(1);
});

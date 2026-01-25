import "dotenv/config";
import { Client } from "pg";

(async () => {
  const connection = process.env.DATABASE_URL;
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin_novo@fab.mil.br";
  if (!connection) {
    console.error("DATABASE_URL missing");
    process.exit(1);
  }
  const client = new Client({ connectionString: connection });
  await client.connect();
  try {
    const authRes = await client.query(
      `SELECT id, email FROM auth.users WHERE email=$1`,
      [adminEmail],
    );
    if (authRes.rowCount === 0) {
      console.error("No auth user found for", adminEmail);
      process.exit(1);
    }
    const user = authRes.rows[0];
    const saram = adminEmail.split("@")[0].toUpperCase();
    const full_name = adminEmail.split("@")[0];
    const role = "admin";
    const semester = "1";
    const upsert = `INSERT INTO public.profiles (id, saram, full_name, rank, role, semester, created_at, updated_at)
    VALUES ($1,$2,$3,$4,$5,$6, now(), now())
    ON CONFLICT (id) DO UPDATE SET saram=EXCLUDED.saram, full_name=EXCLUDED.full_name, rank=EXCLUDED.rank, role=EXCLUDED.role, semester=EXCLUDED.semester, updated_at=now();`;
    await client.query(upsert, [
      user.id,
      saram,
      full_name,
      "Soldier",
      role,
      semester,
    ]);
    console.log("Upserted profile for", adminEmail, "id", user.id);
  } catch (err) {
    console.error("error", err);
  } finally {
    await client.end();
  }
})();

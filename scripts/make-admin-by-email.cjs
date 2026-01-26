const path = require("path");
const { Client } = require("pg");
require("dotenv").config({ path: path.resolve(process.cwd(), ".env") });

const email = process.argv[2];
if (!email) {
  console.error("Usage: node scripts/make-admin-by-email.cjs <email>");
  process.exit(1);
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL not set in .env");
  process.exit(1);
}

(async () => {
  const client = new Client({ connectionString });
  await client.connect();
  try {
    const uRes = await client.query(
      "SELECT id, email, raw_user_meta_data FROM auth.users WHERE email = $1",
      [email],
    );
    if (uRes.rowCount === 0) {
      console.error("Auth user not found for", email);
      process.exit(1);
    }
    const user = uRes.rows[0];
    const uid = user.id;

    // Build sensible defaults
    const saram = email.split("@")[0].toUpperCase();
    const full_name =
      user.raw_user_meta_data && user.raw_user_meta_data.full_name
        ? user.raw_user_meta_data.full_name
        : email.split("@")[0];
    const rank =
      user.raw_user_meta_data && user.raw_user_meta_data.rank
        ? user.raw_user_meta_data.rank
        : "Soldier";
    const semester = "1";

    // Upsert profile with role = 'admin'
    const upsertSql = `INSERT INTO public.profiles (id, saram, full_name, rank, role, semester, email, created_at, updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7, now(), now())
      ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role, email = COALESCE(EXCLUDED.email, public.profiles.email), updated_at = now();`;

    const upRes = await client.query(upsertSql, [
      uid,
      saram,
      full_name,
      rank,
      "admin",
      semester,
      email,
    ]);
    console.log("Profile upserted for", email);

    const check = await client.query(
      `SELECT p.id, p.full_name, p.role, p.email, u.email as auth_email FROM public.profiles p LEFT JOIN auth.users u ON u.id = p.id WHERE p.id = $1`,
      [uid],
    );
    console.table(check.rows);
  } catch (err) {
    console.error("Error:", err.message || err);
    process.exit(1);
  } finally {
    await client.end();
  }
})();

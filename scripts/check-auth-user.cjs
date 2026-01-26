const path = require("path");
const { Client } = require("pg");
require("dotenv").config({ path: path.resolve(process.cwd(), ".env") });

const email = process.argv[2];
if (!email) {
  console.error("Usage: node scripts/check-auth-user.cjs <email>");
  process.exit(1);
}

const client = new Client({ connectionString: process.env.DATABASE_URL });
(async () => {
  await client.connect();
  try {
    const res = await client.query(
      `SELECT id, email, encrypted_password IS NOT NULL AS has_password, last_sign_in_at, banned_until, is_anonymous FROM auth.users WHERE email = $1`,
      [email],
    );
    console.table(res.rows);
  } catch (err) {
    console.error("Error:", err.message || err);
  } finally {
    await client.end();
  }
})();

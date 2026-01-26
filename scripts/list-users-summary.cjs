const path = require("path");
const { Client } = require("pg");
require("dotenv").config({ path: path.resolve(process.cwd(), ".env") });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL not set in .env");
  process.exit(1);
}

(async () => {
  const client = new Client({ connectionString });
  await client.connect();
  try {
    console.log("1) Contagem total de usuários:");
    const tot = await client.query(
      "SELECT COUNT(*)::int AS total FROM auth.users",
    );
    console.table(tot.rows);

    console.log("\n2) Usuários com deleted_at não nulo:");
    const deleted = await client.query(
      "SELECT id, email, deleted_at FROM auth.users WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC LIMIT 50",
    );
    console.table(deleted.rows);

    console.log("\n3) Usuários sem profile (últimos 50):");
    const noProfile = await client.query(
      `SELECT u.id, u.email, u.created_at
       FROM auth.users u
       LEFT JOIN public.profiles p ON p.id = u.id
       WHERE p.id IS NULL
       ORDER BY u.created_at DESC
       LIMIT 50`,
    );
    console.table(noProfile.rows);

    console.log("\n4) Usuários recentes (100):");
    const recent = await client.query(
      `SELECT id, email, role, is_super_admin, is_anonymous, deleted_at, created_at, last_sign_in_at
       FROM auth.users
       ORDER BY created_at DESC
       LIMIT 100`,
    );
    console.table(recent.rows);

    console.log("\n5) Usuários @example.test:");
    const tests = await client.query(
      `SELECT id, email, created_at FROM auth.users WHERE email ILIKE '%@example.test' ORDER BY created_at DESC`,
    );
    console.table(tests.rows);

    console.log(
      "\n6) Erros de sincronização recentes (sync_auth_user_errors):",
    );
    const errs = await client.query(
      `SELECT id, created_at, error_text, new_payload FROM public.sync_auth_user_errors ORDER BY created_at DESC LIMIT 20`,
    );
    console.table(errs.rows);
  } catch (err) {
    console.error("Error:", err.message || err);
  } finally {
    await client.end();
  }
})();

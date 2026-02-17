import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

dotenv.config();

const url = process.env.SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(url, key);

async function main() {
  const test_run_id = `e2e-${randomUUID()}`;
  const userEmail = process.env.SEED_ADMIN_EMAIL || `e2e_user_${Date.now()}@example.com`;
  const userPassword = process.env.SEED_ADMIN_PASSWORD || "Password123!";

  try {
    await supabase.auth.admin.createUser({
      email: userEmail,
      password: userPassword,
      email_confirm: true,
    });
  } catch (e) {
    console.warn('createUser warning', e);
  }

  const { data, error } = await supabase.from("sessions").insert({
    title: "Sessão E2E de Teste",
    starts_at: new Date().toISOString(),
    capacity: 10,
    metadata: { test_run_id },
  }).select();

  if (error) {
    console.error(error);
    process.exit(1);
  }

  console.log(JSON.stringify({ test_run_id, userEmail, userPassword }));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

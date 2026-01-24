import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: process.cwd() + "/.env" });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY as string);

async function run() {
  const email = process.argv[2] || "admin_novo@fab.mil.br";
  const password = process.argv[3] || "12345678";
  try {
    // create user via admin API
    // @ts-ignore
    const res = await (admin as any).auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    console.log("createUser response:", JSON.stringify(res, null, 2));
  } catch (err) {
    console.error("Error creating user:", err);
    process.exit(1);
  }
}

run();

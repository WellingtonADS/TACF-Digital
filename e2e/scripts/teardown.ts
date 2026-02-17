import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const url = process.env.SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(url, key);

async function main() {
  const test_run_id = process.argv[2];
  if (!test_run_id) {
    console.error("Usage: node teardown.js <test_run_id>");
    process.exit(1);
  }

  // apagar bookings, sessions, profiles taggeadas (ajuste conforme schema)
  try {
    await supabase.from("bookings").delete().eq("metadata->>test_run_id", test_run_id);
    await supabase.from("sessions").delete().eq("metadata->>test_run_id", test_run_id);
    await supabase.from("profiles").delete().eq("metadata->>test_run_id", test_run_id);
  } catch (e) {
    console.error('teardown error', e);
    process.exit(1);
  }

  console.log("Teardown done for", test_run_id);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

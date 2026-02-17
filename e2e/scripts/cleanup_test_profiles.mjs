import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(url, key);

async function main() {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  // Encontrar perfis com indicativos de teste (nome, saram padrão, ou recentes)
  const { data: profiles, error: pErr } = await supabase
    .from("profiles")
    .select("id, full_name, saram, created_at")
    .or(`full_name.ilike.%25E2E%25,saram.eq.000000,created_at.gte.${cutoff}`);

  if (pErr) {
    console.error("Error selecting profiles:", pErr);
    process.exit(1);
  }

  if (!profiles || profiles.length === 0) {
    console.log("No test profiles found to cleanup.");
    return;
  }

  const ids = profiles.map((p) => p.id).filter(Boolean);
  console.log(`Found ${ids.length} profile(s) to remove:`, ids);

  // Deletar bookings associados aos perfis
  const { error: delBookingsErr } = await supabase
    .from("bookings")
    .delete()
    .in("user_id", ids);
  if (delBookingsErr) console.error("Error deleting bookings:", delBookingsErr);

  // Deletar perfis
  const { error: delProfilesErr } = await supabase
    .from("profiles")
    .delete()
    .in("id", ids);
  if (delProfilesErr) console.error("Error deleting profiles:", delProfilesErr);

  // Deletar usuários do auth (admin)
  for (const id of ids) {
    try {
      const { error: delUserErr } = await supabase.auth.admin.deleteUser(id);
      if (delUserErr)
        console.warn(
          `Failed to delete auth user ${id}:`,
          delUserErr.message || delUserErr,
        );
      else console.log(`Deleted auth user ${id}`);
    } catch (e) {
      console.warn(`deleteUser threw for ${id}:`, e);
    }
  }

  console.log("Profiles cleanup completed.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

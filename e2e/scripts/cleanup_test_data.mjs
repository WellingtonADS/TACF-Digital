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

  // Encontrar sessões criadas nas últimas 24h ou com títulos de teste conhecidos
  const { data: sessions, error: selErr } = await supabase
    .from("sessions")
    .select("id, title, created_at")
    .or(
      `title.ilike.Sessão%25E2E%25,title.ilike.Sess%C3%A3o%20E2E%25,created_at.gte.${cutoff}`,
    );

  if (selErr) {
    console.error("Error selecting sessions:", selErr);
    process.exit(1);
  }

  if (!sessions || sessions.length === 0) {
    console.log("No test sessions found to cleanup.");
    return;
  }

  const ids = sessions.map((s) => s.id);
  console.log(`Found ${ids.length} session(s) to remove:`, ids);

  // deletar bookings associados
  const { error: delBookingsErr } = await supabase
    .from("bookings")
    .delete()
    .in("session_id", ids);

  if (delBookingsErr) {
    console.error("Error deleting bookings:", delBookingsErr);
    process.exit(1);
  }

  // deletar sessions
  const { error: delSessionsErr } = await supabase
    .from("sessions")
    .delete()
    .in("id", ids);
  if (delSessionsErr) {
    console.error("Error deleting sessions:", delSessionsErr);
    process.exit(1);
  }

  console.log("Cleanup completed for sessions:", ids);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

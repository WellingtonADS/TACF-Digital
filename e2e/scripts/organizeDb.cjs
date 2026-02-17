const dotenv = require("dotenv");
dotenv.config();
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment",
  );
  process.exit(1);
}

const svc = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  try {
    console.log("[organizeDb] Starting DB normalization");

    // 1) Update pending E2E profiles: set full_name, role, active=false, semester='1'
    console.log("[organizeDb] Updating profiles matching e2e.pending%...");
    const updPending = await svc
      .from("profiles")
      .update({
        full_name: "Pending User",
        role: "user",
        active: false,
        semester: "1",
      })
      .ilike("email", "e2e.pending%")
      .select();

    if (updPending.error) {
      console.error(
        "[organizeDb] Error updating pending profiles:",
        updPending.error.message || updPending.error,
      );
    } else {
      console.log(
        "[organizeDb] Pending profiles updated:",
        (updPending.data || []).length,
      );
    }

    // 2) Ensure admin seed profile exists and is active/admin
    console.log("[organizeDb] Ensuring admin profile exists and is active...");
    const updAdmin = await svc
      .from("profiles")
      .update({ full_name: "E2E Admin", role: "admin", active: true })
      .or("email.eq.admin_novo@fab.mil.br,email.ilike.e2e.admin%")
      .select();

    if (updAdmin.error) {
      console.error(
        "[organizeDb] Error updating admin profile:",
        updAdmin.error.message || updAdmin.error,
      );
    } else {
      console.log(
        "[organizeDb] Admin profiles updated:",
        (updAdmin.data || []).length,
      );
    }

    // 3) Normalize bookings: set semester='1' for bookings belonging to e2e users
    console.log("[organizeDb] Fetching e2e profiles to update bookings...");
    const fetchProfiles = await svc
      .from("profiles")
      .select("id,email")
      .ilike("email", "e2e.%");
    if (fetchProfiles.error) throw fetchProfiles.error;
    const ids = (fetchProfiles.data || []).map((p) => p.id).filter(Boolean);
    console.log("[organizeDb] Found", ids.length, "e2e profiles");

    if (ids.length > 0) {
      const updBookings = await svc
        .from("bookings")
        .update({ semester: "1" })
        .in("user_id", ids)
        .select();

      if (updBookings.error) {
        console.error(
          "[organizeDb] Error updating bookings:",
          updBookings.error.message || updBookings.error,
        );
      } else {
        console.log(
          "[organizeDb] Bookings updated:",
          (updBookings.data || []).length,
        );
      }
    } else {
      console.log(
        "[organizeDb] No e2e profiles found, skipping bookings update",
      );
    }

    // 4) Show sample results
    console.log("[organizeDb] Fetching sample profiles...");
    const sampleProfiles = await svc
      .from("profiles")
      .select("id,email,full_name,role,active,semester,created_at")
      .ilike("email", "e2e.%")
      .order("created_at", { ascending: false })
      .limit(20);
    if (sampleProfiles.error) throw sampleProfiles.error;
    console.log(
      "[organizeDb] Sample profiles:",
      JSON.stringify(sampleProfiles.data, null, 2),
    );

    console.log("[organizeDb] Fetching sample bookings...");
    const sampleBookings = await svc
      .from("bookings")
      .select("id,user_id,session_id,status,semester,created_at")
      .in("user_id", ids)
      .order("created_at", { ascending: false })
      .limit(50);
    if (sampleBookings.error) throw sampleBookings.error;
    console.log(
      "[organizeDb] Sample bookings:",
      JSON.stringify(sampleBookings.data, null, 2),
    );

    console.log("[organizeDb] Done.");
    process.exit(0);
  } catch (err) {
    console.error("[organizeDb] Unexpected error:", err);
    process.exit(1);
  }
})();

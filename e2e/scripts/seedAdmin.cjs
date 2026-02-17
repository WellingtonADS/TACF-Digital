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
    const adminEmail = process.env.SEED_ADMIN_EMAIL || "e2e.admin@example.com";
    const adminPassword = process.env.SEED_ADMIN_PASSWORD || "AdminPass123!";

    console.log("Creating admin user:", adminEmail);
    const created = await svc.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
    });

    if (created.error) {
      // If user exists, Supabase may return an error — log and continue
      console.warn(
        "createUser returned error:",
        created.error.message || created.error,
      );
    } else {
      console.log("createUser succeeded");
    }

    let userId =
      (created && created.data && created.data.user && created.data.user.id) ||
      null;
    if (!userId) {
      // try to find profile by email
      const q = await svc
        .from("profiles")
        .select("id")
        .eq("email", adminEmail)
        .maybeSingle();
      userId = (q && q.data && q.data.id) || null;
    }

    if (!userId) {
      console.error(
        "Could not determine user id for admin. Check supabase responses.",
      );
      process.exit(1);
    }

    console.log("Upserting profile for user id:", userId);
    const { data, error } = await svc
      .from("profiles")
      .upsert({
        id: userId,
        email: adminEmail,
        full_name: "E2E Admin",
        role: "admin",
        rank: "Oficial",
        saram: "000000",
        active: true,
      })
      .select()
      .maybeSingle();

    if (error) {
      console.error("Error upserting profile:", error.message || error);
      process.exit(1);
    }

    console.log("Admin profile ready:", data?.id ?? "ok");
    process.exit(0);
  } catch (err) {
    console.error("Unexpected error:", err);
    process.exit(1);
  }
})();

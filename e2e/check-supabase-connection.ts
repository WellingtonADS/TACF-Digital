import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

(async () => {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.SUPABASE_ANON_KEY;

  console.log("Supabase URL:", url ? url : "(missing)");
  console.log("Service role key present:", !!serviceKey);
  console.log("Anon key present:", !!anonKey);

  if (!url) {
    console.error("SUPABASE_URL is missing; aborting");
    process.exit(1);
  }

  if (serviceKey) {
    const admin = createClient(url, serviceKey);
    try {
      // @ts-ignore
      const res = await (admin as any).auth.admin.listUsers();
      console.log("admin.listUsers response:");
      console.log(JSON.stringify(res, null, 2));
    } catch (err) {
      console.error("admin.listUsers error:");
      console.error(err instanceof Error ? err.message : err);
      try {
        console.error(
          "Full error object:",
          JSON.stringify(err, Object.getOwnPropertyNames(err), 2),
        );
      } catch (e) {
        // ignore
      }
    }
  } else {
    console.warn("SUPABASE_SERVICE_ROLE_KEY not set; skipping admin test");
  }

  if (anonKey) {
    const anon = createClient(url, anonKey);
    try {
      const r = await anon.from("sessions").select("id").limit(1);
      console.log("anon select sessions response:");
      console.log(JSON.stringify(r, null, 2));
    } catch (err) {
      console.error("anon query error:");
      console.error(err instanceof Error ? err.message : err);
    }
  } else {
    console.warn("SUPABASE_ANON_KEY not set; skipping anon query");
  }
})();

import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

(async () => {
  const url = process.env.SUPABASE_URL;
  const anon =
    process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  const id = "3e50be95-0bb3-4b0f-b28c-cc979401bb00";
  if (!url || !anon) {
    console.error("missing env");
    process.exit(1);
  }
  const client = createClient(url, anon);
  const res = await client.from("profiles").select("*").eq("id", id).single();
  console.log("anon fetch profile:", res);
})();

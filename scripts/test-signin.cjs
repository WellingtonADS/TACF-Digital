const path = require("path");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: path.resolve(process.cwd(), ".env") });

const email = process.argv[2];
const password = process.argv[3];
if (!email || !password) {
  console.error("Usage: node scripts/test-signin.cjs <email> <password>");
  process.exit(1);
}

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
if (!url || !key) {
  console.error("Supabase URL/Anon key not set in .env");
  process.exit(1);
}

const supabase = createClient(url, key);

(async () => {
  const res = await supabase.auth.signInWithPassword({ email, password });
  console.log("Result:", JSON.stringify(res, null, 2));
})();

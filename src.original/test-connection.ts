import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types/database.types";

// Load from process.env for Node.js testing
const supabaseUrl =
  process.env.VITE_SUPABASE_URL || "https://tdwommczyiyvkoxjrpzz.supabase.co";
const supabaseKey =
  process.env.VITE_SUPABASE_ANON_KEY ||
  "sb_secret_BdOX5t6is5RcTi7lTOhCDw_NEMVkFv1";

const supabase = createClient<Database>(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log("🔌 Testing Supabase connection...");
  console.log("📍 URL:", supabaseUrl);
  console.log("🔑 Key:", supabaseKey.substring(0, 20) + "...\n");

  try {
    // Test 1: Basic connection
    const { error } = await supabase
      .from("profiles")
      .select("count", { count: "exact", head: true });

    if (error && error.code === "PGRST116") {
      console.log('⚠️  Table "profiles" not found');
      console.log("   → Run schema.sql in Supabase SQL Editor first!\n");
      console.log("   Steps:");
      console.log("   1. Open https://tdwommczyiyvkoxjrpzz.supabase.co");
      console.log("   2. Go to SQL Editor");
      console.log("   3. Copy content from schema.sql");
      console.log("   4. Run the query\n");
      return;
    }

    if (error) {
      console.error("❌ Connection failed:", error.message);
      console.error("   Code:", error.code);
      console.error("   Details:", error.details);
      return;
    }

    console.log("✅ Connection successful!");
    console.log("✅ Database is accessible");
    console.log("✅ Credentials are valid\n");
  } catch (err: unknown) {
    const e = err as { message?: string };
    console.error("❌ Unexpected error:", e.message ?? String(err));
  }
}

testConnection();

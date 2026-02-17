require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");
(async () => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabase = createClient(url, key);
  const test_run_id = "debug-" + Date.now();
  const today = new Date();
  const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  try {
    const res = await supabase.from("sessions").insert({
      title: "debug session",
      date: dateStr,
      period: "morning",
      max_capacity: 5,
      status: "open",
      metadata: { test_run_id },
    });
    console.log("insert result", res);
    const q = await supabase
      .from("sessions")
      .select("*")
      .eq("metadata->>test_run_id", test_run_id);
    console.log("query by metadata", q);
  } catch (e) {
    console.error("err", e);
  }
})();

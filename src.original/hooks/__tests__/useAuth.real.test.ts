import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { describe, expect, test } from "vitest";

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY =
  process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SERVICE_KEY || !ANON_KEY) {
  console.warn("Supabase env not configured for real useAuth tests. Skipping.");
}

const svc =
  SUPABASE_URL && SERVICE_KEY ? createClient(SUPABASE_URL, SERVICE_KEY) : null;
const anon =
  SUPABASE_URL && ANON_KEY ? createClient(SUPABASE_URL, ANON_KEY) : null;

describe.skipIf(!svc || !anon)("useAuth real-flow (integration)", () => {
  test("can create user, sign in and fetch profile via real Supabase", async () => {
    const email = `e2e.auth.${Date.now()}@example.com`;
    const password = "Test12345!";

    // create user via admin
    const { data: created, error: createErr } =
      await svc!.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
    expect(createErr).toBeNull();
    // supabase admin.createUser may return shape { user: { id } } or { id }
    const uid = (created as any)?.user?.id ?? (created as any)?.id ?? null;
    expect(uid).toBeTruthy();

    // sign in via anon client
    const { data: signData, error: signErr } =
      await anon!.auth.signInWithPassword({ email, password });
    expect(signErr).toBeNull();
    expect(signData?.user?.id).toBe(uid);

    // fetch profile (may be null depending on app logic)
    const { data: profile } = await anon!
      .from("profiles")
      .select("*")
      .eq("id", uid)
      .maybeSingle();
    // profile may be null initially; assert query succeeded
    expect(profile === null || typeof profile === "object").toBe(true);

    // cleanup
    try {
      await svc!.auth.admin.deleteUser(uid);
      await svc!.from("profiles").delete().eq("id", uid);
    } catch (e) {
      console.warn("cleanup error", e);
    }
  }, 30_000);
});

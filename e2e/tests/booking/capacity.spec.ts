import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

// This test requires a real test Supabase instance with admin keys.
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_ANON_KEY) {
  test.skip(
    "Missing Supabase env vars (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY)",
  );
}

// Increase timeout because of multiple async operations
test.setTimeout(120_000);

test("concurrent bookings enforce session capacity", async () => {
  const admin = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

  // Create a session with small capacity
  const today = new Date();
  const date = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() + 10,
  )
    .toISOString()
    .slice(0, 10);

  const sessionPayload = {
    date,
    period: "morning",
    max_capacity: 4,
    applicators: [],
    status: "open",
  } as any;

  // Upsert session
  const { data: sessData } = await (admin as any)
    .from("sessions")
    .upsert(sessionPayload, { onConflict: ["date", "period"] })
    .select();

  const session = (sessData ?? [])[0];
  if (!session) throw new Error("Failed to create session");

  // Create test users (10) via admin API
  const USERS_COUNT = 10;
  const users: { id: string; email: string; password: string }[] = [];

  for (let i = 0; i < USERS_COUNT; i++) {
    const email = `e2e-c-${Date.now()}-${i}@example.test`;
    const password = "password";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await (admin as any).auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    const u = res.user;
    if (!u) throw new Error("create user failed");
    await admin.from("profiles").upsert({
      id: u.id,
      saram: email.split("@")[0].toUpperCase(),
      full_name: email.split("@")[0],
      rank: "Soldier",
      role: "user",
      semester: "1",
    });
    users.push({ id: u.id, email, password });
  }

  // For each user, sign in with anon client to obtain auth session
  const userClients = await Promise.all(
    users.map(async (u) => {
      const client = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!);
      await client.auth.signInWithPassword({
        email: u.email,
        password: u.password,
      });
      return client;
    }),
  );

  // Concurrently call RPC book_session as each user
  const concurrencyPromises = userClients.map((c, idx) => {
    const uid = users[idx].id;
    return c.rpc("book_session", { p_user_id: uid, p_session_id: session.id });
  });

  const results = await Promise.all(concurrencyPromises);

  // Normalize RPC response (array or single)
  const parsed = results.map((r: any) => {
    const row = Array.isArray(r.data) ? r.data[0] : r.data;
    return row;
  });

  const successes = parsed.filter((p: any) => p?.success === true);
  const failures = parsed.filter((p: any) => p?.success !== true);

  // Only up to capacity should succeed
  expect(successes.length).toBeLessThanOrEqual(session.max_capacity);
  expect(successes.length).toBe(session.max_capacity);

  // Confirm DB has exactly capacity confirmed bookings
  const { data: confirmed } = await admin
    .from("bookings")
    .select("*")
    .eq("session_id", session.id)
    .eq("status", "confirmed");

  expect(confirmed.length).toBe(session.max_capacity);

  // Failures should have 'session full' in error (or similar)
  failures.forEach((f: any) => {
    expect((f?.error ?? "").toString().toLowerCase()).toContain("session full");
  });

  // Cleanup: delete bookings and users and session
  await admin.from("bookings").delete().eq("session_id", session.id);
  await admin.from("sessions").delete().eq("id", session.id);
  for (const u of users) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (admin as any).auth.admin.deleteUser(u.id);
    } catch (e) {
      // ignore
    }
  }
});

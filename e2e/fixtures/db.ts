import { createClient } from "@supabase/supabase-js";
import { addDays, format } from "date-fns";
import fs from "fs";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

let admin: ReturnType<typeof createClient> | null = null;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  // Warn and no-op in local environments without test DB configured
  // Run seeded tests locally by exporting the env vars first
  // e.g. set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY for your test instance
  console.warn(
    "Warning: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set. e2e seed will no-op.",
  );
} else {
  admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}

export type SeedResult = {
  users: {
    email: string;
    id: string;
    password: string;
    role: "user" | "admin" | "coordinator";
  }[];
  sessions: { id: string; date: string; period: string }[];
};

export async function seed(): Promise<SeedResult> {
  // Define test accounts
  const accounts = [
    { email: "e2e-admin@example.test", password: "password", role: "admin" },
    {
      email: "e2e-coord@example.test",
      password: "password",
      role: "coordinator",
    },
    { email: "e2e-user@example.test", password: "password", role: "user" },
  ];

  const createdUsers: SeedResult["users"] = [];

  if (!admin) {
    console.warn(
      "No SUPABASE admin client available; skipping creation of auth users and profiles.",
    );
  } else {
    for (const acc of accounts) {
      // Remove existing user if present
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const list = (await (admin as any).auth.admin.listUsers()) as any;
        const existing = list?.users?.find((u: any) => u.email === acc.email);
        if (existing) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (admin as any).auth.admin.deleteUser(existing.id);
        }
      } catch (e) {
        // ignore if listUsers isn't available
      }

      // Create user via admin API
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = await (admin as any).auth.admin.createUser({
        email: acc.email,
        password: acc.password,
        email_confirm: true,
      });

      const user = res.user;
      if (!user) throw new Error("Failed to create test user " + acc.email);

      // Upsert profile row
      const profilePayload = {
        id: user.id,
        saram: acc.email.split("@")[0].toUpperCase(),
        full_name: acc.email.split("@")[0],
        rank: "Soldier",
        role: acc.role,
        semester: "1",
      };
      await admin.from("profiles").upsert(profilePayload);

      createdUsers.push({
        email: acc.email,
        id: user.id,
        password: acc.password,
        role: acc.role as any,
      });
    }
  }

  // Create a couple of sessions for testing
  const day1 = format(addDays(new Date(), 7), "yyyy-LL-dd");
  const day2 = format(addDays(new Date(), 8), "yyyy-LL-dd");

  const sessionsPayload = [
    {
      date: day1,
      period: "morning",
      max_capacity: 10,
      applicators: [],
      status: "open",
    },
    {
      date: day2,
      period: "afternoon",
      max_capacity: 10,
      applicators: [],
      status: "open",
    },
  ];

  let sessions: { id: string; date: string; period: string }[] = [];
  if (admin) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: sessData } = await (admin as any)
      .from("sessions")
      .upsert(sessionsPayload, { onConflict: ["date", "period"] })
      .select();

    sessions = (sessData ?? []).map((s: any) => ({
      id: s.id,
      date: s.date,
      period: s.period,
    }));
  } else {
    console.warn(
      "Skipping sessions creation because admin client is unavailable.",
    );
  }

  const out: SeedResult = { users: createdUsers, sessions };

  // Save to disk for debugging/consumption in tests
  try {
    fs.writeFileSync("e2e/.seed.json", JSON.stringify(out, null, 2));
  } catch (e) {
    // ignore
  }

  return out;
}

export async function teardown() {
  try {
    const seedFile = "e2e/.seed.json";
    if (!fs.existsSync(seedFile)) return;
    const raw = fs.readFileSync(seedFile, "utf8");
    const parsed: SeedResult = JSON.parse(raw);
    for (const u of parsed.users) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (admin as any).auth.admin.deleteUser(u.id);
      } catch (e) {
        // ignore
      }
    }
    // remove sessions
    for (const s of parsed.sessions) {
      await admin.from("sessions").delete().eq("id", s.id);
    }
    fs.unlinkSync(seedFile);
  } catch (e) {
    // ignore
  }
}

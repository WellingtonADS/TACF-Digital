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
        const list = (await (admin as any).auth.admin.listUsers()) as any;
        const existing = list?.users?.find((u: any) => u.email === acc.email);
        if (existing) {
          await (admin as any).auth.admin.deleteUser(existing.id);
        }
      } catch (e) {
        // ignore if listUsers isn't available
      }

      // Create/ensure user via admin API with retries and fallback lookup
      const anyResAttempts: any[] = [];
      let user: any = null;

      const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

      for (let attempt = 1; attempt <= 3 && !user; attempt++) {
        try {
          const res = await (admin as any).auth.admin.createUser({
            email: acc.email,
            password: acc.password,
            email_confirm: true,
          });
          const anyRes: any = res;
          anyResAttempts.push(anyRes);

          user = anyRes.user ?? anyRes.data?.user ?? anyRes.data ?? null;

          // If created successfully, break
          if (user) break;

          // If the email already exists, try to find and update the existing user
          if (
            anyRes?.error?.code === "email_exists" ||
            anyRes?.error?.status === 422
          ) {
            console.warn(
              `User ${acc.email} already exists (attempt ${attempt}); attempting to update password.`,
            );
            try {
              const list = (await (admin as any).auth.admin.listUsers()) as any;
              const existing = list?.users?.find(
                (u: any) => u.email === acc.email,
              );
              if (existing) {
                // Try updating the existing user; retry if it fails
                const updated = await (admin as any).auth.admin.updateUser(
                  existing.id,
                  { password: acc.password, email_confirm: true },
                );
                const anyUpdated: any = updated;
                user =
                  anyUpdated.user ??
                  anyUpdated.data?.user ??
                  anyUpdated.data ??
                  existing;
                console.warn(`Updated existing user ${acc.email}`);
                break;
              }
            } catch (e) {
              console.warn(
                `Attempt ${attempt} failed to update existing user ${acc.email}: ${e}`,
              );
            }
          }
        } catch (e) {
          console.warn(
            `Attempt ${attempt} failed creating user ${acc.email}: ${e}`,
          );
        }
        // backoff before retry
        await sleep(500 * attempt);
      }

      // Final fallback: try to look up the user via listUsers
      if (!user) {
        try {
          const list = (await (admin as any).auth.admin.listUsers()) as any;
          const existing = list?.users?.find((u: any) => u.email === acc.email);
          if (existing) user = existing;
        } catch (e) {
          // ignore
        }
      }

      if (!user) {
        throw new Error(
          `Failed to ensure test user ${acc.email} — attempts: ${JSON.stringify(anyResAttempts)}`,
        );
      }

      // Upsert profile row (small delay to reduce race conditions)
      const profilePayload = {
        id: user.id,
        saram: acc.email.split("@")[0].toUpperCase(),
        full_name: acc.email.split("@")[0],
        rank: "Soldier",
        role: acc.role,
        semester: "1",
      };

      if (!user.id)
        console.warn(
          `seed:createUser: missing id for ${acc.email} — user shape: ${JSON.stringify(user)}`,
        );

      // Ensure user is fully available before upserting profile
      await sleep(500);

      console.warn(`seed:createUser: full response: ${JSON.stringify(user)}`);
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

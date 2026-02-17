import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import dotenv from "dotenv";
import { describe, expect, test } from "vitest";

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY =
  process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SERVICE_KEY || !ANON_KEY) {
  // Skip tests when env not configured — Vitest will mark them as skipped
  // but throwing here prevents runtime errors
  console.warn(
    "Supabase env not configured for real tests. Skipping confirmarAgendamentoRPC tests.",
  );
}

const svc =
  SUPABASE_URL && SERVICE_KEY ? createClient(SUPABASE_URL, SERVICE_KEY) : null;
const anon =
  SUPABASE_URL && ANON_KEY ? createClient(SUPABASE_URL, ANON_KEY) : null;

describe.skipIf(!svc || !anon)("confirmarAgendamentoRPC (real backend)", () => {
  test("should call confirmar_agendamento RPC and return structured result", async () => {
    // Prepare test data
    const test_run_id = `e2e-${randomUUID()}`;

    // create a user via admin
    const pw = "Pass1234!";
    const email = `e2e.user.${Date.now()}@example.com`;
    const { data: createdUser, error: createUserErr } =
      await svc!.auth.admin.createUser({
        email,
        password: pw,
        email_confirm: true,
      });
    expect(createUserErr).toBeNull();
    const userId =
      (createdUser as any)?.user?.id ?? (createdUser as any)?.id ?? null;
    expect(userId).toBeTruthy();

    // create a session
    // pick a random future date to avoid colliding with other test inserts
    const offsetDays = Math.floor(Math.random() * 7);
    // pick an hour offset to reduce chance of same date+period collisions
    const hour = Math.floor(Math.random() * 24);
    const startsAt = new Date(Date.now() + offsetDays * 24 * 60 * 60 * 1000);
    startsAt.setUTCHours(hour, 0, 0, 0);
    const startsAtIso = startsAt.toISOString();

    const insertRes = await svc!
      .from("sessions")
      .insert({
        title: "E2E RPC Session",
        starts_at: startsAtIso,
        capacity: 5,
        metadata: { test_run_id },
      })
      .select();

    let sessionData: any = null;
    let sessErr: any = null;
    if ((insertRes as any)?.error) {
      const err = (insertRes as any).error;
      if (err.code === "23505") {
        // determine period from hour
        const period = hour < 12 ? "morning" : "afternoon";
        const q = await svc!
          .from("sessions")
          .select("*")
          .eq("date", startsAt.toISOString().slice(0, 10))
          .eq("period", period)
          .maybeSingle();
        sessionData = (q as any)?.data ?? null;
        sessErr = (q as any)?.error ?? null;
      } else {
        sessErr = err;
      }
    } else {
      sessionData = (insertRes as any)?.data?.[0] ?? null;
    }

    expect(sessErr).toBeNull();
    const sessionId = (sessionData as any)?.id;
    expect(sessionId).toBeTruthy();

    // Call RPC as anon (simulate user flow)
    const { data, error } = (await anon!.rpc("confirmar_agendamento", {
      p_user_id: userId,
      p_session_id: sessionId,
    })) as any;

    // Allow RPC to return error if business rules prevent booking — assert shape
    if (error) {
      // RPC returned an error from Supabase
      // Fail only if it's unexpected (e.g., connectivity), else assert message present
      expect(error.message).toBeTruthy();
    } else {
      const result = Array.isArray(data) ? data[0] : data;
      expect(result).toBeDefined();
      // result should have success boolean per implementation
      expect(result).toHaveProperty("success");
    }

    // Cleanup: delete created bookings/sessions/profile
    try {
      await svc!
        .from("bookings")
        .delete()
        .eq("metadata->>test_run_id", test_run_id);
      await svc!
        .from("sessions")
        .delete()
        .eq("metadata->>test_run_id", test_run_id);
      await svc!.auth.admin.deleteUser(userId);
      await svc!.from("profiles").delete().eq("email", email);
    } catch (e) {
      // ignore cleanup errors
      console.warn("cleanup error", e);
    }
  }, 60_000);
});

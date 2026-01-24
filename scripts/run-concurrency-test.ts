import { randomUUID } from "crypto";
import dotenv from "dotenv";
import path from "path";
import { Client } from "pg";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL not set in .env");

async function run() {
  const client = new Client({ connectionString });
  await client.connect();

  try {
    console.log("Setting up concurrency test (using direct DB connection)...");
    // Use valid capacity per business rules (8-21). Set to 8 for concurrency validation.
    const capacity = 8;

    // Test identifiers
    const testDate = "2026-03-01";
    const testPeriod = "morning";

    // Cleanup any leftover test data for this date/period to make test idempotent
    console.log("Cleaning previous test data for", testDate, testPeriod);
    await client.query(
      `DELETE FROM public.bookings b USING public.sessions s WHERE b.session_id = s.id AND s.date = $1 AND s.period = $2`,
      [testDate, testPeriod]
    );
    await client.query(
      `DELETE FROM public.sessions WHERE date = $1 AND period = $2`,
      [testDate, testPeriod]
    );

    // Also remove any leftover test profiles and corresponding auth.users with saram prefix CONC
    const oldProfiles = await client.query(
      "SELECT id FROM public.profiles WHERE saram LIKE 'CONC%'"
    );
    if (oldProfiles.rows.length > 0) {
      const ids = oldProfiles.rows.map((r) => r.id);
      console.log("Removing", ids.length, "old test profiles");
      await client.query(
        "DELETE FROM public.bookings WHERE user_id = ANY($1)",
        [ids]
      );
      await client.query("DELETE FROM public.profiles WHERE id = ANY($1)", [
        ids,
      ]);
      await client.query("DELETE FROM auth.users WHERE id = ANY($1)", [ids]);
    }

    // Create test session
    const sessionRes = await client.query(
      "INSERT INTO public.sessions (date, period, max_capacity) VALUES ($1, $2, $3) RETURNING id, max_capacity",
      [testDate, testPeriod, capacity]
    );
    const session = sessionRes.rows[0];
    console.log(
      "Created session",
      session.id,
      "capacity",
      session.max_capacity
    );

    // Create test users (12)
    const users: { id: string; saram: string }[] = [];
    for (let i = 0; i < 12; i++) {
      const id = randomUUID();
      const email = `test+${id.slice(0, 8)}@example.com`;
      // Create auth user
      await client.query(
        `INSERT INTO auth.users (id, aud, role, email, email_confirmed_at, created_at, updated_at)
         VALUES ($1, 'authenticated', 'authenticated', $2, NOW(), NOW(), NOW())`,
        [id, email]
      );
      // Create profile
      await client.query(
        `INSERT INTO public.profiles (id, saram, full_name, rank, semester)
         VALUES ($1, $2, $3, $4, $5)`,
        [id, `CONC${i}`, `Concurrent ${i}`, "Soldado", "1"]
      );
      users.push({ id, saram: `CONC${i}` });
    }

    console.log(
      "\nRunning parallel booking attempts (8 requests for capacity",
      capacity,
      ")..."
    );

    // Fire concurrent RPC calls
    const promises = users.map((u) =>
      client.query("SELECT * FROM public.book_session($1, $2)", [
        u.id,
        session.id,
      ])
    );
    const results = await Promise.all(promises);

    let successes = 0;
    const failures: { reason: string; userId: string }[] = [];

    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      const rows = r.rows;
      if (!rows || rows.length === 0) {
        failures.push({ reason: "no response", userId: users[i].id });
      } else {
        const row = rows[0];
        if (row.success) successes++;
        else
          failures.push({
            reason: row.error || "unknown",
            userId: users[i].id,
          });
      }
    }

    console.log(
      `\nResults: successes=${successes}, failures=${failures.length}`
    );
    console.table(failures);

    // Cleanup
    await client.query("DELETE FROM public.bookings WHERE session_id = $1", [
      session.id,
    ]);
    await client.query("DELETE FROM public.sessions WHERE id = $1", [
      session.id,
    ]);
    for (const u of users) {
      await client.query("DELETE FROM public.profiles WHERE id = $1", [u.id]);
      await client.query("DELETE FROM auth.users WHERE id = $1", [u.id]);
    }

    console.log("Cleanup done");
  } finally {
    await client.end();
  }
}

run().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});

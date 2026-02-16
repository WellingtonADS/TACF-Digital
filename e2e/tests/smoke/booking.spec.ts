import { expect, test } from "@playwright/test";
import dotenv from "dotenv";
import { createTestUser, signInViaUI } from "../../fixtures/auth";
import { createServiceClient } from "../../fixtures/supabaseClient";
import { BookingPage } from "../../pages/bookingPage";

dotenv.config();

test.describe("Booking flow (real backend)", () => {
  let test_run_id: string;
  let userEmail: string;
  let userPassword: string;

  test.beforeAll(async () => {
    test_run_id = `e2e-${Date.now()}`;
    userEmail = `e2e.user+${Date.now()}@example.com`;
    userPassword = "Password123!";

    const svc = createServiceClient();
    await svc.from("sessions").insert({
      title: "Sessão para E2E Booking",
      starts_at: new Date().toISOString(),
      capacity: 5,
      metadata: { test_run_id },
    });

    await createTestUser(userEmail, userPassword);
  });

  test.afterAll(async () => {
    const svc = createServiceClient();
    await svc
      .from("bookings")
      .delete()
      .eq("metadata->>test_run_id", test_run_id);
    await svc
      .from("sessions")
      .delete()
      .eq("metadata->>test_run_id", test_run_id);
    await svc.from("profiles").delete().eq("email", userEmail);
  });

  test("user can reserve a session and see confirmation", async ({ page }) => {
    await signInViaUI(page, userEmail, userPassword);
    const booking = new BookingPage(page);
    await booking.goto();
    await booking.selectSessionByTitle("Sessão para E2E Booking");
    await booking.confirmBooking();
    const order = await booking.waitForConfirmation();
    expect(order).toBeTruthy();
  });
});

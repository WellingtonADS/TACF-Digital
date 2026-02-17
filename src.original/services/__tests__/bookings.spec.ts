import { afterEach, describe, expect, it, vi } from "vitest";
import { confirmBooking, getUserBooking, requestSwap } from "../bookings";
import * as supabaseModule from "../supabase";
import { supabase } from "../supabase";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("bookings service", () => {
  it("getUserBooking returns booking when present", async () => {
    const expected = {
      id: "b1",
      user_id: "u1",
      status: "confirmed",
      session: { id: "s1", date: "2026-02-14", period: "morning" },
    } as unknown;

    vi.spyOn(supabase, "from").mockImplementation((): any => {
      const chain: any = {
        select: () => chain,
        eq: () => chain,
        neq: () => chain,
        maybeSingle: async () => ({ data: expected, error: null }),
      };
      return chain;
    });

    const res = await getUserBooking("u1");
    expect(res).not.toBeNull();
    expect((res as any).id).toBe("b1");
  });

  it("confirmBooking returns success when RPC succeeds", async () => {
    vi.spyOn(supabase.auth, "getUser").mockResolvedValue({
      data: { user: { id: "u1" } },
    } as any);

    vi.spyOn(supabaseModule, "confirmarAgendamentoRPC").mockResolvedValue({
      success: true,
      booking_id: "b1",
      order_number: "2026-001",
      error: null,
    });

    const res = await confirmBooking("s1");
    expect(res.success).toBe(true);
    expect(res.booking_id).toBe("b1");
  });

  it("requestSwap creates swap request and updates booking status", async () => {
    vi.spyOn(supabase.auth, "getUser").mockResolvedValue({
      data: { user: { id: "u1" } },
    } as any);

    vi.spyOn(supabase, "from").mockImplementation((table: string): any => {
      if (table === "swap_requests") {
        return {
          insert: async () => ({ error: null }),
        };
      }
      if (table === "bookings") {
        return {
          update: () => ({ eq: async () => ({ error: null }) }),
        };
      }
      return {} as any;
    });

    const res = await requestSwap("b1", "s2", "need change");
    expect(res.success).toBe(true);
  });
});

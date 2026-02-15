import { afterEach, describe, expect, it, vi } from "vitest";
import {
  BookingResponse,
  confirmarAgendamentoRPC,
  supabase,
} from "../supabase";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("confirmarAgendamentoRPC", () => {
  it("returns normalized BookingResponse on success", async () => {
    const mockData = [
      {
        success: true,
        booking_id: "11111111-1111-1111-1111-111111111111",
        order_number: "2026-001",
        error: null,
      },
    ];

    vi.spyOn(supabase, "rpc").mockResolvedValue({
      data: mockData as BookingResponse[],
      error: null,
    } as unknown as {
      data: BookingResponse[] | null;
      error: { message?: string } | null;
    });

    const res = await confirmarAgendamentoRPC(
      "11111111-1111-1111-1111-111111111111",
      "22222222-2222-2222-2222-222222222222",
    );

    expect(res.success).toBe(true);
    expect(res.booking_id).toBe(mockData[0].booking_id);
    expect(res.order_number).toBe(mockData[0].order_number);
    expect(res.error).toBeNull();
  });

  it("returns error when rpc returns error", async () => {
    vi.spyOn(supabase, "rpc").mockResolvedValue({
      data: null,
      error: { message: "boom" },
    } as unknown as {
      data: BookingResponse[] | null;
      error: { message?: string } | null;
    });

    const res = await confirmarAgendamentoRPC("1111", "2222");

    expect(res.success).toBe(false);
    expect(res.booking_id).toBeNull();
    expect(res.error).toBe("boom");
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

const { fromMock, rpcMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
  rpcMock: vi.fn(),
}));

vi.mock("./supabase", () => ({
  default: {
    from: fromMock,
    rpc: rpcMock,
  },
  confirmarAgendamentoRPC: vi.fn(),
}));

import {
  approveSwapRequest,
  fetchAdminGovernanceSnapshot,
  fetchAdminOperationalOverview,
  rejectSwapRequest,
} from "./bookings";

function createBuilder() {
  const builder = {
    select: vi.fn(),
    lte: vi.fn(),
    neq: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    gte: vi.fn(),
    in: vi.fn(),
    is: vi.fn(),
  };

  builder.select.mockReturnValue(builder);
  builder.lte.mockReturnValue(builder);
  builder.neq.mockReturnValue(builder);
  builder.eq.mockReturnValue(builder);
  builder.order.mockReturnValue(builder);
  builder.gte.mockReturnValue(builder);
  builder.in.mockReturnValue(builder);
  builder.is.mockReturnValue(builder);

  return builder;
}

describe("bookings service", () => {
  beforeEach(() => {
    fromMock.mockReset();
    rpcMock.mockReset();
  });

  it("approveSwapRequest normaliza o retorno da RPC transacional", async () => {
    rpcMock.mockResolvedValue({
      data: [
        {
          success: true,
          error: null,
          original_booking_id: "booking-old",
          new_booking_id: "booking-new",
          new_session_id: "session-new",
          order_number: "2026-1-0007",
        },
      ],
      error: null,
    });

    await expect(
      approveSwapRequest("swap-1", "admin-1"),
    ).resolves.toStrictEqual({
      success: true,
      error: null,
      original_booking_id: "booking-old",
      new_booking_id: "booking-new",
      new_session_id: "session-new",
      order_number: "2026-1-0007",
    });

    expect(rpcMock).toHaveBeenCalledWith("approve_swap", {
      p_request_id: "swap-1",
      p_admin_id: "admin-1",
    });
  });

  it("rejectSwapRequest normaliza o retorno da RPC administrativa", async () => {
    rpcMock.mockResolvedValue({
      data: [
        {
          success: true,
          error: null,
          booking_id: "booking-1",
          user_id: "user-1",
          swap_status: "cancelado",
        },
      ],
      error: null,
    });

    await expect(
      rejectSwapRequest("swap-1", "admin-1", "motivo"),
    ).resolves.toStrictEqual({
      success: true,
      error: null,
      booking_id: "booking-1",
      user_id: "user-1",
      swap_status: "cancelado",
    });

    expect(rpcMock).toHaveBeenCalledWith("reject_swap", {
      p_request_id: "swap-1",
      p_admin_id: "admin-1",
      p_reason: "motivo",
    });
  });

  it("fetchAdminOperationalOverview normaliza arrays do overview administrativo", async () => {
    rpcMock.mockResolvedValue({
      data: {
        open_full_sessions: [
          {
            session_id: "session-1",
            date: "2026-04-10",
            period: "manha",
            max_capacity: 20,
            occupied_count: 20,
          },
        ],
        ready_to_close_sessions: [],
      },
      error: null,
    });

    await expect(fetchAdminOperationalOverview()).resolves.toStrictEqual({
      open_full_sessions: [
        {
          session_id: "session-1",
          date: "2026-04-10",
          period: "manha",
          max_capacity: 20,
          occupied_count: 20,
        },
      ],
      ready_to_close_sessions: [],
    });
  });

  it("fetchAdminGovernanceSnapshot consolida backlog operacional e SLA", async () => {
    const overdueSessionsBuilder = createBuilder();
    const pendingSwapsBuilder = createBuilder();
    const completedSessionsBuilder = createBuilder();
    const pendingResultsBuilder = createBuilder();

    overdueSessionsBuilder.neq.mockResolvedValue({
      data: [
        { id: "session-1", date: "2026-03-30", status: "open" },
        { id: "session-2", date: "2026-03-31", status: "closed" },
      ],
      error: null,
    });
    pendingSwapsBuilder.order.mockResolvedValue({
      data: [
        {
          id: "swap-1",
          booking_id: "booking-1",
          created_at: "2026-03-31T00:00:00.000Z",
        },
        {
          id: "swap-2",
          booking_id: "booking-2",
          created_at: "2026-04-01T00:00:00.000Z",
        },
      ],
      error: null,
    });
    completedSessionsBuilder.gte.mockResolvedValue({
      count: 4,
      error: null,
    });
    pendingResultsBuilder.is.mockResolvedValue({
      count: 3,
      error: null,
    });

    fromMock
      .mockReturnValueOnce(overdueSessionsBuilder)
      .mockReturnValueOnce(pendingSwapsBuilder)
      .mockReturnValueOnce(completedSessionsBuilder)
      .mockReturnValueOnce(pendingResultsBuilder);

    const snapshot = await fetchAdminGovernanceSnapshot();

    expect(snapshot).toEqual({
      overdueSessions: 2,
      pendingResults: 3,
      pendingSwapRequests: 2,
      completedSessionsLast7Days: 4,
      oldestPendingSwapCreatedAt: "2026-03-31T00:00:00.000Z",
    });

    expect(pendingResultsBuilder.in).toHaveBeenCalledWith("session_id", [
      "session-1",
      "session-2",
    ]);
  });
});

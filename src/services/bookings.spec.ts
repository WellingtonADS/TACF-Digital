import { beforeEach, describe, expect, it, vi } from "vitest";

const { fromMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
}));

vi.mock("./supabase", () => ({
  default: {
    from: fromMock,
  },
  confirmarAgendamentoRPC: vi.fn(),
}));

import { fetchAdminGovernanceSnapshot } from "./bookings";

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

import { renderHook, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TicketData } from "../../../src/hooks/useTicket";
import useTicket from "../../../src/hooks/useTicket";

// mocks reused from page tests
const { fromMock } = vi.hoisted(() => ({ fromMock: vi.fn() }));
vi.mock("@/services/supabase", () => ({
  __esModule: true,
  default: { from: fromMock },
}));

vi.mock("@/hooks/useAuth", () => ({
  __esModule: true,
  default: () => ({ user: { id: "user-1" }, profile: {}, loading: false }),
}));

function buildFakeQuery(data: unknown) {
  const maybeSingle = vi.fn().mockResolvedValue({ data, error: null });
  const eq = vi.fn().mockReturnValue({
    maybeSingle,
    eq: vi.fn().mockReturnValue({ maybeSingle }),
  });
  return { select: vi.fn().mockReturnValue({ eq }) };
}

describe("useTicket hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fromMock.mockReturnValue(buildFakeQuery(null));
  });

  it("returns initial data immediately if given and overrides code with state orderNumber", async () => {
    const initial: TicketData = {
      name: "ALFA",
      saram: "000111",
      location: "BASE",
      date: "01/01/2026",
      time: "08:00",
      code: "ABC123",
      confirmed: true,
    };

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MemoryRouter
        initialEntries={[
          { pathname: "/app/ticket", state: { orderNumber: "XYZ" } },
        ]}
      >
        {children}
      </MemoryRouter>
    );

    const { result } = renderHook(() => useTicket(initial), {
      wrapper,
    });

    // after effect finishes we should have the ticket and loading false
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.ticket).toMatchObject({
      ...initial,
      code: "XYZ",
      confirmed: true,
    });
  });

  it("loads data from database when bookingId provided in state", async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === "bookings") {
        return buildFakeQuery({
          id: "booking-1",
          user_id: "user-1",
          session_id: "sess-1",
          order_number: "B12-C34",
          status: "confirmed",
        });
      }
      if (table === "sessions") {
        return buildFakeQuery({
          id: "sess-1",
          date: "2026-03-01",
          period: "MANHÃ",
        });
      }
      if (table === "profiles") {
        return buildFakeQuery({
          id: "user-1",
          war_name: "TEN OLIVEIRA",
          saram: "1112223",
        });
      }
      return buildFakeQuery(null);
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MemoryRouter
        initialEntries={[
          {
            pathname: "/app/ticket",
            state: { bookingId: "booking-1", orderNumber: "B12-C34" },
          },
        ]}
      >
        {children}
      </MemoryRouter>
    );

    const { result } = renderHook(() => useTicket(), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.ticket).toMatchObject({
      name: "TEN OLIVEIRA",
      saram: "1112223",
      code: "B12-C34",
      confirmed: true,
    });
  });
});

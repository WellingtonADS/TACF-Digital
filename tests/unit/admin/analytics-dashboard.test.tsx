import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AnalyticsDashboard from "../../../src/pages/AnalyticsDashboard";

const { fromMock } = vi.hoisted(() => ({ fromMock: vi.fn() }));

vi.mock("react-router-dom", async () => {
  const actual =
    await vi.importActual<typeof import("react-router-dom")>(
      "react-router-dom",
    );
  return { ...actual };
});

vi.mock("@/hooks/useAuth", () => ({
  __esModule: true,
  default: () => ({ profile: { role: "admin" }, loading: false }),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

vi.mock("@/services/supabase", () => {
  const profilesMock = [
    { id: "u1", full_name: "Test", saram: "123", sector: "G1", active: true },
  ];
  const bookingsMock = [
    {
      id: "bk1",
      user_id: "u1",
      score: 80,
      test_date: "2026-03-01",
      created_at: "2026-03-01T08:00:00",
      status: "confirmed",
    },
  ];

  // Build a chainable thenable so any combination of .eq().gte().lt() etc. works
  function makeChainable(
    data: unknown[] = [],
    count = 0,
  ): Record<string, unknown> {
    const result = { data, count, error: null };
    const obj: Record<string, unknown> = {
      then(
        onFulfilled: (v: typeof result) => unknown,
        onRejected?: (e: unknown) => unknown,
      ) {
        return Promise.resolve(result).then(onFulfilled, onRejected);
      },
      catch(onRejected: (e: unknown) => unknown) {
        return Promise.resolve(result).catch(onRejected);
      },
    };
    const chain = () => makeChainable(data, count);
    obj.eq = chain;
    obj.neq = chain;
    obj.not = chain;
    obj.gte = chain;
    obj.lt = chain;
    obj.lte = chain;
    obj.in = chain;
    obj.order = chain;
    obj.limit = chain;
    return obj;
  }

  fromMock.mockImplementation((table: string) => {
    if (table === "profiles") {
      return { select: () => makeChainable(profilesMock) };
    }
    if (table === "bookings") {
      return { select: () => makeChainable(bookingsMock) };
    }
    return { select: () => makeChainable() };
  });
  return {
    __esModule: true,
    default: { from: fromMock },
  };
});

describe("AnalyticsDashboard", () => {
  beforeEach(() => {
    fromMock.mockClear();
  });

  it("realiza chamadas ao Supabase para dados de analytics", async () => {
    render(
      <MemoryRouter>
        <AnalyticsDashboard />
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(fromMock).toHaveBeenCalled();
    });
  });

  it("renderiza cabeçalho da página", async () => {
    render(
      <MemoryRouter>
        <AnalyticsDashboard />
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(
        screen.getByText(/Relat[oó]rios Consolidados/i),
      ).toBeInTheDocument();
    });
  });
});

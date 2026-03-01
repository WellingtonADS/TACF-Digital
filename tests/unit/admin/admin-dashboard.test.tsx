import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminDashboard from "../../../src/pages/AdminDashboard";

const { mockNavigate, fromMock } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  fromMock: vi.fn(),
}));

vi.mock("react-router-dom", async () => {
  const actual =
    await vi.importActual<typeof import("react-router-dom")>(
      "react-router-dom",
    );
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("@/hooks/useAuth", () => ({
  __esModule: true,
  default: () => ({ profile: { role: "admin" } }),
}));

vi.mock("@/hooks/useSessions", () => ({
  __esModule: true,
  default: () => ({
    sessions: [
      {
        session_id: "s1",
        date: "2026-02-25",
        period: "morning",
        max_capacity: 20,
        occupied_count: 10,
        available_count: 10,
      },
    ],
    loading: false,
    error: null,
    refresh: vi.fn(),
  }),
}));

vi.mock("@/services/supabase", () => {
  let callCount = 0;
  fromMock.mockImplementation(() => {
    callCount += 1;
    const values = [5, 2, 1];
    const count = values[callCount - 1] ?? 0;
    // Use a plain object with `then` (thenable) so it can be awaited AND
    // supports arbitrary filter chains: .not().gte().lt()  .neq()  etc.
    function makeChainable(): Record<string, unknown> {
      const result = { count, error: null, data: null };
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
      const chain = () => makeChainable();
      obj.not = chain;
      obj.gte = chain;
      obj.lt = chain;
      obj.lte = chain;
      obj.eq = chain;
      obj.neq = chain;
      obj.order = chain;
      obj.limit = chain;
      return obj;
    }
    return {
      select: (_cols: string, _opts?: unknown) => makeChainable(),
    };
  });
  const client = { from: fromMock };
  return {
    __esModule: true,
    default: client,
    supabase: client,
  };
});

describe("AdminDashboard", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    fromMock.mockClear();
  });

  it("shows metrics and allows navigation", async () => {
    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>,
    );

    // wait for stats to appear
    await waitFor(() => {
      expect(screen.getByText(/Total Inscritos/i)).toBeInTheDocument();
      expect(screen.getByText("5")).toBeInTheDocument();
    });

    expect(screen.getByText(/Aptos \(Mês\)/i)).toBeInTheDocument();
    expect(screen.getAllByText("2").length).toBeGreaterThan(0);

    expect(screen.getByText(/Pendências/i)).toBeInTheDocument();
    expect(screen.getAllByText("1").length).toBeGreaterThan(0);

    // ensure session row is rendered and Lançar índices button exists
    expect(screen.getByText(/s1/i)).toBeInTheDocument();
    const launchBtn = screen.getByTitle("Lançar índices");
    launchBtn.click();
    expect(mockNavigate).toHaveBeenCalledWith("/app/lancamento-indices", {
      state: { sessionId: "s1" },
    });
  });
});

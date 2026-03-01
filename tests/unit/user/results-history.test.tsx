import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ResultsHistory from "../../../src/pages/ResultsHistory";

const { fromMock, rpcMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
  rpcMock: vi.fn(),
}));

vi.mock("@/services/supabase", () => ({
  __esModule: true,
  default: { from: fromMock, rpc: rpcMock },
}));

vi.mock("@/hooks/useAuth", () => ({
  __esModule: true,
  default: () => ({
    user: { id: "user-1" },
    profile: { role: "user" },
    loading: false,
  }),
}));

vi.mock("@/components/RescheduleDrawer", () => ({
  default: () => <div data-testid="reschedule-drawer" />,
}));

const makeResult = (
  id: string,
  status: "apto" | "inapto" | "pendente",
  score = "8.5",
  date = "2026-01-15",
) => ({
  id,
  profile_id: "user-1",
  full_name: "TEN SILVA",
  saram: "123456",
  test_date: date,
  score,
  result_status: status,
  location: "CEAR",
  concept: "Excelente",
});

vi.mock("../../../src/hooks/usePaginatedQuery", () => ({
  __esModule: true,
  default: () => ({
    items: [
      makeResult("r1", "apto", "9.2", "2026-01-15"),
      makeResult("r2", "inapto", "5.0", "2025-06-10"),
      makeResult("r3", "pendente", null as unknown as string, "2025-03-01"),
    ],
    loading: false,
    hasMore: false,
    fetchPage: vi.fn(),
  }),
}));

vi.mock("../../../src/hooks/useDashboard", () => ({
  __esModule: true,
  default: () => ({
    bookingsCount: 1,
    resultsCount: 3,
    nextSession: null,
    latestOrderNumber: null,
    notifications: [],
    loading: false,
    inspsauDaysRemaining: 120,
  }),
}));

describe("ResultsHistory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fromMock.mockReturnValue({
      select: vi.fn().mockReturnValue({
        in: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
    });
  });

  it("renderiza os 3 cartões KPI (Status, Pontuação, Revalidação)", async () => {
    render(
      <MemoryRouter>
        <ResultsHistory />
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(screen.getByText(/status atual/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/próxima revalidação/i)).toBeInTheDocument();
  });

  it("exibe badge APTO para resultado apto", async () => {
    render(
      <MemoryRouter>
        <ResultsHistory />
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(screen.getAllByText("APTO").length).toBeGreaterThan(0);
    });
  });

  it("exibe badge INAPTO para resultado inapto", async () => {
    render(
      <MemoryRouter>
        <ResultsHistory />
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(screen.getByText("INAPTO")).toBeInTheDocument();
    });
  });

  it("exibe badge PENDENTE para resultado pendente", async () => {
    render(
      <MemoryRouter>
        <ResultsHistory />
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(screen.getByText("PENDENTE")).toBeInTheDocument();
    });
  });

  it("exibe link Visualizar Detalhes apontando para /app/recurso", async () => {
    render(
      <MemoryRouter>
        <ResultsHistory />
      </MemoryRouter>,
    );
    await waitFor(() => {
      const links = screen.getAllByRole("link", {
        name: /visualizar detalhes/i,
      });
      expect(links.length).toBeGreaterThan(0);
      expect(links[0]).toHaveAttribute(
        "href",
        expect.stringContaining("/app/recurso"),
      );
    });
  });
});

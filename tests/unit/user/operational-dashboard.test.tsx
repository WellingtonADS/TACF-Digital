import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OperationalDashboard } from "../../../src/pages/OperationalDashboard";

const { fromMock } = vi.hoisted(() => ({ fromMock: vi.fn() }));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

vi.mock("@/components/RescheduleDrawer", () => ({
  default: () => <div data-testid="reschedule-drawer" />,
}));

vi.mock("@/services/supabase", () => ({
  __esModule: true,
  default: { from: fromMock, auth: { getUser: vi.fn() } },
}));

vi.mock("@/hooks/useDashboard", () => ({
  __esModule: true,
  default: () => ({
    bookingsCount: 2,
    resultsCount: 5,
    nextSession: null,
    latestOrderNumber: null,
    notifications: [],
    loading: false,
    inspsauDaysRemaining: 90,
  }),
}));

vi.mock("@/hooks/useAuth", () => ({
  __esModule: true,
  default: () => ({
    user: { id: "user-1", email: "mil@fab.mil.br" },
    profile: {
      full_name: "TEN SILVA",
      role: "user",
      inspsau_valid_until: "2028-01-01",
    },
    loading: false,
    signOut: vi.fn(),
  }),
}));

const buildFromMock = () => {
  const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
  const eq = vi.fn().mockReturnValue({
    maybeSingle,
    eq: vi.fn().mockReturnValue({ maybeSingle }),
  });
  return { select: vi.fn().mockReturnValue({ eq }) };
};

describe("OperationalDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fromMock.mockReturnValue(buildFromMock());
  });

  it("exibe os 4 cartões de ação rápida", () => {
    render(
      <MemoryRouter>
        <OperationalDashboard />
      </MemoryRouter>,
    );
    expect(screen.getByText("Novo Agendamento")).toBeInTheDocument();
    expect(screen.getByText("Meus Testes")).toBeInTheDocument();
    expect(screen.getByText("Resultados")).toBeInTheDocument();
    expect(screen.getByText("Documentação")).toBeInTheDocument();
  });

  it("exibe o nome do usuário no greeting", () => {
    render(
      <MemoryRouter>
        <OperationalDashboard />
      </MemoryRouter>,
    );
    // O h2 exibe "Olá, TEN SILVA" — busca pelo elemento com textContent contendo o nome
    const greeting = screen
      .getAllByRole("heading")
      .find((el) => el.textContent?.includes("TEN SILVA"));
    expect(greeting).toBeTruthy();
  });

  it("exibe chip de status APTO quando inspsau vigente", () => {
    render(
      <MemoryRouter>
        <OperationalDashboard />
      </MemoryRouter>,
    );
    expect(screen.getByText(/apto/i)).toBeInTheDocument();
  });
});

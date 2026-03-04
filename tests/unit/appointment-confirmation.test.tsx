import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AppointmentConfirmation from "../../src/pages/AppointmentConfirmation";

const { mockNavigate, getUserMock, fromMock, confirmarAgendamentoRPCMock } =
  vi.hoisted(() => ({
    mockNavigate: vi.fn(),
    getUserMock: vi.fn(),
    fromMock: vi.fn(),
    confirmarAgendamentoRPCMock: vi.fn(),
  }));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/hooks/useAuth", () => ({
  default: () => ({ signOut: vi.fn() }),
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

vi.mock("@/services/supabase", () => ({
  __esModule: true,
  default: {
    auth: {
      getUser: getUserMock,
    },
    from: fromMock,
  },
  confirmarAgendamentoRPC: confirmarAgendamentoRPCMock,
}));

type QueryResult<T> = {
  data: T | null;
  error: { message: string } | null;
};

function createQueryMock<T>(result: QueryResult<T>) {
  const select = vi.fn();
  const eq = vi.fn();
  const maybeSingle = vi.fn().mockResolvedValue(result);

  select.mockReturnValue({ eq, maybeSingle });
  eq.mockReturnValue({ maybeSingle });

  return { select, eq, maybeSingle };
}

function renderPage(
  initialEntry: string | { pathname: string; state?: unknown },
) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route
          path="/app/agendamentos/confirmacao"
          element={<AppointmentConfirmation />}
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe("AppointmentConfirmation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } });

    fromMock.mockImplementation((table: string) => {
      if (table === "sessions") {
        return createQueryMock({
          data: {
            id: "session-1",
            date: "2026-03-01",
            period: "MANHÃ",
            max_capacity: 20,
          },
          error: null,
        });
      }

      if (table === "profiles") {
        return createQueryMock({
          data: {
            id: "user-1",
            war_name: "1T SILVA",
            full_name: "Tenente Silva",
            saram: "1234567",
            rank: "1T",
            sector: "HACO",
          },
          error: null,
        });
      }

      if (table === "bookings") {
        return createQueryMock({
          data: {
            id: "booking-1",
            user_id: "user-1",
            session_id: "session-1",
            status: "confirmed",
            test_date: null,
            order_number: "2026-1-0001",
            score: null,
            result_details: null,
          },
          error: null,
        });
      }

      return createQueryMock({ data: null, error: null });
    });
  });

  it("exibe fallback quando não recebe sessionId nem bookingId", () => {
    renderPage("/app/agendamentos/confirmacao");

    expect(
      screen.getByText(/Agendamento não encontrado\./i),
    ).toBeInTheDocument();
  });

  it("confirma agendamento via RPC quando recebe sessionId", async () => {
    confirmarAgendamentoRPCMock.mockResolvedValue({
      success: true,
      booking_id: "booking-2",
      order_number: "2026-1-0002",
      error: null,
    });

    renderPage({
      pathname: "/app/agendamentos/confirmacao",
      state: { sessionId: "session-1" },
    });

    await waitFor(() => {
      expect(screen.getByText(/1T SILVA/i)).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByRole("button", { name: /Confirmar Agendamento/i }),
    );

    await waitFor(() => {
      expect(confirmarAgendamentoRPCMock).toHaveBeenCalledWith(
        "user-1",
        "session-1",
      );
    });

    expect(mockNavigate).toHaveBeenCalledWith("/app/ticket", {
      state: {
        bookingId: "booking-2",
        orderNumber: "2026-1-0002",
        sessionId: "session-1",
      },
    });
  });

  it("botão voltar leva para agendamentos", async () => {
    renderPage({
      pathname: "/app/agendamentos/confirmacao",
      state: { sessionId: "session-1" },
    });

    await waitFor(() => {
      expect(screen.getByText(/1T SILVA/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /Voltar e Editar/i }));
    expect(mockNavigate).toHaveBeenCalledWith("/app/agendamentos");
  });

  it("carrega booking legado via bookingId e mostra número do bilhete", async () => {
    renderPage("/app/agendamentos/confirmacao?bookingId=booking-1");

    await waitFor(() => {
      expect(screen.getByText(/Bilhete gerado:/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/2026-1-0001/i)).toBeInTheDocument();
  });
});

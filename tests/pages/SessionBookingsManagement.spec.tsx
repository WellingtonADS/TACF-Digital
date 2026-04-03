import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  navigateMock,
  fetchSessionByIdMock,
  fetchSessionBookingsWithProfilesMock,
  fetchSessionClosureChecklistMock,
  closeSessionWithChecklistMock,
  updateBookingAttendanceMock,
  toastSuccessMock,
  toastErrorMock,
} = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  fetchSessionByIdMock: vi.fn(),
  fetchSessionBookingsWithProfilesMock: vi.fn(),
  fetchSessionClosureChecklistMock: vi.fn(),
  closeSessionWithChecklistMock: vi.fn(),
  updateBookingAttendanceMock: vi.fn(),
  toastSuccessMock: vi.fn(),
  toastErrorMock: vi.fn(),
}));

vi.mock("@/components/layout/Layout", () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock("@/hooks/useAuth", () => ({
  default: () => ({ profile: { role: "admin" } }),
}));

vi.mock("@/services/sessions", () => ({
  fetchSessionById: fetchSessionByIdMock,
  fetchSessionBookingsWithProfiles: fetchSessionBookingsWithProfilesMock,
  fetchSessionClosureChecklist: fetchSessionClosureChecklistMock,
  closeSessionWithChecklist: closeSessionWithChecklistMock,
  updateBookingAttendance: updateBookingAttendanceMock,
}));

vi.mock("@/utils/pdf/generateAttendanceList", () => ({
  generateAttendanceListPdf: vi.fn(),
}));

vi.mock("react-router-dom", async () => {
  const actual =
    await vi.importActual<typeof import("react-router-dom")>(
      "react-router-dom",
    );

  return {
    ...actual,
    useNavigate: () => navigateMock,
    useParams: () => ({ sessionId: "session-1" }),
  };
});

vi.mock("sonner", () => ({
  toast: {
    success: toastSuccessMock,
    error: toastErrorMock,
  },
}));

import SessionBookingsManagement from "@/pages/SessionBookingsManagement";

function createBookingsPayload() {
  return {
    bookings: [
      {
        id: "booking-1",
        user_id: "user-1",
        status: "agendado",
        attendance_confirmed: false,
        order_number: "001",
      },
    ],
    profilesById: new Map([
      [
        "user-1",
        {
          id: "user-1",
          full_name: "Fulano da Silva",
          war_name: "Fulano",
          saram: "123456",
          rank: "1T",
          email: "fulano@example.com",
        },
      ],
    ]),
  };
}

describe("SessionBookingsManagement", () => {
  beforeEach(() => {
    navigateMock.mockReset();
    fetchSessionBookingsWithProfilesMock.mockResolvedValue(
      createBookingsPayload(),
    );
    updateBookingAttendanceMock.mockResolvedValue(undefined);
    toastSuccessMock.mockReset();
    toastErrorMock.mockReset();
  });

  it("renderiza checklist de encerramento e bloqueia mutações quando a sessão já está concluída", async () => {
    fetchSessionByIdMock.mockResolvedValue({
      id: "session-1",
      date: "2026-04-01",
      period: "manha",
      max_capacity: 20,
      location_id: "loc-1",
      status: "completed",
    });
    fetchSessionClosureChecklistMock.mockResolvedValue({
      bookings_total: 1,
      attendance_treated_count: 1,
      results_pending: 0,
      pending_swap_requests: 0,
      can_close: false,
      already_completed: true,
    });

    render(<SessionBookingsManagement />);

    expect(
      await screen.findByText(/Checklist de Encerramento/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Situação: Encerrada/i)).toBeInTheDocument();

    const closeButton = screen.getByRole("button", {
      name: /Encerrar Sessão/i,
    });
    expect(closeButton).toBeDisabled();

    const attendanceButtons = screen.getAllByRole("button", { name: /Sim/i });
    expect(
      attendanceButtons.every((button) => button.hasAttribute("disabled")),
    ).toBe(true);
  });

  it("permite encerrar a sessão quando o checklist está apto", async () => {
    fetchSessionByIdMock.mockResolvedValue({
      id: "session-1",
      date: "2026-04-01",
      period: "manha",
      max_capacity: 20,
      location_id: "loc-1",
      status: "open",
    });
    fetchSessionClosureChecklistMock.mockResolvedValue({
      bookings_total: 1,
      attendance_treated_count: 1,
      results_pending: 0,
      pending_swap_requests: 0,
      can_close: true,
      already_completed: false,
    });
    closeSessionWithChecklistMock.mockResolvedValue({
      success: true,
      error: null,
      checklist: {
        bookings_total: 1,
        attendance_treated_count: 1,
        results_pending: 0,
        pending_swap_requests: 0,
        can_close: true,
        already_completed: false,
      },
      session_status: "completed",
    });

    render(<SessionBookingsManagement />);

    const user = userEvent.setup();
    const closeButton = await screen.findByRole("button", {
      name: /Encerrar Sessão/i,
    });

    await user.click(closeButton);

    await waitFor(() => {
      expect(closeSessionWithChecklistMock).toHaveBeenCalledWith("session-1");
    });

    expect(toastSuccessMock).toHaveBeenCalledWith(
      "Sessão encerrada com sucesso.",
    );
  });
});

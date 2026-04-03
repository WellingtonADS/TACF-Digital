import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  navigateMock,
  useAuthMock,
  useSessionsMock,
  fetchAdminMetricsMock,
  fetchAdminGovernanceSnapshotMock,
} = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  useAuthMock: vi.fn(),
  useSessionsMock: vi.fn(),
  fetchAdminMetricsMock: vi.fn(),
  fetchAdminGovernanceSnapshotMock: vi.fn(),
}));

vi.mock("@/components/layout/Layout", () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock("@/components/FullPageLoading", () => ({
  default: ({ message }: { message: string }) => <div>{message}</div>,
}));

vi.mock("@/hooks/useAuth", () => ({
  default: useAuthMock,
}));

vi.mock("@/hooks/useSessions", () => ({
  default: useSessionsMock,
}));

vi.mock("@/services/bookings", () => ({
  fetchAdminMetrics: fetchAdminMetricsMock,
  fetchAdminGovernanceSnapshot: fetchAdminGovernanceSnapshotMock,
}));

vi.mock("react-router-dom", async () => {
  const actual =
    await vi.importActual<typeof import("react-router-dom")>(
      "react-router-dom",
    );

  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

import AdminDashboard from "@/pages/AdminDashboard";

describe("AdminDashboard", () => {
  beforeEach(() => {
    navigateMock.mockReset();
    useAuthMock.mockReturnValue({
      profile: { war_name: "Silva", full_name: "Administrador Silva" },
    });
    useSessionsMock.mockReturnValue({
      sessions: [
        {
          session_id: "session-1",
          date: "2026-04-05",
          period: "manha",
          available_count: 5,
          occupied_count: 10,
          max_capacity: 15,
        },
      ],
      loading: false,
    });
    fetchAdminMetricsMock.mockResolvedValue({
      totalInscritos: 100,
      aptosMonth: 12,
      pendencias: 4,
    });
    fetchAdminGovernanceSnapshotMock.mockResolvedValue({
      overdueSessions: 0,
      pendingResults: 0,
      pendingSwapRequests: 1,
      completedSessionsLast7Days: 3,
      oldestPendingSwapCreatedAt: "2020-03-31T06:00:00.000Z",
    });
  });

  it("renderiza o CTA do Hub de Sessões e navega para a aba padrão do hub", async () => {
    render(<AdminDashboard />);

    const user = userEvent.setup();

    const hubButton = await screen.findByRole("button", {
      name: /Hub de Sessões/i,
    });

    await user.click(hubButton);

    expect(navigateMock).toHaveBeenCalledWith("/app/sessoes?tab=sessoes");
  });

  it("exibe alerta de SLA quando existe reagendamento pendente acima de 24h", async () => {
    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/Atenção SLA/i)).toBeInTheDocument();
    });

    expect(
      screen.getByText(/Existe solicitação de reagendamento pendente há/i),
    ).toBeInTheDocument();
  });
});

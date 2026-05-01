import { renderHook, waitFor } from "@testing-library/react";
import { act } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Mocks ──────────────────────────────────────────────────────────────────

const callRpcWithRetryMock = vi.fn();
vi.mock("@/utils/rpc", () => ({
  callRpcWithRetry: (...args: unknown[]) => callRpcWithRetryMock(...args),
}));

const fetchUserDashboardFallbackSummaryMock = vi.fn();
vi.mock("@/services/bookings", () => ({
  fetchUserDashboardFallbackSummary: (...args: unknown[]) =>
    fetchUserDashboardFallbackSummaryMock(...args),
}));

const fetchUserNotificationsMock = vi.fn();
const markUserNotificationAsReadMock = vi.fn();
vi.mock("@/services/notifications", () => ({
  fetchUserNotifications: (...args: unknown[]) =>
    fetchUserNotificationsMock(...args),
  markUserNotificationAsRead: (...args: unknown[]) =>
    markUserNotificationAsReadMock(...args),
}));

const useAuthMock = vi.fn();
vi.mock("@/hooks/useAuth", () => ({
  default: () => useAuthMock(),
}));

const toastErrorMock = vi.fn();
vi.mock("sonner", () => ({
  toast: {
    error: (...args: unknown[]) => toastErrorMock(...args),
    success: vi.fn(),
  },
}));

vi.mock("@/utils/booking", () => ({
  formatSessionPeriod: vi.fn((p: unknown) => String(p)),
}));

// ── Helpers ────────────────────────────────────────────────────────────────

function makeUser(id = "user-1") {
  return { id };
}

function makeProfile(overrides: Record<string, unknown> = {}) {
  return {
    inspsau_valid_until: null,
    ...overrides,
  };
}

function makeValidRpcData(overrides: Record<string, unknown> = {}) {
  return {
    bookings_count: 2,
    results_count: 1,
    has_pending_swap: false,
    latest_order_number: 5,
    next_session: {
      id: "session-1",
      date: "2030-01-15",
      period: "manha",
      location_name: "Local A",
    },
    next_session_booking_id: "booking-1",
    ...overrides,
  };
}

// ── Tests ──────────────────────────────────────────────────────────────────

import useDashboard from "./useDashboard";

describe("useDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchUserNotificationsMock.mockResolvedValue([]);
    fetchUserDashboardFallbackSummaryMock.mockResolvedValue(null);
    markUserNotificationAsReadMock.mockResolvedValue(undefined);
  });

  it("não carrega quando user e profile estão ausentes", async () => {
    useAuthMock.mockReturnValue({ user: null, profile: null });

    const { result } = renderHook(() => useDashboard());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(callRpcWithRetryMock).not.toHaveBeenCalled();
    expect(result.current.bookingsCount).toBe(0);
  });

  it("carrega dados quando RPC retorna payload válido", async () => {
    useAuthMock.mockReturnValue({
      user: makeUser(),
      profile: makeProfile(),
    });

    const rpcData = makeValidRpcData();
    callRpcWithRetryMock.mockResolvedValue({ data: rpcData, error: null });

    const { result } = renderHook(() => useDashboard());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.bookingsCount).toBe(2);
    expect(result.current.resultsCount).toBe(1);
    expect(result.current.hasPendingSwap).toBe(false);
    expect(result.current.latestOrderNumber).toBe(5);
    expect(result.current.nextSessionBookingId).toBe("booking-1");
    expect(result.current.nextSession).toBeDefined();
  });

  it("busca fallback quando bookings_count é 0 e não há próxima sessão", async () => {
    useAuthMock.mockReturnValue({
      user: makeUser("u-2"),
      profile: makeProfile(),
    });

    const rpcData = makeValidRpcData({
      bookings_count: 0,
      next_session: null,
      next_session_booking_id: null,
    });
    callRpcWithRetryMock.mockResolvedValue({ data: rpcData, error: null });
    fetchUserDashboardFallbackSummaryMock.mockResolvedValue({
      bookingsCount: 3,
      resultsCount: 0,
      hasPendingSwap: false,
      nextSession: null,
    });

    const { result } = renderHook(() => useDashboard());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(fetchUserDashboardFallbackSummaryMock).toHaveBeenCalledWith("u-2");
    expect(result.current.bookingsCount).toBe(3);
  });

  it("mostra toast.error e zera estados quando o shape do RPC é inválido", async () => {
    useAuthMock.mockReturnValue({
      user: makeUser(),
      profile: makeProfile(),
    });

    callRpcWithRetryMock.mockResolvedValue({
      data: { next_session: "invalid-shape" },
      error: null,
    });

    const { result } = renderHook(() => useDashboard());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(toastErrorMock).toHaveBeenCalled();
    expect(result.current.bookingsCount).toBe(0);
    expect(result.current.resultsCount).toBe(0);
    expect(result.current.nextSession).toBeNull();
  });

  it("lida com erro do RPC sem lançar exceção para o usuário", async () => {
    useAuthMock.mockReturnValue({
      user: makeUser(),
      profile: makeProfile(),
    });

    callRpcWithRetryMock.mockRejectedValue(new Error("network failure"));

    const { result } = renderHook(() => useDashboard());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.bookingsCount).toBe(0);
  });

  describe("inspsauStatus", () => {
    it("retorna Apto quando inspsau_valid_until é data futura", async () => {
      const futureDate = new Date(Date.now() + 60 * 24 * 3600 * 1000)
        .toISOString()
        .slice(0, 10);

      useAuthMock.mockReturnValue({
        user: makeUser(),
        profile: makeProfile({ inspsau_valid_until: futureDate }),
      });
      callRpcWithRetryMock.mockResolvedValue({
        data: makeValidRpcData(),
        error: null,
      });

      const { result } = renderHook(() => useDashboard());

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.inspsauStatus.label).toBe("Apto");
    });

    it("retorna Inapto quando inspsau_valid_until é data passada", async () => {
      const pastDate = "2020-01-01";

      useAuthMock.mockReturnValue({
        user: makeUser(),
        profile: makeProfile({ inspsau_valid_until: pastDate }),
      });
      callRpcWithRetryMock.mockResolvedValue({
        data: makeValidRpcData(),
        error: null,
      });

      const { result } = renderHook(() => useDashboard());

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.inspsauStatus.label).toBe("Inapto");
    });

    it("retorna Inapto quando inspsau_valid_until é null", async () => {
      useAuthMock.mockReturnValue({
        user: makeUser(),
        profile: makeProfile({ inspsau_valid_until: null }),
      });
      callRpcWithRetryMock.mockResolvedValue({
        data: makeValidRpcData(),
        error: null,
      });

      const { result } = renderHook(() => useDashboard());

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.inspsauStatus.label).toBe("Inapto");
    });
  });

  describe("notifications", () => {
    it("gera notificação de inspsau quando válidade está dentro de 45 dias", async () => {
      const soonDate = new Date(Date.now() + 10 * 24 * 3600 * 1000)
        .toISOString()
        .slice(0, 10);

      useAuthMock.mockReturnValue({
        user: makeUser(),
        profile: makeProfile({ inspsau_valid_until: soonDate }),
      });
      callRpcWithRetryMock.mockResolvedValue({
        data: makeValidRpcData(),
        error: null,
      });

      const { result } = renderHook(() => useDashboard());

      await waitFor(() => expect(result.current.loading).toBe(false));

      const inspsauNotif = result.current.notifications.find((n) =>
        n.title.toLowerCase().includes("inspeção de saúde"),
      );
      expect(inspsauNotif).toBeDefined();
    });

    it("combina notificações do sistema com notificações do banco", async () => {
      useAuthMock.mockReturnValue({
        user: makeUser(),
        profile: makeProfile(),
      });
      callRpcWithRetryMock.mockResolvedValue({
        data: makeValidRpcData({
          bookings_count: 0,
          next_session: null,
          next_session_booking_id: null,
        }),
        error: null,
      });
      fetchUserNotificationsMock.mockResolvedValue([
        {
          id: "notif-1",
          title: "Aviso",
          body: "corpo",
          is_read: false,
          created_at: new Date().toISOString(),
          type: "info",
        },
      ]);
      fetchUserDashboardFallbackSummaryMock.mockResolvedValue(null);

      const { result } = renderHook(() => useDashboard());

      await waitFor(() => expect(result.current.loading).toBe(false));

      const dbNotif = result.current.notifications.find(
        (n) => n.title === "Aviso",
      );
      expect(dbNotif).toBeDefined();
    });

    it("calcula unreadNotificationsCount corretamente", async () => {
      useAuthMock.mockReturnValue({
        user: makeUser(),
        profile: makeProfile(),
      });
      callRpcWithRetryMock.mockResolvedValue({
        data: makeValidRpcData(),
        error: null,
      });
      fetchUserNotificationsMock.mockResolvedValue([
        {
          id: "n1",
          title: "A",
          body: "",
          is_read: false,
          created_at: new Date().toISOString(),
          type: "info",
        },
        {
          id: "n2",
          title: "B",
          body: "",
          is_read: true,
          created_at: new Date().toISOString(),
          type: "info",
        },
      ]);

      const { result } = renderHook(() => useDashboard());

      await waitFor(() => expect(result.current.loading).toBe(false));

      // db notifications: 1 unread; system notifications may add more
      expect(result.current.unreadNotificationsCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe("markNotificationAsRead", () => {
    it("marca notificação como lida com sucesso", async () => {
      useAuthMock.mockReturnValue({
        user: makeUser(),
        profile: makeProfile(),
      });
      callRpcWithRetryMock.mockResolvedValue({
        data: makeValidRpcData(),
        error: null,
      });
      fetchUserNotificationsMock.mockResolvedValue([
        {
          id: "n-inbox",
          title: "Teste",
          body: "",
          is_read: false,
          created_at: new Date().toISOString(),
          type: "info",
        },
      ]);
      markUserNotificationAsReadMock.mockResolvedValue(undefined);

      const { result } = renderHook(() => useDashboard());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.markNotificationAsRead("n-inbox");
      });

      expect(markUserNotificationAsReadMock).toHaveBeenCalledWith("n-inbox");
      const marked = result.current.notifications.find(
        (n) => n.id === "n-inbox",
      );
      expect(marked?.isRead).toBe(true);
    });

    it("exibe toast.error quando markNotificationAsRead falha", async () => {
      useAuthMock.mockReturnValue({
        user: makeUser(),
        profile: makeProfile(),
      });
      callRpcWithRetryMock.mockResolvedValue({
        data: makeValidRpcData(),
        error: null,
      });
      fetchUserNotificationsMock.mockResolvedValue([
        {
          id: "n-fail",
          title: "Teste",
          body: "",
          is_read: false,
          created_at: new Date().toISOString(),
          type: "info",
        },
      ]);
      markUserNotificationAsReadMock.mockRejectedValue(new Error("DB error"));

      const { result } = renderHook(() => useDashboard());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.markNotificationAsRead("n-fail");
      });

      expect(toastErrorMock).toHaveBeenCalled();
    });
  });

  it("refresh incrementa refreshTick e recarrega dados", async () => {
    useAuthMock.mockReturnValue({
      user: makeUser(),
      profile: makeProfile(),
    });
    callRpcWithRetryMock.mockResolvedValue({
      data: makeValidRpcData(),
      error: null,
    });

    const { result } = renderHook(() => useDashboard());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const callsBefore = callRpcWithRetryMock.mock.calls.length;

    await act(async () => {
      await result.current.refresh();
    });

    await waitFor(() =>
      expect(callRpcWithRetryMock.mock.calls.length).toBeGreaterThan(
        callsBefore,
      ),
    );
  });
});

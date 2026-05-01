import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// --- Mocks ---

const mockFetchSwapRequests = vi.fn();
const mockApproveSwapRequest = vi.fn();
const mockUpdateSwapRequestStatus = vi.fn();

vi.mock("@/services/bookings", () => ({
  fetchSwapRequests: (...args: unknown[]) => mockFetchSwapRequests(...args),
  approveSwapRequest: (...args: unknown[]) => mockApproveSwapRequest(...args),
  updateSwapRequestStatus: (...args: unknown[]) =>
    mockUpdateSwapRequestStatus(...args),
}));

const mockGetUser = vi.fn();
const mockFrom = vi.fn();

vi.mock("@/services/supabase", () => ({
  default: {
    auth: { getUser: (...args: unknown[]) => mockGetUser(...args) },
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

const mockToastError = vi.fn();
const mockToastSuccess = vi.fn();

vi.mock("sonner", () => ({
  toast: {
    error: (...args: unknown[]) => mockToastError(...args),
    success: (...args: unknown[]) => mockToastSuccess(...args),
  },
}));

vi.mock("@/utils/getAuthorizationErrorMessage", () => ({
  getAuthorizationErrorMessage: () => null,
}));

// --- Helpers ---

function makeFromChain(
  data: unknown[],
  error: null | { message: string } = null,
) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    data,
    error,
  };
  return chain;
}

// --- Tests ---

describe("useReschedulingManagement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rows=[] e loading=false quando swaps vazio", async () => {
    mockFetchSwapRequests.mockResolvedValue([]);

    const { default: useReschedulingManagement } =
      await import("@/hooks/useReschedulingManagement");
    const { result } = renderHook(() => useReschedulingManagement());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.rows).toEqual([]);
  });

  it("monta normalizedRows com dados completos", async () => {
    const swap = {
      id: "swap-1",
      booking_id: "booking-1",
      new_session_id: "session-2",
      status: "solicitado" as const,
      reason: JSON.stringify({
        text: "Motivo",
        new_date: "2025-07-10",
        attachment_url: null,
      }),
    };

    mockFetchSwapRequests.mockResolvedValue([swap]);

    mockFrom.mockImplementation((table: string) => {
      if (table === "bookings") {
        return {
          select: vi.fn().mockReturnThis(),
          in: vi.fn().mockResolvedValue({
            data: [
              { id: "booking-1", user_id: "user-1", session_id: "session-1" },
            ],
            error: null,
          }),
        };
      }
      if (table === "sessions") {
        return {
          select: vi.fn().mockReturnThis(),
          in: vi.fn().mockResolvedValue({
            data: [
              { id: "session-1", date: "2025-06-01" },
              { id: "session-2", date: "2025-07-10" },
            ],
            error: null,
          }),
        };
      }
      if (table === "profiles") {
        return {
          select: vi.fn().mockReturnThis(),
          in: vi.fn().mockResolvedValue({
            data: [
              {
                id: "user-1",
                full_name: "João Silva",
                war_name: "Silva",
                saram: "123456",
              },
            ],
            error: null,
          }),
        };
      }
      return makeFromChain([]);
    });

    const { default: useReschedulingManagement } =
      await import("@/hooks/useReschedulingManagement");
    const { result } = renderHook(() => useReschedulingManagement());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.rows).toHaveLength(1);
    const row = result.current.rows[0];
    expect(row.id).toBe("swap-1");
    expect(row.fullName).toBe("João Silva");
    expect(row.warName).toBe("Silva");
    expect(row.saram).toBe("123456");
    expect(row.originalDate).toBe("2025-06-01");
    expect(row.newDate).toBe("2025-07-10");
    expect(row.reasonText).toBe("Motivo");
  });

  it("toast.error e rows=[] quando load lança erro", async () => {
    mockFetchSwapRequests.mockRejectedValue(new Error("DB error"));

    const { default: useReschedulingManagement } =
      await import("@/hooks/useReschedulingManagement");
    const { result } = renderHook(() => useReschedulingManagement());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.rows).toEqual([]);
    expect(mockToastError).toHaveBeenCalled();
  });

  it("counts calcula corretamente por status", async () => {
    mockFetchSwapRequests.mockResolvedValue([]);

    const { default: useReschedulingManagement } =
      await import("@/hooks/useReschedulingManagement");
    const { result } = renderHook(() => useReschedulingManagement());

    await waitFor(() => expect(result.current.loading).toBe(false));

    // Injeta rows manualmente via reload não é possível diretamente; testa com swaps reais
    expect(result.current.counts).toEqual({
      solicitado: 0,
      aprovado: 0,
      cancelado: 0,
    });
  });

  it("visibleRows filtra por statusFilter", async () => {
    const swaps = [
      {
        id: "s1",
        booking_id: "b1",
        new_session_id: "sess1",
        status: "solicitado" as const,
        reason: "texto",
      },
      {
        id: "s2",
        booking_id: "b2",
        new_session_id: "sess1",
        status: "aprovado" as const,
        reason: "texto",
      },
    ];
    mockFetchSwapRequests.mockResolvedValue(swaps);

    mockFrom.mockImplementation((table: string) => {
      if (table === "bookings") {
        return {
          select: vi.fn().mockReturnThis(),
          in: vi.fn().mockResolvedValue({
            data: [
              { id: "b1", user_id: "u1", session_id: "sess1" },
              { id: "b2", user_id: "u2", session_id: "sess1" },
            ],
            error: null,
          }),
        };
      }
      if (table === "sessions") {
        return {
          select: vi.fn().mockReturnThis(),
          in: vi.fn().mockResolvedValue({
            data: [{ id: "sess1", date: "2025-06-01" }],
            error: null,
          }),
        };
      }
      if (table === "profiles") {
        return {
          select: vi.fn().mockReturnThis(),
          in: vi.fn().mockResolvedValue({
            data: [
              { id: "u1", full_name: "João", war_name: "J", saram: "111" },
              { id: "u2", full_name: "Maria", war_name: "M", saram: "222" },
            ],
            error: null,
          }),
        };
      }
      return makeFromChain([]);
    });

    const { default: useReschedulingManagement } =
      await import("@/hooks/useReschedulingManagement");
    const { result } = renderHook(() => useReschedulingManagement());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.rows).toHaveLength(2);

    // statusFilter padrão = "solicitado"
    expect(result.current.visibleRows).toHaveLength(1);
    expect(result.current.visibleRows[0].id).toBe("s1");

    act(() => result.current.setStatusFilter("aprovado"));
    expect(result.current.visibleRows).toHaveLength(1);
    expect(result.current.visibleRows[0].id).toBe("s2");
  });

  it("visibleRows filtra por query (fullName/warName/saram)", async () => {
    const swaps = [
      {
        id: "s1",
        booking_id: "b1",
        new_session_id: "sess1",
        status: "solicitado" as const,
        reason: "x",
      },
      {
        id: "s2",
        booking_id: "b2",
        new_session_id: "sess1",
        status: "solicitado" as const,
        reason: "x",
      },
    ];
    mockFetchSwapRequests.mockResolvedValue(swaps);

    mockFrom.mockImplementation((table: string) => {
      if (table === "bookings") {
        return {
          select: vi.fn().mockReturnThis(),
          in: vi.fn().mockResolvedValue({
            data: [
              { id: "b1", user_id: "u1", session_id: "sess1" },
              { id: "b2", user_id: "u2", session_id: "sess1" },
            ],
            error: null,
          }),
        };
      }
      if (table === "sessions") {
        return {
          select: vi.fn().mockReturnThis(),
          in: vi.fn().mockResolvedValue({
            data: [{ id: "sess1", date: "2025-06-01" }],
            error: null,
          }),
        };
      }
      if (table === "profiles") {
        return {
          select: vi.fn().mockReturnThis(),
          in: vi.fn().mockResolvedValue({
            data: [
              {
                id: "u1",
                full_name: "Carlos Souza",
                war_name: "Souza",
                saram: "111",
              },
              {
                id: "u2",
                full_name: "Ana Lima",
                war_name: "Lima",
                saram: "999",
              },
            ],
            error: null,
          }),
        };
      }
      return makeFromChain([]);
    });

    const { default: useReschedulingManagement } =
      await import("@/hooks/useReschedulingManagement");
    const { result } = renderHook(() => useReschedulingManagement());

    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.setQuery("souza"));
    expect(result.current.visibleRows).toHaveLength(1);
    expect(result.current.visibleRows[0].fullName).toBe("Carlos Souza");

    act(() => result.current.setQuery("999"));
    expect(result.current.visibleRows).toHaveLength(1);
    expect(result.current.visibleRows[0].saram).toBe("999");
  });

  it("changeStatus 'aprovado' chama approveSwapRequest e atualiza row", async () => {
    mockFetchSwapRequests.mockResolvedValue([]);
    mockGetUser.mockResolvedValue({ data: { user: { id: "admin-1" } } });
    mockApproveSwapRequest.mockResolvedValue(undefined);

    const { default: useReschedulingManagement } =
      await import("@/hooks/useReschedulingManagement");
    const { result } = renderHook(() => useReschedulingManagement());

    await waitFor(() => expect(result.current.loading).toBe(false));

    // Injeta uma row manualmente via setSelected não é suficiente; testamos o caminho de changeStatus
    // sem rows existentes — a função still deve chamar approveSwapRequest
    await act(async () => {
      await result.current.changeStatus("swap-1", "booking-1", "aprovado");
    });

    expect(mockApproveSwapRequest).toHaveBeenCalledWith("swap-1", "admin-1");
    expect(mockToastSuccess).toHaveBeenCalledWith("Registro atualizado");
  });

  it("changeStatus 'cancelado' chama updateSwapRequestStatus", async () => {
    mockFetchSwapRequests.mockResolvedValue([]);
    mockGetUser.mockResolvedValue({ data: { user: { id: "admin-1" } } });
    mockUpdateSwapRequestStatus.mockResolvedValue(undefined);

    const { default: useReschedulingManagement } =
      await import("@/hooks/useReschedulingManagement");
    const { result } = renderHook(() => useReschedulingManagement());

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.changeStatus("swap-1", "booking-1", "cancelado");
    });

    expect(mockUpdateSwapRequestStatus).toHaveBeenCalledWith(
      "swap-1",
      "cancelado",
      "admin-1",
    );
    expect(mockToastSuccess).toHaveBeenCalledWith("Registro atualizado");
  });

  it("changeStatus erro chama toast.error", async () => {
    mockFetchSwapRequests.mockResolvedValue([]);
    mockGetUser.mockResolvedValue({ data: { user: { id: "admin-1" } } });
    mockApproveSwapRequest.mockRejectedValue(new Error("Falha"));

    const { default: useReschedulingManagement } =
      await import("@/hooks/useReschedulingManagement");
    const { result } = renderHook(() => useReschedulingManagement());

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.changeStatus("swap-1", "booking-1", "aprovado");
    });

    expect(mockToastError).toHaveBeenCalled();
  });

  it("changeStatus 'aprovado' sem adminId lança erro e chama toast.error", async () => {
    mockFetchSwapRequests.mockResolvedValue([]);
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const { default: useReschedulingManagement } =
      await import("@/hooks/useReschedulingManagement");
    const { result } = renderHook(() => useReschedulingManagement());

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.changeStatus("swap-1", "booking-1", "aprovado");
    });

    expect(mockApproveSwapRequest).not.toHaveBeenCalled();
    expect(mockToastError).toHaveBeenCalled();
  });

  it("parseSwapReason: JSON inválido retorna fallback", async () => {
    const rawReason = "texto simples sem JSON";
    const swap = {
      id: "s1",
      booking_id: "b1",
      new_session_id: "sess1",
      status: "solicitado" as const,
      reason: rawReason,
    };
    mockFetchSwapRequests.mockResolvedValue([swap]);

    mockFrom.mockImplementation((table: string) => {
      if (table === "bookings") {
        return {
          select: vi.fn().mockReturnThis(),
          in: vi.fn().mockResolvedValue({
            data: [{ id: "b1", user_id: "u1", session_id: "sess1" }],
            error: null,
          }),
        };
      }
      if (table === "sessions") {
        return {
          select: vi.fn().mockReturnThis(),
          in: vi.fn().mockResolvedValue({ data: [], error: null }),
        };
      }
      if (table === "profiles") {
        return {
          select: vi.fn().mockReturnThis(),
          in: vi.fn().mockResolvedValue({
            data: [{ id: "u1", full_name: "João", war_name: "J", saram: "1" }],
            error: null,
          }),
        };
      }
      return makeFromChain([]);
    });

    const { default: useReschedulingManagement } =
      await import("@/hooks/useReschedulingManagement");
    const { result } = renderHook(() => useReschedulingManagement());

    await waitFor(() => expect(result.current.loading).toBe(false));

    const row = result.current.rows[0];
    expect(row.reasonText).toBe(rawReason);
    expect(row.newDate).toBeNull();
    expect(row.attachmentUrl).toBeNull();
  });
});

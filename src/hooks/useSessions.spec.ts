import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSessions } from "./useSessions";

// ─── mock supabase ────────────────────────────────────────────────────────────
const mockInBookings = vi.fn();
const mockSelectBookings = vi.fn(() => ({ in: mockInBookings }));
const mockOrderPeriod = vi.fn();
const mockOrderDate = vi.fn(() => ({ order: mockOrderPeriod }));
const mockLte = vi.fn(() => ({ order: mockOrderDate }));
const mockGte = vi.fn(() => ({ lte: mockLte }));
const mockSelectSessions = vi.fn(() => ({ gte: mockGte }));
const mockFrom = vi.fn((table: string) => {
  if (table === "sessions") return { select: mockSelectSessions };
  if (table === "bookings") return { select: mockSelectBookings };
  return {};
});

vi.mock("@/services/supabase", () => ({ default: { from: mockFrom } }));

// ─── helpers ─────────────────────────────────────────────────────────────────
function makeSessions(overrides?: object[]) {
  return (overrides ?? []).map((o, i) => ({
    id: `s${i + 1}`,
    date: "2025-01-01",
    period: "manha",
    max_capacity: 10,
    location_id: "loc1",
    status: "aberta",
    location: { name: "Local A" },
    ...o,
  }));
}

function setupMocks(sessionsData: object[], bookingsData: object[]) {
  mockOrderPeriod.mockResolvedValue({ data: sessionsData, error: null });
  mockInBookings.mockResolvedValue({ data: bookingsData, error: null });
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── tests ────────────────────────────────────────────────────────────────────
describe("useSessions", () => {
  it("retorna loading=true no estado inicial", async () => {
    // Never resolves immediately
    mockOrderPeriod.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useSessions());
    expect(result.current.loading).toBe(true);
  });

  it("carrega sessões com occupied_count e available_count corretos", async () => {
    const sessions = makeSessions([{ id: "s1", max_capacity: 5 }]);
    const bookings = [
      { session_id: "s1", status: "confirmado" },
      { session_id: "s1", status: "confirmado" },
      { session_id: "s1", status: "cancelado" }, // deve ser ignorado
    ];
    setupMocks(sessions, bookings);

    const { result } = renderHook(() =>
      useSessions("2025-01-01", "2025-01-31"),
    );
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.sessions).toHaveLength(1);
    expect(result.current.sessions[0].occupied_count).toBe(2);
    expect(result.current.sessions[0].available_count).toBe(3);
    expect(result.current.error).toBeNull();
  });

  it("extrai location_name de objeto direto", async () => {
    const sessions = makeSessions([{ id: "s1", location: { name: "Base X" } }]);
    setupMocks(sessions, []);

    const { result } = renderHook(() => useSessions());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.sessions[0].location_name).toBe("Base X");
  });

  it("extrai location_name de array", async () => {
    const sessions = makeSessions([
      { id: "s1", location: [{ name: "Base Y" }] },
    ]);
    setupMocks(sessions, []);

    const { result } = renderHook(() => useSessions());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.sessions[0].location_name).toBe("Base Y");
  });

  it("retorna location_name=null quando location é null", async () => {
    const sessions = makeSessions([{ id: "s1", location: null }]);
    setupMocks(sessions, []);

    const { result } = renderHook(() => useSessions());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.sessions[0].location_name).toBeNull();
  });

  it("available_count não fica negativo", async () => {
    const sessions = makeSessions([{ id: "s1", max_capacity: 2 }]);
    const bookings = [
      { session_id: "s1", status: "confirmado" },
      { session_id: "s1", status: "confirmado" },
      { session_id: "s1", status: "confirmado" }, // overbooking
    ];
    setupMocks(sessions, bookings);

    const { result } = renderHook(() => useSessions());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.sessions[0].available_count).toBe(0);
  });

  it("seta error e sessions=[] quando sessionsError ocorre", async () => {
    mockOrderPeriod.mockResolvedValue({
      data: null,
      error: { message: "DB error" },
    });

    const { result } = renderHook(() => useSessions());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toContain("DB error");
    expect(result.current.sessions).toEqual([]);
  });

  it("seta error quando bookingsError ocorre", async () => {
    const sessions = makeSessions([{ id: "s1" }]);
    mockOrderPeriod.mockResolvedValue({ data: sessions, error: null });
    mockInBookings.mockResolvedValue({
      data: null,
      error: { message: "bookings error" },
    });

    const { result } = renderHook(() => useSessions());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toContain("bookings error");
    expect(result.current.sessions).toEqual([]);
  });

  it("não faz query de bookings quando não há sessões (retry concluído vazio)", async () => {
    vi.useFakeTimers();
    let callCount = 0;
    mockOrderPeriod.mockImplementation(() => {
      callCount++;
      return Promise.resolve({ data: [], error: null });
    });

    const { result } = renderHook(() => useSessions());

    // Primeira chamada retorna []
    await vi.runAllTimersAsync();
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Não deve ter chamado bookings já que não há sessionIds
    expect(mockSelectBookings).not.toHaveBeenCalled();
    // Retry foi feito (2 chamadas a sessions)
    expect(callCount).toBe(2);
    expect(result.current.sessions).toEqual([]);

    vi.useRealTimers();
  });

  it("refresh recarrega as sessões", async () => {
    const sessions = makeSessions([{ id: "s1" }]);
    setupMocks(sessions, []);

    const { result } = renderHook(() => useSessions());
    await waitFor(() => expect(result.current.loading).toBe(false));

    // chama refresh
    const newSessions = makeSessions([{ id: "s1" }, { id: "s2" }]);
    setupMocks(newSessions, []);

    await result.current.refresh();
    await waitFor(() => expect(result.current.sessions).toHaveLength(2));
  });

  it("não atualiza estado após unmount", async () => {
    const sessions = makeSessions([{ id: "s1" }]);
    let resolvePromise!: (v: unknown) => void;
    mockOrderPeriod.mockReturnValue(
      new Promise((r) => {
        resolvePromise = r;
      }),
    );

    const { result, unmount } = renderHook(() => useSessions());
    expect(result.current.loading).toBe(true);

    unmount();
    resolvePromise({ data: sessions, error: null });

    // Sem erro após unmount — loading permanece true pois mountedRef é false
    expect(result.current.loading).toBe(true);
  });
});

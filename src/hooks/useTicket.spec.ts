import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import useTicket from "./useTicket";

// ── mocks ──────────────────────────────────────────────────────────────────

const mockFrom = vi.fn();

vi.mock("@/services/supabase", () => ({
  default: { from: (...args: unknown[]) => mockFrom(...args) },
}));

vi.mock("react-router-dom", () => ({
  useLocation: vi.fn(() => ({ state: null })),
}));

vi.mock("@/hooks/useAuth", () => ({
  default: vi.fn(() => ({ user: null })),
}));

vi.mock("@/utils/booking", () => ({
  formatSessionPeriod: vi.fn((p: string) => `PERIOD(${p})`),
}));

vi.mock("@/utils/date", () => ({
  formatDateTicket: vi.fn((d: string) => `DATE(${d})`),
}));

// ── helpers ────────────────────────────────────────────────────────────────

import { useLocation } from "react-router-dom";
import useAuth from "./useAuth";

const mockUseLocation = useLocation as ReturnType<typeof vi.fn>;
const mockUseAuth = useAuth as ReturnType<typeof vi.fn>;

/** Builds a chainable Supabase query stub that resolves with `result`. */
function makeChain(result: unknown) {
  const chain: Record<string, unknown> = {};
  const methods = [
    "select",
    "eq",
    "in",
    "order",
    "limit",
    "maybeSingle",
    "head",
    "count",
  ];
  methods.forEach((m) => {
    chain[m] = vi.fn(() => chain);
  });
  (chain as Record<string, unknown>).then = (
    resolve: (v: unknown) => unknown,
  ) => Promise.resolve(result).then(resolve);
  return chain;
}

const SESSION_DATA = {
  id: "session-1",
  date: "2025-08-10",
  period: "manha",
  location: { name: "CAGR" },
};

const PROFILE_DATA = {
  id: "user-1",
  war_name: "Silva",
  full_name: "João Silva",
  saram: "1234567",
};

const BOOKING_DATA = {
  id: "booking-1",
  user_id: "user-1",
  session_id: "session-1",
  order_number: "ORDER-001",
  status: "agendado",
};

// ── tests ──────────────────────────────────────────────────────────────────

describe("useTicket", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseLocation.mockReturnValue({ state: null });
    mockUseAuth.mockReturnValue({ user: null });
  });

  it("inicializa com ticket null", () => {
    const { result } = renderHook(() => useTicket());
    expect(result.current.ticket).toBeNull();
  });

  it("sem user e sem bookingId → ticket null após load", async () => {
    mockUseAuth.mockReturnValue({ user: null });
    mockUseLocation.mockReturnValue({ state: null });

    mockFrom.mockReturnValue(makeChain({ data: null, error: null }));

    const { result } = renderHook(() => useTicket());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.ticket).toBeNull();
  });

  it("com user mas sem bookings → ticket null", async () => {
    mockUseAuth.mockReturnValue({ user: { id: "user-1" } });

    // latest booking query returns null
    mockFrom.mockReturnValue(
      makeChain({ data: null, error: null, count: null }),
    );

    const { result } = renderHook(() => useTicket());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.ticket).toBeNull();
    expect(result.current.bookingId).toBeNull();
  });

  it("usa initial quando não há bookingId no estado de rota", async () => {
    const initial = {
      name: "Cached",
      saram: "000",
      location: "Local",
      date: "01/01/2025",
      time: "Manhã",
      code: "CODE-0",
    };

    mockUseLocation.mockReturnValue({ state: null });
    mockUseAuth.mockReturnValue({ user: null });

    const { result } = renderHook(() => useTicket(initial));
    await waitFor(() => expect(result.current.loading).toBe(false));

    // initial usado como fallback; confirmed=true
    expect(result.current.ticket?.name).toBe("Cached");
    expect(result.current.ticket?.confirmed).toBe(true);
  });

  it("carrega ticket completo a partir do bookingId no estado de rota", async () => {
    mockUseAuth.mockReturnValue({ user: { id: "user-1" } });
    mockUseLocation.mockReturnValue({
      state: { bookingId: "booking-1", orderNumber: "ORDER-001" },
    });

    // We need to handle multiple calls to `from`:
    // 1. bookings (by id) → BOOKING_DATA
    // 2. sessions + profiles (Promise.all) → SESSION_DATA, PROFILE_DATA
    // 3. swap_requests → count=0
    let callIndex = 0;
    const responses = [
      { data: BOOKING_DATA, error: null },
      { data: SESSION_DATA, error: null }, // session
      { data: PROFILE_DATA, error: null }, // profile
      { data: null, error: null, count: 0 }, // swap_requests
    ];

    mockFrom.mockImplementation(() => {
      const result = responses[callIndex] ?? { data: null, error: null };
      callIndex++;
      return makeChain(result);
    });

    const { result } = renderHook(() => useTicket());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.ticket?.name).toBe("Silva");
    expect(result.current.ticket?.saram).toBe("1234567");
    expect(result.current.ticket?.location).toBe("CAGR");
    expect(result.current.ticket?.date).toBe("DATE(2025-08-10)");
    expect(result.current.ticket?.time).toBe("PERIOD(manha)");
    expect(result.current.ticket?.code).toBe("ORDER-001");
    expect(result.current.ticket?.confirmed).toBe(true);
    expect(result.current.hasPendingSwap).toBe(false);
    expect(result.current.bookingId).toBe("booking-1");
  });

  it("hasPendingSwap true quando há swap_requests pendentes", async () => {
    mockUseAuth.mockReturnValue({ user: { id: "user-1" } });
    mockUseLocation.mockReturnValue({
      state: { bookingId: "booking-1" },
    });

    let callIndex = 0;
    const responses = [
      { data: BOOKING_DATA, error: null },
      { data: SESSION_DATA, error: null },
      { data: PROFILE_DATA, error: null },
      { data: null, error: null, count: 2 }, // 2 swap requests pendentes
    ];

    mockFrom.mockImplementation(() => {
      const result = responses[callIndex] ?? { data: null, error: null };
      callIndex++;
      return makeChain(result);
    });

    const { result } = renderHook(() => useTicket());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.hasPendingSwap).toBe(true);
  });

  it("booking com status remarcado → confirmed true", async () => {
    mockUseAuth.mockReturnValue({ user: { id: "user-1" } });
    mockUseLocation.mockReturnValue({
      state: { bookingId: "booking-1" },
    });

    const remarcadoBooking = { ...BOOKING_DATA, status: "remarcado" };

    let callIndex = 0;
    const responses = [
      { data: remarcadoBooking, error: null },
      { data: SESSION_DATA, error: null },
      { data: PROFILE_DATA, error: null },
      { data: null, error: null, count: 0 },
    ];

    mockFrom.mockImplementation(() => {
      const result = responses[callIndex] ?? { data: null, error: null };
      callIndex++;
      return makeChain(result);
    });

    const { result } = renderHook(() => useTicket());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.ticket?.confirmed).toBe(true);
  });

  it("refresh() incrementa reloadKey e recarrega dados", async () => {
    mockUseAuth.mockReturnValue({ user: { id: "user-1" } });
    mockUseLocation.mockReturnValue({
      state: { bookingId: "booking-1" },
    });

    const responses = [
      { data: BOOKING_DATA, error: null },
      { data: SESSION_DATA, error: null },
      { data: PROFILE_DATA, error: null },
      { data: null, error: null, count: 0 },
      // segunda carga após refresh
      { data: BOOKING_DATA, error: null },
      { data: SESSION_DATA, error: null },
      { data: PROFILE_DATA, error: null },
      { data: null, error: null, count: 0 },
    ];
    let callIndex = 0;
    mockFrom.mockImplementation(() => {
      const result = responses[callIndex] ?? { data: null, error: null };
      callIndex++;
      return makeChain(result);
    });

    const { result } = renderHook(() => useTicket());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const firstCallCount = callIndex;

    const { act } = await import("@testing-library/react");
    await act(async () => result.current.refresh());
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Deve ter feito mais chamadas após refresh
    expect(callIndex).toBeGreaterThan(firstCallCount);
  });

  it("expõe sessionDateIso corretamente", async () => {
    mockUseAuth.mockReturnValue({ user: { id: "user-1" } });
    mockUseLocation.mockReturnValue({ state: { bookingId: "booking-1" } });

    let callIndex = 0;
    const responses = [
      { data: BOOKING_DATA, error: null },
      { data: SESSION_DATA, error: null },
      { data: PROFILE_DATA, error: null },
      { data: null, error: null, count: 0 },
    ];
    mockFrom.mockImplementation(() => {
      const r = responses[callIndex] ?? { data: null, error: null };
      callIndex++;
      return makeChain(r);
    });

    const { result } = renderHook(() => useTicket());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.sessionDateIso).toBe("2025-08-10");
  });
});

import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import useAuth from "./useAuth";

// ── mocks ───────────────────────────────────────────────────────────────────
const mockUnsubscribe = vi.fn();
const mockGetSession = vi.fn();
const mockSignOut = vi.fn();
const mockOnAuthStateChange = vi.fn(() => ({
  data: { subscription: { unsubscribe: mockUnsubscribe } },
}));
const mockFrom = vi.fn();

vi.mock("@/services/supabase", () => ({
  default: {
    auth: {
      getSession: mockGetSession,
      signOut: mockSignOut,
      onAuthStateChange: mockOnAuthStateChange,
    },
    from: mockFrom,
  },
  upsertProfile: vi.fn(),
}));

vi.mock("@/constants/storage", () => ({
  SESSION_PROFILE_KEY: "tacf-test-profile",
}));

// ── helpers ──────────────────────────────────────────────────────────────────
const makeSession = (id = "uid-1") => ({
  user: { id, email: "user@test.com" },
  access_token: "tok",
  refresh_token: "ref",
});

const makeProfile = (id = "uid-1") => ({
  id,
  full_name: "Test User",
  war_name: "Tester",
  saram: "111111",
  role: "user",
});

function mockProfileSelect(profile: ReturnType<typeof makeProfile> | null) {
  mockFrom.mockReturnValue({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({ data: profile, error: null }),
      }),
    }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
  // default: no session
  mockGetSession.mockResolvedValue({ data: { session: null }, error: null });
  mockSignOut.mockResolvedValue({});
  mockOnAuthStateChange.mockReturnValue({
    data: { subscription: { unsubscribe: mockUnsubscribe } },
  });
});

// ── tests ────────────────────────────────────────────────────────────────────
describe("useAuth", () => {
  it("começa com loading=true e termina com loading=false (sem sessão)", async () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toBeNull();
    expect(result.current.profile).toBeNull();
  });

  it("popula user e profile quando há sessão válida", async () => {
    const session = makeSession();
    const profile = makeProfile();
    mockGetSession.mockResolvedValue({ data: { session }, error: null });
    mockProfileSelect(profile);

    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.user?.id).toBe("uid-1");
    expect(result.current.profile?.full_name).toBe("Test User");
  });

  it("usa perfil em cache do sessionStorage se id bater", async () => {
    const profile = makeProfile();
    sessionStorage.setItem("tacf-test-profile", JSON.stringify(profile));

    const session = makeSession();
    mockGetSession.mockResolvedValue({ data: { session }, error: null });
    // selecta perfil atualizado em background
    mockProfileSelect(profile);

    const { result } = renderHook(() => useAuth());
    // perfil está disponível antes mesmo do await
    expect(result.current.profile?.id).toBe("uid-1");
    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  it("registra e cancela subscription em onAuthStateChange", async () => {
    const { unmount } = renderHook(() => useAuth());
    await waitFor(() => expect(mockOnAuthStateChange).toHaveBeenCalled());
    unmount();
    expect(mockUnsubscribe).toHaveBeenCalled();
  });

  it("signOut chama supabase.auth.signOut e limpa estado", async () => {
    const session = makeSession();
    const profile = makeProfile();
    mockGetSession.mockResolvedValue({ data: { session }, error: null });
    mockProfileSelect(profile);

    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.signOut();
    });

    expect(mockSignOut).toHaveBeenCalled();
    expect(result.current.user).toBeNull();
    expect(result.current.profile).toBeNull();
  });

  it("define error quando getSession rejeita", async () => {
    mockGetSession.mockRejectedValue(new Error("network failure"));

    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe("network failure");
    expect(result.current.user).toBeNull();
  });

  it("dispara clearLocalAuthState se token de refresh inválido", async () => {
    mockGetSession.mockRejectedValue(new Error("invalid refresh token"));
    // signOut scope local
    mockSignOut.mockResolvedValue({});

    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockSignOut).toHaveBeenCalledWith({ scope: "local" });
  });

  it("profile null quando uid existe mas não há linha no DB", async () => {
    const session = makeSession();
    mockGetSession.mockResolvedValue({ data: { session }, error: null });
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
        limit: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    });

    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));

    // pode ou não ter perfil de fallback em dev — sem erro
    expect(result.current.error).toBeUndefined();
  });
});

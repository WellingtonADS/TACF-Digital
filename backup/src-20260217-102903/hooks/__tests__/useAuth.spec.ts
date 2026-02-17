import { supabase } from "@/services/supabase";
import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import useAuth from "../useAuth";

afterEach(() => vi.restoreAllMocks());

describe("useAuth", () => {
  it("loads unauthenticated when no user", async () => {
    vi.spyOn(supabase.auth, "getUser").mockResolvedValue({
      data: { user: null },
    } as any);

    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toBeNull();
    expect(result.current.profile).toBeNull();
  });
});

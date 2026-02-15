import { afterEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { waitFor } from "@testing-library/react";
import useAuth from "../useAuth";
import { supabase } from "@/services/supabase";

afterEach(() => vi.restoreAllMocks());

describe("useAuth", () => {
  it("loads unauthenticated when no user", async () => {
    vi.spyOn(supabase.auth, "getUser").mockResolvedValue({ data: { user: null } } as any);

    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toBeNull();
    expect(result.current.profile).toBeNull();
  });
});

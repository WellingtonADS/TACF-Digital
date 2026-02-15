import { describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { waitFor } from "@testing-library/react";
import useSupabaseQuery from "../useSupabaseQuery";

describe("useSupabaseQuery", () => {
  it("fetches data and exposes loading state", async () => {
    const fn = vi.fn().mockResolvedValue({ x: 1 });

    const { result } = renderHook(() => useSupabaseQuery(fn, []));

    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data).toEqual({ x: 1 });
  });
});

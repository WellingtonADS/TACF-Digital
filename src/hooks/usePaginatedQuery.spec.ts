import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import usePaginatedQuery from "./usePaginatedQuery";

vi.mock("@/utils/rpc", () => ({
  callRpcWithRetry: vi.fn(),
}));

import { callRpcWithRetry } from "@/utils/rpc";

const mockRpc = callRpcWithRetry as ReturnType<typeof vi.fn>;

describe("usePaginatedQuery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("inicia com estado vazio e hasMore=true", () => {
    const { result } = renderHook(() => usePaginatedQuery("my_rpc"));
    expect(result.current.items).toEqual([]);
    expect(result.current.hasMore).toBe(true);
    expect(result.current.loading).toBe(false);
  });

  it("carrega a primeira página corretamente", async () => {
    mockRpc.mockResolvedValueOnce({
      data: {
        rows: [{ id: 1 }, { id: 2 }],
        next_cursor: "cursor1",
        has_more: true,
      },
      error: null,
    });

    const { result } = renderHook(() => usePaginatedQuery("my_rpc"));

    await act(async () => {
      await result.current.fetchPage();
    });

    expect(result.current.items).toEqual([{ id: 1 }, { id: 2 }]);
    expect(result.current.hasMore).toBe(true);
    expect(mockRpc).toHaveBeenCalledWith(
      "my_rpc",
      expect.objectContaining({ p_limit: 25, p_cursor: null }),
      expect.objectContaining({ timeoutMs: 3000, retries: 1 }),
    );
  });

  it("acumula itens em páginas subsequentes", async () => {
    mockRpc
      .mockResolvedValueOnce({
        data: { rows: [{ id: 1 }], next_cursor: "cursor1", has_more: true },
        error: null,
      })
      .mockResolvedValueOnce({
        data: { rows: [{ id: 2 }], next_cursor: null, has_more: false },
        error: null,
      });

    const { result } = renderHook(() => usePaginatedQuery("my_rpc"));

    await act(async () => {
      await result.current.fetchPage();
    });
    await act(async () => {
      await result.current.fetchPage();
    });

    expect(result.current.items).toEqual([{ id: 1 }, { id: 2 }]);
    expect(result.current.hasMore).toBe(false);
  });

  it("não faz fetch quando hasMore=false", async () => {
    mockRpc.mockResolvedValueOnce({
      data: { rows: [{ id: 1 }], next_cursor: null, has_more: false },
      error: null,
    });

    const { result } = renderHook(() => usePaginatedQuery("my_rpc"));

    await act(async () => {
      await result.current.fetchPage();
    });
    await act(async () => {
      await result.current.fetchPage();
    });

    expect(mockRpc).toHaveBeenCalledTimes(1);
  });

  it("reset limpa os itens e permite nova busca", async () => {
    mockRpc
      .mockResolvedValueOnce({
        data: { rows: [{ id: 1 }], next_cursor: "c1", has_more: true },
        error: null,
      })
      .mockResolvedValueOnce({
        data: { rows: [{ id: 2 }], next_cursor: null, has_more: false },
        error: null,
      });

    const { result } = renderHook(() => usePaginatedQuery("my_rpc"));

    await act(async () => {
      await result.current.fetchPage();
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.items).toEqual([]);
    expect(result.current.hasMore).toBe(true);

    await act(async () => {
      await result.current.fetchPage();
    });
    expect(result.current.items).toEqual([{ id: 2 }]);
  });

  it("trata payload nulo sem quebrar", async () => {
    mockRpc.mockResolvedValueOnce({ data: null, error: null });

    const { result } = renderHook(() => usePaginatedQuery("my_rpc"));

    await act(async () => {
      await result.current.fetchPage();
    });

    expect(result.current.items).toEqual([]);
  });

  it("trata erro do rpc sem quebrar", async () => {
    mockRpc.mockResolvedValueOnce({
      data: null,
      error: { message: "db error" },
    });

    const { result } = renderHook(() => usePaginatedQuery("my_rpc"));

    await act(async () => {
      await result.current.fetchPage();
    });

    expect(result.current.items).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it("passa opções from/to para o rpc", async () => {
    mockRpc.mockResolvedValueOnce({
      data: { rows: [], has_more: false },
      error: null,
    });

    const { result } = renderHook(() =>
      usePaginatedQuery("my_rpc", {
        from: "2024-01-01",
        to: "2024-12-31",
        limit: 10,
      }),
    );

    await act(async () => {
      await result.current.fetchPage();
    });

    expect(mockRpc).toHaveBeenCalledWith(
      "my_rpc",
      expect.objectContaining({
        p_limit: 10,
        p_from: "2024-01-01",
        p_to: "2024-12-31",
      }),
      expect.any(Object),
    );
  });
});

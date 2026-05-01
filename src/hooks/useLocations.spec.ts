import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import useLocations from "./useLocations";

const mockRpc = vi.fn();

vi.mock("../services/supabase", () => ({
  default: {
    rpc: (...args: unknown[]) => mockRpc(...args),
  },
}));

vi.mock("../utils/getAuthorizationErrorMessage", () => ({
  getAuthorizationErrorMessage: vi.fn(() => null),
}));

describe("useLocations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("estado inicial correto", () => {
    const { result } = renderHook(() => useLocations());
    expect(result.current.locations).toEqual([]);
    expect(result.current.total).toBe(0);
    expect(result.current.error).toBeNull();
  });

  it("fetch carrega locations e total", async () => {
    const rows = [
      {
        id: "1",
        name: "Local A",
        address: "Rua 1",
        max_capacity: 10,
        status: "ativo",
        facilities: null,
        metadata: null,
        created_at: "",
        updated_at: "",
        total_count: 2,
      },
      {
        id: "2",
        name: "Local B",
        address: "Rua 2",
        max_capacity: 5,
        status: "ativo",
        facilities: null,
        metadata: null,
        created_at: "",
        updated_at: "",
        total_count: 2,
      },
    ];
    mockRpc.mockResolvedValueOnce({ data: rows, error: null });

    const { result } = renderHook(() => useLocations());
    await act(async () => {
      await result.current.fetch();
    });

    expect(result.current.locations).toHaveLength(2);
    expect(result.current.total).toBe(2);
    expect(result.current.locations[0]).not.toHaveProperty("total_count");
  });

  it("fetch com parâmetros passa args corretos ao rpc", async () => {
    mockRpc.mockResolvedValueOnce({ data: [], error: null });
    const { result } = renderHook(() => useLocations());

    await act(async () => {
      await result.current.fetch({
        search: "test",
        status: "ativo",
        page: 2,
        limit: 10,
      });
    });

    expect(mockRpc).toHaveBeenCalledWith("get_locations", {
      p_search_term: "test",
      p_status: "ativo",
      p_limit: 10,
      p_offset: 10,
    });
  });

  it("fetch define error em caso de falha", async () => {
    mockRpc.mockResolvedValueOnce({ data: null, error: new Error("DB error") });
    const { result } = renderHook(() => useLocations());

    await act(async () => {
      await result.current.fetch();
    });

    expect(result.current.error).not.toBeNull();
  });

  it("create chama rpc create_location e despacha evento", async () => {
    const newLocation = {
      id: "3",
      name: "Local C",
      address: "Rua 3",
      max_capacity: 8,
      status: "ativo",
      facilities: null,
      metadata: null,
      created_at: "",
      updated_at: "",
    };
    mockRpc.mockResolvedValueOnce({ data: newLocation, error: null });

    const dispatchSpy = vi.spyOn(window, "dispatchEvent");
    const { result } = renderHook(() => useLocations());

    let created: unknown;
    await act(async () => {
      created = await result.current.create({
        name: "Local C",
        address: "Rua 3",
        max_capacity: 8,
        status: "ativo",
        facilities: null,
        metadata: null,
      });
    });

    expect(mockRpc).toHaveBeenCalledWith("create_location", expect.any(Object));
    expect(created).toEqual(newLocation);
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: "locations:changed" }),
    );
  });

  it("create retorna null em caso de erro", async () => {
    mockRpc.mockResolvedValueOnce({ data: null, error: new Error("fail") });

    const { result } = renderHook(() => useLocations());
    let res: unknown;
    await act(async () => {
      res = await result.current.create({
        name: "X",
        address: "Y",
        max_capacity: 1,
        status: "ativo",
        facilities: null,
        metadata: null,
      });
    });

    expect(res).toBeNull();
    expect(result.current.error).not.toBeNull();
  });

  it("update chama rpc update_location e despacha evento", async () => {
    const updated = {
      id: "1",
      name: "Updated",
      address: "Rua 1",
      max_capacity: 10,
      status: "ativo",
      facilities: null,
      metadata: null,
      created_at: "",
      updated_at: "",
    };
    mockRpc.mockResolvedValueOnce({ data: updated, error: null });

    const dispatchSpy = vi.spyOn(window, "dispatchEvent");
    const { result } = renderHook(() => useLocations());

    await act(async () => {
      await result.current.update("1", { name: "Updated" });
    });

    expect(mockRpc).toHaveBeenCalledWith(
      "update_location",
      expect.objectContaining({ p_id: "1" }),
    );
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: "locations:changed" }),
    );
  });

  it("remove chama rpc delete_location e despacha evento", async () => {
    mockRpc.mockResolvedValueOnce({ data: null, error: null });

    const dispatchSpy = vi.spyOn(window, "dispatchEvent");
    const { result } = renderHook(() => useLocations());

    await act(async () => {
      await result.current.remove("1");
    });

    expect(mockRpc).toHaveBeenCalledWith(
      "delete_location",
      expect.objectContaining({ p_id: "1" }),
    );
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: "locations:changed" }),
    );
  });

  it("ouve evento locations:changed e recarrega", async () => {
    mockRpc.mockResolvedValue({ data: [], error: null });
    renderHook(() => useLocations());

    expect(mockRpc).toHaveBeenCalledTimes(0);

    act(() => {
      window.dispatchEvent(new CustomEvent("locations:changed"));
    });

    await waitFor(() => {
      expect(mockRpc).toHaveBeenCalledTimes(1);
    });
  });
});

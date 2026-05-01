import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/services/supabase", () => ({
  supabase: { rpc: vi.fn() },
}));

import { supabase } from "@/services/supabase";
import { callRpcWithRetry } from "./rpc";

const mockRpc = supabase.rpc as unknown as ReturnType<typeof vi.fn>;

describe("callRpcWithRetry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it("retorna data no sucesso", async () => {
    mockRpc.mockResolvedValue({ data: { ok: true }, error: null });

    const result = await callRpcWithRetry("my_rpc", {});

    expect(result.data).toEqual({ ok: true });
    expect(result.error).toBeNull();
    expect(typeof result.durationMs).toBe("number");
  });

  it("retorna erro do supabase sem lançar exceção", async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: "db error" } });

    const result = await callRpcWithRetry("my_rpc", {});

    expect(result.data).toBeNull();
    expect(result.error).toEqual({ message: "db error" });
  });

  it("normaliza data null para null", async () => {
    mockRpc.mockResolvedValue({ data: null, error: null });

    const result = await callRpcWithRetry("my_rpc", {});

    expect(result.data).toBeNull();
    expect(result.error).toBeNull();
  });

  it("faz retry em throw transiente e retorna sucesso", async () => {
    mockRpc
      .mockRejectedValueOnce(new Error("transient"))
      .mockResolvedValueOnce({ data: "ok", error: null });

    vi.useFakeTimers();
    const promise = callRpcWithRetry<string>(
      "my_rpc",
      {},
      { retries: 1, backoffMs: 100 },
    );
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result.data).toBe("ok");
    expect(result.error).toBeNull();
    expect(mockRpc).toHaveBeenCalledTimes(2);
  });

  it("esgota retries e retorna mensagem de erro", async () => {
    mockRpc.mockRejectedValue(new Error("always fails"));

    vi.useFakeTimers();
    const promise = callRpcWithRetry(
      "my_rpc",
      {},
      { retries: 1, backoffMs: 100 },
    );
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result.data).toBeNull();
    expect(result.error?.message).toMatch(/always fails/);
    expect(mockRpc).toHaveBeenCalledTimes(2);
  });

  it("trata timeout sem retries e retorna erro de timeout", async () => {
    mockRpc.mockImplementation(() => new Promise(() => {})); // never resolves

    vi.useFakeTimers();
    const promise = callRpcWithRetry(
      "my_rpc",
      {},
      { timeoutMs: 100, retries: 0 },
    );
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result.data).toBeNull();
    expect(result.error?.message).toMatch(/timeout/);
  });

  it("trata timeout com retry e retorna sucesso na segunda tentativa", async () => {
    mockRpc
      .mockImplementationOnce(() => new Promise(() => {})) // 1ª: nunca resolve
      .mockResolvedValueOnce({ data: "recovered", error: null });

    vi.useFakeTimers();
    const promise = callRpcWithRetry<string>(
      "my_rpc",
      {},
      {
        timeoutMs: 100,
        retries: 1,
        backoffMs: 50,
      },
    );
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result.data).toBe("recovered");
  });

  it("passa params para supabase.rpc", async () => {
    mockRpc.mockResolvedValue({ data: null, error: null });

    await callRpcWithRetry("my_rpc", { id: 42, name: "test" });

    expect(mockRpc).toHaveBeenCalledWith("my_rpc", { id: 42, name: "test" });
  });

  it("usa defaults quando options não é fornecido", async () => {
    mockRpc.mockResolvedValue({ data: "default", error: null });

    const result = await callRpcWithRetry("my_rpc");

    expect(result.data).toBe("default");
  });
});

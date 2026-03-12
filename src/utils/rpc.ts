import { supabase } from "@/services/supabase";

type RpcResult<T> = {
  data: T | null;
  error: { message: string } | null;
  durationMs?: number;
};

export async function callRpcWithRetry<T = unknown>(
  rpcName: string,
  params: Record<string, unknown> = {},
  options?: { timeoutMs?: number; retries?: number; backoffMs?: number },
): Promise<RpcResult<T>> {
  const timeoutMs = options?.timeoutMs ?? 3000;
  const retries = options?.retries ?? 1;
  const backoffMs = options?.backoffMs ?? 250;

  let attempt = 0;
  const start = Date.now();

  while (attempt <= retries) {
    try {
      const rpcPromise = supabase.rpc(rpcName, params);

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("rpc timeout")), timeoutMs),
      );

      // Promise.race - if timeout fires, treat as transient error and retry
      // Note: supabase.rpc cannot be aborted; we simply ignore late resolution.
      const result = (await Promise.race([rpcPromise, timeoutPromise])) as {
        data: T | null;
        error: { message: string } | null;
      };

      const durationMs = Date.now() - start;
      return {
        data: result.data ?? null,
        error: result.error ?? null,
        durationMs,
      };
    } catch (err: unknown) {
      attempt += 1;
      if (attempt > retries) {
        const durationMs = Date.now() - start;
        const message = err instanceof Error ? err.message : String(err);
        return { data: null, error: { message }, durationMs };
      }
      // backoff before retry
      await new Promise((r) => setTimeout(r, backoffMs * attempt));
    }
  }

  return { data: null, error: { message: "unknown" } };
}

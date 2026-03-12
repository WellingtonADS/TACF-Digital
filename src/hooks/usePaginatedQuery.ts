/**
 * @module Domínio
 * @page usePaginatedQuery
 * @description Descrição concisa da funcionalidade.
 * @path src\hooks\usePaginatedQuery.ts
 */


import { callRpcWithRetry } from "@/utils/rpc";
import { useCallback, useState } from "react";

/*
  Expected RPC contract for paginated RPCs used with this hook:
  - returns an object: { rows: T[], next_cursor?: string|null, has_more?: boolean }
  - the hook validates that `rows` is an array before updating state
  - Use cursor-based RPCs that accept params: p_limit, p_cursor, p_from, p_to
*/

type PaginatedResult<T> = {
  rows: T[];
  next_cursor?: string | null;
  has_more?: boolean;
};

type PaginatedRpcParams = {
  p_limit: number;
  p_cursor: string | null;
  p_from: string | null;
  p_to: string | null;
};

export default function usePaginatedQuery<T = unknown>(
  rpcName: string,
  opts?: { limit?: number; from?: string | null; to?: string | null },
) {
  const limit = opts?.limit ?? 25;
  const [items, setItems] = useState<T[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const fetchPage = useCallback(async () => {
    if (!hasMore) return;
    setLoading(true);
    try {
      const params: PaginatedRpcParams = {
        p_limit: limit,
        p_cursor: cursor,
        p_from: opts?.from ?? null,
        p_to: opts?.to ?? null,
      };

      const { data: rpcRaw, error } = await callRpcWithRetry<unknown>(
        rpcName,
        { ...params } as Record<string, unknown>,
        { timeoutMs: 3000, retries: 1 },
      );

      if (error) {
        console.error(error.message);
        setLoading(false);
        return;
      }

      const payload = rpcRaw as unknown as PaginatedResult<T> | null;
      if (!payload || !Array.isArray(payload.rows)) {
        console.error("Paginated RPC returned unexpected shape", payload);
        setLoading(false);
        return;
      }

      const rows = payload.rows ?? [];
      setItems((prev) => [...prev, ...rows]);
      setCursor(payload?.next_cursor ?? null);
      setHasMore(!!payload?.has_more);
    } finally {
      setLoading(false);
    }
  }, [rpcName, limit, cursor, opts?.from, opts?.to, hasMore]);

  const reset = useCallback(() => {
    setItems([]);
    setCursor(null);
    setHasMore(true);
  }, []);

  return {
    items,
    loading,
    hasMore,
    fetchPage,
    reset,
  } as const;
}

import { useCallback, useState } from "react";
import supabase from "../services/supabase";

type PaginatedResult<T> = {
  rows: T[];
  next_cursor?: string | null;
  has_more?: boolean;
};

export default function usePaginatedQuery<T = any>(
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
      const { data, error } = await supabase.rpc<PaginatedResult<T>>(rpcName, {
        p_limit: limit,
        p_cursor: cursor,
        p_from: opts?.from ?? null,
        p_to: opts?.to ?? null,
      } as any);

      if (error) {
        // eslint-disable-next-line no-console
        console.error(error);
        setLoading(false);
        return;
      }

      const payload = data as unknown as PaginatedResult<T>;
      const rows = payload?.rows ?? [];
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

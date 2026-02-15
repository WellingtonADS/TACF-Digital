import { useCallback, useEffect, useRef, useState } from "react";

type QueryFn<T> = () => Promise<T>;

export default function useSupabaseQuery<T>(queryFn: QueryFn<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  const fetcher = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await queryFn();
      if (!mounted.current) return;
      setData(res);
    } catch (err) {
      if (!mounted.current) return;
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, // eslint-disable-next-line react-hooks/exhaustive-deps
  deps);

  useEffect(() => {
    mounted.current = true;
    fetcher();
    return () => {
      mounted.current = false;
    };
  }, [fetcher]);

  return { data, loading, error, refetch: fetcher } as const;
}

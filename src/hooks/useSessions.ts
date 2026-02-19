import { useEffect, useState } from "react";

export function useSessions() {
  const [sessions, setSessions] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSessions([]);
      setLoading(false);
    }, 200);

    return () => {
      clearTimeout(timeout);
    };
  }, []);

  return { sessions, loading, refresh: () => Promise.resolve() };
}

export default useSessions;

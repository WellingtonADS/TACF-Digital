import { useEffect, useState } from "react";

export function useSessions() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // placeholder: load sessions from API/supabase
    setLoading(true);
    setTimeout(() => {
      setSessions([]);
      setLoading(false);
    }, 200);
  }, []);

  return { sessions, loading, refresh: () => Promise.resolve() };
}

export default useSessions;

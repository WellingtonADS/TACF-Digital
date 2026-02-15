import { useCallback, useEffect, useState } from "react";
import { supabase, upsertProfile } from "@/services/supabase";
import type { Database } from "@/types/database.types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"] | null;

export default function useAuth() {
  const [user, setUser] = useState(supabase.auth.getUser);
  const [profile, setProfile] = useState<Profile>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData?.user?.id;
      if (!uid) {
        setUser(null as any);
        setProfile(null);
        return;
      }

      setUser(userData?.user as any);

      const { data: p } = await supabase
        .from<Database["public"]["Tables"]["profiles"]["Row"]>("profiles")
        .select("*")
        .eq("id", uid)
        .maybeSingle();

      setProfile((p as any) ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
      // reload on auth change
      load();
    });
    return () => {
      // unsubscribe
      // @ts-expect-error listener typing in supabase-js
      listener?.subscription?.unsubscribe?.();
    };
  }, [load]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null as any);
    setProfile(null);
  }, []);

  const updateProfile = useCallback(async (payload: Partial<Profile>) => {
    try {
      const up = await upsertProfile(payload as any);
      return up;
    } catch (err) {
      return null;
    }
  }, []);

  return { user: user as any, profile, loading, error, signOut, updateProfile } as const;
}

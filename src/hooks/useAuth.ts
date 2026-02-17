export const useAuth = () => {
  // placeholder hook for refactor skeleton
  return { user: null, isLoading: false };
};

export default useAuth;
import { supabase, upsertProfile } from "@/services/supabase";
import type { Database } from "@/types/database.types";
import { useCallback, useEffect, useState } from "react";

type Profile = Database["public"]["Tables"]["profiles"]["Row"] | null;

export default function useAuth() {
  const [user, setUser] = useState<unknown | null>(null);
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
        setUser(null);
        setProfile(null);
        return;
      }

      setUser(userData?.user ?? null);

      const { data: p } = await supabase
        .from<Database["public"]["Tables"]["profiles"]["Row"]>("profiles")
        .select("*")
        .eq("id", uid)
        .maybeSingle();

      setProfile((p as Profile) ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
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
    setUser(null);
    setProfile(null);
  }, []);

  const updateProfile = useCallback(async (payload: Partial<Profile>) => {
    try {
      const up = await upsertProfile(
        payload as unknown as Database["public"]["Tables"]["profiles"]["Insert"],
      );
      return up;
    } catch {
      return null;
    }
  }, []);

  return { user, profile, loading, error, signOut, updateProfile } as const;
}

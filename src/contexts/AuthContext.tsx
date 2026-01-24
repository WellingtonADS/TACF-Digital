/* eslint-disable react-refresh/only-export-components */
import {
  awaitSession,
  supabase,
  signIn as svcSignIn,
  signUp as svcSignUp,
  upsertProfile as svcUpsertProfile,
} from "@/services/supabase";
import type { Profile } from "@/types/database.types";
import React, { createContext, useContext, useEffect, useState } from "react";

type AuthResponse = { error?: { message?: string } | null };

type UpsertProfileResponse = {
  data?: Profile;
  error?: { message?: string } | null;
};

type AuthContextValue = {
  user: { id: string; email?: string } | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<AuthResponse>;
  signUp: (email: string, password: string) => Promise<AuthResponse>;
  signOut: () => Promise<void>;
  upsertProfile: (p: Partial<Profile>) => Promise<UpsertProfileResponse>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    if (!error && data) setProfile(data as Profile);
    return { data, error };
  };

  useEffect(() => {
    // bootstrap current session
    const init = async () => {
      setLoading(true);
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      if (currentUser) {
        setUser({ id: currentUser.id, email: currentUser.email ?? undefined });
        await fetchProfile(currentUser.id);
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    };

    init();

    const { data } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const u = session?.user;
        if (u) {
          setUser({ id: u.id, email: u.email ?? undefined });
          await fetchProfile(u.id);
        } else {
          setUser(null);
          setProfile(null);
        }
      },
    );

    return () => {
      const sub = (
        data as { subscription?: { unsubscribe?: () => void } } | undefined
      )?.subscription;
      if (sub && typeof sub.unsubscribe === "function") sub.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const res = await svcSignIn(email, password);
    // onAuthStateChange will fetch profile; if session is immediately available, fetch now
    const session = await awaitSession(2000, 500);
    if (session?.user) await fetchProfile(session.user.id);
    return res;
  };

  const signUp = async (email: string, password: string) => {
    const res = await svcSignUp(email, password);
    // If signUp succeeded, wait briefly for session to be available then create a minimal profile from client
    if (!res.error) {
      const session = await awaitSession(10000, 1000);
      const userId = session?.user?.id;
      if (userId) {
        // create minimal profile as client (server policies should prevent sensitive fields)
        // ignore result — fetchProfile will populate context
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        svcUpsertProfile({ id: userId });
        await fetchProfile(userId);
      }
    }
    return res;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  const upsertProfile = async (p: Partial<Profile>) => {
    if (!user) return { error: { message: "Not authenticated" } };
    const payload: Partial<Profile> = { id: user.id, ...p };
    // supabase types for upsert can be strict; use `any` to avoid overly strict generic mismatch here
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("profiles")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .upsert(payload as any)
      .select()
      .single();
    if (!error && data) setProfile(data as Profile);
    return {
      data: data ?? undefined,
      error: error
        ? { message: (error as { message?: string })?.message }
        : null,
    };
  };

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, signIn, signUp, signOut, upsertProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
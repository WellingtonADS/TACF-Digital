/* eslint-disable react-refresh/only-export-components */
import {
  supabase,
  signIn as svcSignIn,
  signUp as svcSignUp,
  upsertProfile as svcUpsertProfile,
} from "@/services/supabase";
import type { Profile, ProfileInsert } from "@/types/database.types";
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
  profileResolved: boolean;
  signIn: (email: string, password: string) => Promise<AuthResponse>;
  signUp: (email: string, password: string) => Promise<AuthResponse>;
  signOut: () => Promise<void>;
  upsertProfile: (p: Partial<Profile>) => Promise<UpsertProfileResponse>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  // Indicates whether we finished an initial attempt to fetch the profile (success or not)
  // When bootstrap is removed we default to resolved so the UI can render immediately
  const [profileResolved, setProfileResolved] = useState(true);

  // Função centralizada para buscar perfil
  const fetchProfile = async (userId: string) => {
    console.debug("fetchProfile start:", userId);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw error;

      // Verify session is still the same user before applying result (prevents stale results after signOut)
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user || session.user.id !== userId) {
        console.warn(
          "fetchProfile result ignored because session changed or user signed out",
          session?.user?.id ?? null,
        );
        return { data: null, error: new Error("session_changed") };
      }

      console.debug("fetchProfile success:", (data as Profile | null)?.id);
      setProfile(data as Profile);
      setProfileResolved(true);
      return { data, error: null };
    } catch (error) {
      console.warn("Perfil não encontrado ou erro na busca:", error);
      setProfile(null);
      setProfileResolved(true);
      return { data: null, error };
    }
  };

  useEffect(() => {
    // 1. Inicialização da sessão (com timeout por etapa para diagnóstico)
    // Bootstrap intentionally removed: do not block the UI on mount. Auth state driven by onAuthStateChange.

    // Bootstrap removed: avoid blocking the UI on mount. Rely on onAuthStateChange to drive auth state.
    setLoading(false);

    // 2. Ouvinte de mudanças de Auth (Login/Logout)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.debug("onAuthStateChange:", _event, session?.user?.id ?? "none");
      const currentUser = session?.user;

      if (currentUser) {
        setUser({ id: currentUser.id, email: currentUser.email });
        // attempt to fetch profile but do not block UI on failure
        fetchProfile(currentUser.id).catch((err) => {
          console.warn("fetchProfile failed on auth change:", err);
          setProfile(null);
          setProfileResolved(true);
        });
      } else {
        setUser(null);
        setProfile(null);
        // No user -> profile considered resolved so Login can be shown
        setProfileResolved(true);
      }
      setLoading(false);
    });

    // Global handlers to catch unexpected runtime errors that might leave the UI blank
    const onWindowError = (ev: ErrorEvent) => {
      console.error("Global window error:", ev.error ?? ev.message, ev);
      setLoading(false);
      setProfileResolved(true);
    };

    const onUnhandledRejection = (ev: PromiseRejectionEvent) => {
      console.error("Unhandled promise rejection:", ev.reason, ev);
      setLoading(false);
      setProfileResolved(true);
    };

    window.addEventListener("error", onWindowError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("error", onWindowError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const res = await svcSignIn(email, password);
    // O onAuthStateChange cuidará de atualizar o estado do profile
    return res;
  };

  const signUp = async (email: string, password: string) => {
    const res = await svcSignUp(email, password);
    // Try to create a minimal profile for the newly created user when possible.
    // Some Supabase instances do not auto sign-in on signUp, so we check for returned session/user first.
    try {
      const userId = (res as unknown)?.data?.user?.id ?? undefined;
      // If we didn't get a user back, attempt to read current session user
      if (!userId) {
        const { data: sessionData } = await supabase.auth.getSession();
        const currentUser = (sessionData as unknown)?.session?.user;
        if (currentUser) {
          // We are auto-signed in
          await svcUpsertProfile({ id: currentUser.id }).catch((e) => {
            console.warn("upsertProfile after signup failed (auto-signin):", e);
          });
        }
      } else {
        // We have a user returned from signUp (sessionless case)
        await svcUpsertProfile({ id: userId }).catch((e) => {
          console.warn("upsertProfile after signup failed (returned user):", e);
        });
      }
    } catch (e) {
      console.warn("Post-signup profile upsert attempt failed:", e);
    }

    // No signUp, o Supabase geralmente loga o usuário automaticamente se a confirmação de e-mail estiver off
    return res;
  };

  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    // mark resolved so UI can switch to Login immediately
    setProfileResolved(true);
    setLoading(false);
  };

  const upsertProfile = async (p: Partial<Profile>) => {
    if (!user) return { error: { message: "Não autenticado" } };

    setLoading(true);
    try {
      const payload: Partial<ProfileInsert> = {
        ...(p as Partial<ProfileInsert>),
        id: user.id,
        email: user.email ?? undefined,
      };
      const res = await svcUpsertProfile(payload);
      const { data, error } = res;

      if (error) throw error;

      const updatedProfile = data as Profile;
      setProfile(updatedProfile);
      return { data: updatedProfile, error: null };
    } catch (err) {
      const errorObj = err as { message?: string };
      return {
        data: undefined,
        error: { message: errorObj.message || "Erro ao atualizar perfil" },
      };
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (user?.id) await fetchProfile(user.id);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        profileResolved,
        signIn,
        signUp,
        signOut,
        upsertProfile,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}

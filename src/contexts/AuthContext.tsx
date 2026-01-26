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
  const [loading, setLoading] = useState(true);
  // Indicates whether we finished an initial attempt to fetch the profile (success or not)
  const [profileResolved, setProfileResolved] = useState(false);

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

      console.debug("fetchProfile success:", data?.id);
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
    // 1. Inicialização da sessão
    const bootstrap = async () => {
      console.debug("Auth bootstrap start");
      setLoading(true);

      // Safety timeout: if bootstrap hangs, force signOut after 8s to guarantee showing Login
      let timeout = setTimeout(async () => {
        console.warn("Auth bootstrap timeout, forcing signOut to show Login");
        try {
          try {
            await supabase.auth.signOut();
          } catch (e) {
            console.warn("Falha ao tentar signOut forçado no timeout:", e);
          }
        } catch (err) {
          console.warn("Erro ao executar signOut forçado no timeout:", err);
        } finally {
          // Ensure app shows Login state
          setUser(null);
          setProfile(null);
          setProfileResolved(true);
          setLoading(false);
        }
      }, 8000);

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        console.debug("Auth bootstrap session:", session?.user?.id ?? "none");

        if (session?.user) {
          setUser({ id: session.user.id, email: session.user.email });
          const res = await fetchProfile(session.user.id);
          // If fetchProfile returned an error, force sign-out so Login can be shown
          if (res?.error) {
            console.warn(
              "Perfil falhou ao carregar durante bootstrap — deslogando para liberar tela de login",
              res.error,
            );
            try {
              await supabase.auth.signOut();
            } catch (e) {
              console.warn("Falha ao tentar signOut forçado:", e);
            }
            setUser(null);
            setProfile(null);
            setProfileResolved(true);
            return;
          }
        } else {
          // No authenticated user - mark profile resolved so UI can show login
          setProfileResolved(true);
        }
      } catch (error) {
        console.warn("Erro ao inicializar sessão de auth:", error);
        setUser(null);
        setProfile(null);
        setProfileResolved(true);
      } finally {
        clearTimeout(timeout);
        setLoading(false);
      }
    };

    bootstrap();

    // 2. Ouvinte de mudanças de Auth (Login/Logout)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.debug("onAuthStateChange:", _event, session?.user?.id ?? "none");
      const currentUser = session?.user;

      if (currentUser) {
        setUser({ id: currentUser.id, email: currentUser.email });
        await fetchProfile(currentUser.id);
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
      // eslint-disable-next-line no-console
      console.error("Global window error:", ev.error ?? ev.message, ev);
      setLoading(false);
      setProfileResolved(true);
    };

    const onUnhandledRejection = (ev: PromiseRejectionEvent) => {
      // eslint-disable-next-line no-console
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = await svcUpsertProfile(payload as any);
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

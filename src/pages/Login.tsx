import AuthLayout from "@/components/AuthLayout";
import { supabase } from "@/services/supabase";
import { getAuthErrorMessage } from "@/utils/getAuthErrorMessage";
import { Loader2, Plane } from "lucide-react";
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function Login() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [autoLoginFailed, setAutoLoginFailed] = useState(false);
  const [retryingAutoLogin, setRetryingAutoLogin] = useState(false);

  async function retryAutoLogin() {
    if (!formData.email || !formData.password) return;
    setRetryingAutoLogin(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });
      if (error) throw error;
      setAutoLoginFailed(false);
      toast.success("Login automático realizado com sucesso.");
    } catch (err: unknown) {
      toast.error(
        getAuthErrorMessage(
          err,
          "Falha ao tentar login automático. Tente novamente.",
        ),
      );
    } finally {
      setRetryingAutoLogin(false);
    }
  }

  async function signUp(email: string, password: string) {
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      return { error };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err : new Error(String(err)) };
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignUp) {
        if (formData.password !== formData.confirmPassword) {
          toast.error("As senhas não coincidem.");
          setIsLoading(false);
          return;
        }

        const res = await signUp(formData.email, formData.password);
        if (res?.error) throw res.error;

        try {
          const { error: signinErr } = await supabase.auth.signInWithPassword({
            email: formData.email,
            password: formData.password,
          });

          if (signinErr) {
            toast.error(
              "Conta criada, mas falha no login automático. Faça login manualmente ou tente novamente.",
            );
            setIsSignUp(false);
            setAutoLoginFailed(true);
            return;
          }
          toast.success("Conta criada e autenticada. Redirecionando...");
          navigate("/app");
        } catch (e) {
          if (import.meta.env.DEV) console.warn("Auto-login failed:", e);
          toast.error(
            "Conta criada, mas não foi possível efetuar login automático. Tente novamente.",
          );
          setIsSignUp(false);
          setAutoLoginFailed(true);
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });
        if (error) {
          // show friendly message immediately instead of relying on outer catch
          toast.error(getAuthErrorMessage(error, "Erro na autenticação."));
          setIsLoading(false);
          return;
        }
        navigate("/app");
      }
    } catch (err: unknown) {
      if (import.meta.env.DEV) console.error(err);
      toast.error(getAuthErrorMessage(err, "Erro na autenticação."));
    } finally {
      setIsLoading(false);
    }
  };

  // using shared helper from src/utils/getAuthErrorMessage.ts

  return (
    <AuthLayout>
      <>
        <div className="flex items-center gap-3 mb-10">
          <div className="bg-primary text-white p-2 rounded-lg">
            <Plane
              className="w-6 h-6 transform -rotate-45"
              fill="currentColor"
            />
          </div>
          <h1 className="text-2xl font-bold text-primary tracking-tight">
            TACF-Digital
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1">
            <input
              id="email"
              type="email"
              required
              placeholder="E-mail institucional"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full px-5 py-4 bg-gray-100 text-gray-900 placeholder-gray-500 rounded-xl border-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all outline-none font-medium"
            />
          </div>

          <div className="space-y-1">
            <input
              id="password"
              type="password"
              required
              placeholder="Senha"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              className="w-full px-5 py-4 bg-gray-100 text-gray-900 placeholder-gray-500 rounded-xl border-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all outline-none font-medium"
            />
          </div>

          {isSignUp && (
            <div className="space-y-1">
              <input
                id="confirmPassword"
                type="password"
                required
                placeholder="Confirmar Senha"
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({ ...formData, confirmPassword: e.target.value })
                }
                className="w-full px-5 py-4 bg-gray-100 text-gray-900 placeholder-gray-500 rounded-xl border-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all outline-none font-medium"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-[#1B365D] hover:bg-[#152a48] text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transform active:scale-95 transition-all duration-200 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              "ENTRAR"
            )}
          </button>

          <div className="flex justify-end pt-2">
            <Link
              to="/forgot"
              className="text-sm font-medium text-gray-500 hover:text-primary underline decoration-transparent hover:decoration-primary transition-all"
            >
              Esqueceu a senha?
            </Link>
          </div>
        </form>

        <div className="text-center pt-4">
          <p className="text-sm text-slate-600">Ainda não tem acesso?</p>
          <Link
            to="/register"
            className="text-primary font-bold text-sm hover:underline mt-1 inline-block focus:outline-none"
          >
            Cadastre-se aqui
          </Link>

          {autoLoginFailed && (
            <div className="mt-4 p-3 rounded-xl bg-yellow-50 border border-yellow-100 text-sm flex items-center justify-between">
              <div className="text-sm">
                Conta criada, mas falha no login automático.
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={retryAutoLogin}
                  disabled={retryingAutoLogin}
                  className="btn btn-sm bg-primary text-white px-3 py-1 rounded"
                  type="button"
                >
                  {retryingAutoLogin ? "Tentando..." : "Tentar login novamente"}
                </button>
                <Link
                  to="/login"
                  className="btn btn-sm border px-3 py-1 rounded"
                >
                  Entrar manualmente
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="mt-12 text-center">
          <p className="text-xs text-gray-300 font-medium">
            © 2026 HACO — Força Aérea Brasileira
          </p>
        </div>
      </>
    </AuthLayout>
  );
}

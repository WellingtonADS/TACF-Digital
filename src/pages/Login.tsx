/**
 * @page Login
 * @description Tela de autenticação de usuários.
 * @path src/pages/Login.tsx
 */

import AuthLayout from "@/components/layout/AuthLayout";
import { Button } from "@/components/atomic/Button";
import { Input } from "@/components/atomic/Input";
import PasswordInput from "@/components/atomic/PasswordInput";
import { Loader2, Plane } from "@/icons";
import { supabase } from "@/services/supabase";
import { getAuthErrorMessage } from "@/utils/getAuthErrorMessage";
import { type FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function Login() {
  const navigate = useNavigate();
  const [carregando, setCarregando] = useState(false);
  const [modoCadastro, setModoCadastro] = useState(false);
  const [formulario, setFormulario] = useState({
    email: "",
    password: "",
    confirmacaoSenha: "",
  });

  useEffect(() => {
    // Force a post-mount reset to prevent browser-managed autofill from persisting.
    const temporizadorLimpeza = window.setTimeout(() => {
      setFormulario({ email: "", password: "", confirmacaoSenha: "" });
    }, 0);

    return () => window.clearTimeout(temporizadorLimpeza);
  }, []);

  const [falhaLoginAutomatico, setFalhaLoginAutomatico] = useState(false);
  const [tentandoLoginAutomatico, setTentandoLoginAutomatico] =
    useState(false);

  async function tentarLoginAutomatico() {
    if (!formulario.email || !formulario.password) return;
    setTentandoLoginAutomatico(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: formulario.email,
        password: formulario.password,
      });
      if (error) throw error;
      setFalhaLoginAutomatico(false);
      toast.success("Login automático realizado com sucesso.");
    } catch (err: unknown) {
      toast.error(
        getAuthErrorMessage(
          err,
          "Falha ao tentar login automático. Tente novamente.",
        ),
      );
    } finally {
      setTentandoLoginAutomatico(false);
    }
  }

  async function cadastrarComEmail(email: string, password: string) {
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      return { error };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err : new Error(String(err)) };
    }
  }

  const enviarFormulario = async (e: FormEvent) => {
    e.preventDefault();
    setCarregando(true);

    try {
      if (modoCadastro) {
        if (formulario.password !== formulario.confirmacaoSenha) {
          toast.error("As senhas não coincidem.");
          setCarregando(false);
          return;
        }

        const res = await cadastrarComEmail(
          formulario.email,
          formulario.password,
        );
        if (res?.error) throw res.error;

        try {
          const { error: signinErr } = await supabase.auth.signInWithPassword({
            email: formulario.email,
            password: formulario.password,
          });

          if (signinErr) {
            toast.error(
              "Conta criada, mas falha no login automático. Faça login manualmente ou tente novamente.",
            );
            setModoCadastro(false);
            setFalhaLoginAutomatico(true);
            return;
          }
          toast.success("Conta criada e autenticada. Redirecionando...");
          navigate("/app");
        } catch (e) {
          if (import.meta.env.DEV) console.warn("Auto-login failed:", e);
          toast.error(
            "Conta criada, mas não foi possível efetuar login automático. Tente novamente.",
          );
          setModoCadastro(false);
          setFalhaLoginAutomatico(true);
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: formulario.email,
          password: formulario.password,
        });
        if (error) {
          // show friendly message immediately instead of relying on outer catch
          toast.error(getAuthErrorMessage(error, "Erro na autenticação."));
          setCarregando(false);
          return;
        }
        navigate("/app");
      }
    } catch (err: unknown) {
      if (import.meta.env.DEV) console.error(err);
      toast.error(getAuthErrorMessage(err, "Erro na autenticação."));
    } finally {
      setCarregando(false);
    }
  };

  // using shared helper from src/utils/getAuthErrorMessage.ts

  return (
    <AuthLayout>
      <>
        <div className="flex items-center gap-3 mb-10">
          <div className="bg-primary text-primary-foreground p-2 rounded-lg">
            <Plane
              className="w-6 h-6 transform -rotate-45"
              fill="currentColor"
            />
          </div>
          <h1 className="text-2xl font-bold text-text-body tracking-tight">
            TACF-Digital
          </h1>
        </div>

        <form
          onSubmit={enviarFormulario}
          className="space-y-5"
          autoComplete="off"
          data-testid="login-form"
        >
          <div className="space-y-1">
            <Input
              id="email"
              name="tacf-auth-email"
              type="email"
              required
              placeholder="Ex.: joao.silva@fab.mil.br"
              value={formulario.email}
              autoComplete="off"
              data-testid="login-email-input"
              onChange={(v: string) =>
                setFormulario({ ...formulario, email: v })
              }
            />
          </div>

          <div className="space-y-1">
            <PasswordInput
              id="password"
              name="tacf-auth-password"
              required
              placeholder="Digite sua senha"
              value={formulario.password}
              autoComplete="new-password"
              data-testid="login-password-input"
              onChange={(e) =>
                setFormulario({ ...formulario, password: e.target.value })
              }
            />
          </div>

          {modoCadastro && (
            <div className="space-y-1">
              <PasswordInput
                id="confirmPassword"
                name="tacf-auth-confirm-password"
                required
                placeholder="Confirme sua senha"
                value={formulario.confirmacaoSenha}
                autoComplete="new-password"
                onChange={(e) =>
                  setFormulario({
                    ...formulario,
                    confirmacaoSenha: e.target.value,
                  })
                }
              />
            </div>
          )}

          <Button
            type="submit"
            disabled={carregando}
            data-testid="login-submit-button"
            className="w-full py-4 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-2xl shadow-lg hover:shadow-xl transform active:scale-95 transition-all duration-200 flex items-center justify-center gap-2"
          >
            {carregando ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              "ENTRAR"
            )}
          </Button>

          <div className="flex justify-end pt-2">
            <Link
              to="/forgot"
              className="text-sm font-medium text-text-muted hover:text-primary underline decoration-transparent hover:decoration-primary transition-all"
            >
              Esqueceu a senha?
            </Link>
          </div>
        </form>

        <div className="text-center pt-4">
          <p className="text-sm text-text-muted">Ainda não tem acesso?</p>
          <Link
            to="/register"
            className="text-text-body font-bold text-sm hover:text-primary hover:underline mt-1 inline-block focus:outline-none"
          >
            Cadastre-se aqui
          </Link>

          {falhaLoginAutomatico && (
            <div className="mt-4 flex items-center justify-between rounded-xl border border-alert/20 bg-alert/10 p-3 text-sm">
              <div className="text-sm">
                Conta criada, mas falha no login automático.
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={tentarLoginAutomatico}
                  disabled={tentandoLoginAutomatico}
                  className="btn btn-sm bg-primary text-primary-foreground px-3 py-1 rounded"
                  type="button"
                >
                  {tentandoLoginAutomatico
                    ? "Tentando..."
                    : "Tentar login novamente"}
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
          <p className="text-xs text-text-muted font-medium">
            © 2026 HACO — Força Aérea Brasileira
          </p>
        </div>
      </>
    </AuthLayout>
  );
}

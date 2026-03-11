/**
 * @page Register
 * @description Tela de registro de novos usuários.
 * @path src/pages/Register.tsx
 */



import { Input } from "@/components/atomic/Input";
import PasswordInput from "@/components/atomic/PasswordInput";
import AuthLayout from "@/components/AuthLayout";
import { Loader2, Plane } from "@/icons";
import { signIn, signUp } from "@/services/supabase";
import { getAuthErrorMessage } from "@/utils/getAuthErrorMessage";
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Prevent browser-managed autofill from keeping stale credentials on first paint.
    const clearTimer = window.setTimeout(() => {
      setFullName("");
      setEmail("");
      setPassword("");
    }, 0);

    return () => window.clearTimeout(clearTimer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedName = fullName.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedName || !normalizedEmail || !password) {
      toast.error("Preencha todos os campos.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      toast.error("Informe um e-mail válido.");
      return;
    }
    if (password.length < 8) {
      toast.error("A senha deve ter ao menos 8 caracteres.");
      return;
    }

    setLoading(true);
    try {
      const { error: signUpError } = await signUp(normalizedEmail, password, {
        full_name: normalizedName,
      });
      if (signUpError) {
        // show friendly message immediately and stop the flow
        toast.error(getAuthErrorMessage(signUpError, "Erro ao criar conta."));
        setLoading(false);
        return;
      }

      const { error: signInError, data } = await signIn(
        normalizedEmail,
        password,
      );
      if (signInError) {
        toast.success("Conta criada. Verifique seu e-mail para confirmar.");
        navigate("/login");
        return;
      }

      void data;

      toast.success("Conta criada. Complete seu perfil para continuar.");
      navigate("/app/perfil");
    } catch (err: unknown) {
      toast.error(getAuthErrorMessage(err, "Erro ao criar conta."));
    } finally {
      setLoading(false);
    }
  };

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
          <h1 className="text-2xl font-bold text-text-body tracking-tight">
            TACF-Digital
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5" autoComplete="off">
          <p className="text-xs text-text-muted">
            Campos com <span className="font-bold">*</span> são obrigatórios.
          </p>

          <div className="space-y-1">
            <Input
              name="tacf-register-full-name"
              type="text"
              required
              placeholder="Ex.: João da Silva"
              value={fullName}
              autoComplete="off"
              onChange={(v: string) => setFullName(v)}
            />
          </div>

          <div className="space-y-1">
            <Input
              name="tacf-register-email"
              type="email"
              required
              placeholder="Ex.: joao.silva@fab.mil.br"
              value={email}
              autoComplete="off"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              onChange={(v: string) => setEmail(v)}
            />
          </div>

          <div className="space-y-1">
            <PasswordInput
              name="tacf-register-password"
              required
              placeholder="Ex.: senha com mínimo de 8 caracteres"
              value={password}
              autoComplete="new-password"
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-primary hover:bg-primary/90 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transform active:scale-95 transition-all duration-200 flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              "CADASTRAR"
            )}
          </button>
        </form>

        <div className="text-center pt-4">
          <p className="text-sm text-text-muted">Já possui uma conta?</p>
          <Link
            to="/login"
            className="text-text-body font-bold text-sm hover:text-primary hover:underline mt-1 inline-block focus:outline-none"
          >
            Fazer login
          </Link>
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

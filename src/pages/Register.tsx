/**
 * @page Register
 * @description Tela de registro de novos usuários.
 * @path src/pages/Register.tsx
 */

import { Input } from "@/components/atomic/Input";
import PasswordInput from "@/components/atomic/PasswordInput";
import AuthLayout from "@/components/layout/AuthLayout";
import { Loader2, Plane } from "@/icons";
import { signIn, signUp } from "@/services/supabase";
import { getAuthErrorMessage } from "@/utils/getAuthErrorMessage";
import { type FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [nomeCompleto, setNomeCompleto] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [cadastrando, setCadastrando] = useState(false);

  useEffect(() => {
    // Prevent browser-managed autofill from keeping stale credentials on first paint.
    const temporizadorLimpeza = window.setTimeout(() => {
      setNomeCompleto("");
      setEmail("");
      setSenha("");
    }, 0);

    return () => window.clearTimeout(temporizadorLimpeza);
  }, []);

  const cadastrarConta = async (e: FormEvent) => {
    e.preventDefault();
    const nomeNormalizado = nomeCompleto.trim();
    const emailNormalizado = email.trim().toLowerCase();

    if (!nomeNormalizado || !emailNormalizado || !senha) {
      toast.error("Preencha todos os campos.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNormalizado)) {
      toast.error("Informe um e-mail válido.");
      return;
    }
    if (senha.length < 8) {
      toast.error("A senha deve ter ao menos 8 caracteres.");
      return;
    }

    setCadastrando(true);
    try {
      const { error: erroCadastro } = await signUp(emailNormalizado, senha, {
        full_name: nomeNormalizado,
      });
      if (erroCadastro) {
        // show friendly message immediately and stop the flow
        toast.error(getAuthErrorMessage(erroCadastro, "Erro ao criar conta."));
        setCadastrando(false);
        return;
      }

      const { error: erroLogin, data } = await signIn(emailNormalizado, senha);
      if (erroLogin) {
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
      setCadastrando(false);
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

        <form onSubmit={cadastrarConta} className="space-y-5" autoComplete="off">
          <p className="text-xs text-text-muted">
            Campos com <span className="font-bold">*</span> são obrigatórios.
          </p>

          <div className="space-y-1">
            <Input
              name="tacf-register-full-name"
              type="text"
              required
              placeholder="Ex.: João da Silva"
              value={nomeCompleto}
              autoComplete="off"
              onChange={(v: string) => setNomeCompleto(v)}
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
              value={senha}
              autoComplete="new-password"
              onChange={(e) => setSenha(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={cadastrando}
            className="w-full py-4 bg-primary hover:bg-primary/90 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transform active:scale-95 transition-all duration-200 flex items-center justify-center gap-2"
          >
            {cadastrando ? (
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

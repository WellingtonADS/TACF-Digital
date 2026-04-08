/**
 * @page ResetPassword
 * @description Conclusão do fluxo de recuperação de senha.
 *   Detecta o evento PASSWORD_RECOVERY do Supabase e permite definir nova senha.
 * @path src/pages/ResetPassword.tsx
 */

import AuthLayout from "@/components/AuthLayout";
import PasswordInput from "@/components/atomic/PasswordInput";
import { AlertCircle, Plane, ShieldCheck } from "@/icons";
import { supabase } from "@/services/supabase";
import { getAuthErrorMessage } from "@/utils/getAuthErrorMessage";
import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

const authFieldLabelClassName =
  "text-[10px] font-bold text-text-muted uppercase tracking-widest ml-1";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [sessionReady, setSessionReady] = useState(false);
  const [invalidLink, setInvalidLink] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Aguarda o evento PASSWORD_RECOVERY que o Supabase dispara após o usuário
    // clicar no link de recuperação. Se não chegar em 3s, verifica a sessão.
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setSessionReady(true);
      }
    });

    const timer = window.setTimeout(async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        setInvalidLink(true);
      }
    }, 3000);

    return () => {
      listener.subscription.unsubscribe();
      window.clearTimeout(timer);
    };
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (password.length < 8) {
      toast.error("Senha deve ter ao menos 8 caracteres.");
      return;
    }

    if (password !== confirm) {
      toast.error("Senhas não conferem.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Senha redefinida com sucesso. Faça login para continuar.");
      navigate("/login");
    } catch (err: unknown) {
      toast.error(getAuthErrorMessage(err, "Erro ao redefinir senha."));
    } finally {
      setLoading(false);
    }
  };

  if (invalidLink) {
    return (
      <AuthLayout>
        <div className="space-y-8">
          <div className="flex items-center gap-3">
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

          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-bg-card text-error rounded-full flex items-center justify-center mx-auto">
              <AlertCircle size={32} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-text-body tracking-tight">
                Link inválido ou expirado
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-text-muted">
                Este link de recuperação não é mais válido. Solicite um novo
                link.
              </p>
            </div>
          </div>
          <Link
            to="/forgot"
            className="flex w-full items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-2xl py-4 shadow-lg hover:shadow-xl transform active:scale-95 transition-all duration-200"
          >
            Solicitar novo link
          </Link>
          <div className="text-center pt-1">
            <p className="text-sm text-text-muted">Já possui um link válido?</p>
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
        </div>
      </AuthLayout>
    );
  }

  if (!sessionReady) {
    return (
      <AuthLayout>
        <div className="space-y-8">
          <div className="flex items-center gap-3">
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
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-bg-card text-primary rounded-full flex items-center justify-center mx-auto">
              <ShieldCheck size={32} />
            </div>
            <p className="text-text-muted text-sm font-medium">
              Verificando link de recuperação...
            </p>
          </div>
        </div>
      </AuthLayout>
    );
  }

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

        <div className="mb-8">
          <h2 className="text-xl font-bold text-text-body tracking-tight">
            Redefinir senha
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-text-muted">
            Defina uma nova senha para sua conta. Mínimo de 8 caracteres.
          </p>
        </div>

        <form className="space-y-6 text-left" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label
              htmlFor="reset-password"
              className={authFieldLabelClassName}
            >
              Nova senha <span aria-hidden="true">*</span>
            </label>
            <PasswordInput
              id="reset-password"
              required
              placeholder="Mínimo 8 caracteres"
              value={password}
              autoComplete="new-password"
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="reset-password-confirm"
              className={authFieldLabelClassName}
            >
              Confirmar nova senha <span aria-hidden="true">*</span>
            </label>
            <PasswordInput
              id="reset-password-confirm"
              required
              placeholder="Repita a nova senha"
              value={confirm}
              autoComplete="new-password"
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-2xl py-4 shadow-lg hover:shadow-xl transform active:scale-95 transition-all duration-200 disabled:opacity-60"
          >
            {loading ? "Salvando..." : "Redefinir senha"}
          </button>
        </form>

        <div className="text-center pt-4">
          <p className="text-sm text-text-muted">Lembrou sua senha?</p>
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

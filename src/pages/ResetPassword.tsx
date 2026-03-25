/**
 * @page ResetPassword
 * @description Conclusão do fluxo de recuperação de senha.
 *   Detecta o evento PASSWORD_RECOVERY do Supabase e permite definir nova senha.
 * @path src/pages/ResetPassword.tsx
 */

import AuthLayout from "@/components/AuthLayout";
import PasswordInput from "@/components/atomic/PasswordInput";
import { AlertCircle, ArrowLeft, ShieldCheck } from "@/icons";
import { supabase } from "@/services/supabase";
import { getAuthErrorMessage } from "@/utils/getAuthErrorMessage";
import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

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
        <div className="text-center space-y-6">
          <div className="w-16 h-16 bg-bg-card text-error rounded-full flex items-center justify-center mx-auto">
            <AlertCircle size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-text-body tracking-tight mb-2">
              Link inválido ou expirado
            </h2>
            <p className="text-text-muted text-sm font-medium leading-relaxed px-2">
              Este link de recuperação não é mais válido. Solicite um novo link.
            </p>
          </div>
          <Link
            to="/forgot"
            className="flex items-center justify-center gap-2 w-full py-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl font-bold text-sm uppercase tracking-widest shadow-lg shadow-primary/20 transition-all"
          >
            Solicitar novo link
          </Link>
          <Link
            to="/login"
            className="flex items-center justify-center gap-2 w-full text-sm font-bold text-text-muted hover:text-text-body transition-colors group"
          >
            <ArrowLeft
              size={18}
              className="group-hover:-translate-x-1 transition-transform"
            />
            Voltar para o Login
          </Link>
        </div>
      </AuthLayout>
    );
  }

  if (!sessionReady) {
    return (
      <AuthLayout>
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-bg-card text-primary rounded-full flex items-center justify-center mx-auto">
            <ShieldCheck size={32} />
          </div>
          <p className="text-text-muted text-sm font-medium">
            Verificando link de recuperação...
          </p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <>
        <div className="w-16 h-16 bg-bg-card text-primary rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldCheck size={32} />
        </div>

        <div className="mb-8">
          <h2 className="text-3xl font-black text-text-body tracking-tight mb-2">
            Nova Senha
          </h2>
          <p className="text-text-muted text-sm font-medium leading-relaxed px-4">
            Defina uma nova senha para sua conta. Mínimo de 8 caracteres.
          </p>
        </div>

        <form className="space-y-6 text-left" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest ml-1">
              Nova Senha
            </label>
            <PasswordInput
              required
              placeholder="Mínimo 8 caracteres"
              value={password}
              autoComplete="new-password"
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest ml-1">
              Confirmar Senha
            </label>
            <PasswordInput
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
            className="w-full py-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl font-bold text-sm uppercase tracking-widest shadow-lg shadow-primary/20 transition-all disabled:opacity-60"
          >
            {loading ? "Salvando..." : "Redefinir Senha"}
          </button>
        </form>

        <div className="mt-10">
          <Link
            to="/login"
            className="flex items-center justify-center gap-2 w-full text-sm font-bold text-text-muted hover:text-text-body transition-colors group"
          >
            <ArrowLeft
              size={18}
              className="group-hover:-translate-x-1 transition-transform"
            />
            Voltar para o Login
          </Link>
        </div>
      </>
    </AuthLayout>
  );
}

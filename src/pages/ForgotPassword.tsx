/**
 * @page ForgotPassword
 * @description Fluxo de recuperação de senha.
 * @path src/pages/ForgotPassword.tsx
 */

import AuthLayout from "@/components/AuthLayout";
import { Mail, Plane } from "@/icons";
import { supabase } from "@/services/supabase";
import { getAuthErrorMessage } from "@/utils/getAuthErrorMessage";
import type { ChangeEventHandler, ComponentType, FormEvent } from "react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

const authFieldLabelClassName =
  "text-[10px] font-bold text-text-muted uppercase tracking-widest ml-1";

type InputFieldProps = {
  id: string;
  label: string;
  icon: ComponentType<{ size?: number | string }>;
  type?: string;
  placeholder?: string;
  required?: boolean;
  value: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
};

const InputField = ({
  id,
  label,
  icon: Icon,
  type = "text",
  placeholder,
  required = false,
  value,
  onChange,
}: InputFieldProps) => (
  <div className="space-y-2">
    <label
      htmlFor={id}
      className={authFieldLabelClassName}
    >
      {label}
      {required ? <span aria-hidden="true"> *</span> : null}
    </label>
    <div className="relative group">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-muted group-focus-within:text-primary transition-colors">
        <Icon size={18} />
      </div>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        required={required}
        value={value}
        onChange={onChange}
        className="w-full pl-11 pr-4 py-4 bg-bg-card text-text-body placeholder-text-muted rounded-xl border-none focus:ring-2 focus:ring-primary/20 focus:bg-bg-card transition-all outline-none font-medium"
      />
    </div>
  </div>
);

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Informe o e-mail institucional.");
      return;
    }
    setLoading(true);
    try {
      // supabase v2 API: resetPasswordForEmail accepts an email string
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success(
        "E-mail de recuperação enviado. Verifique sua caixa de entrada.",
      );
      navigate("/login");
    } catch (err: unknown) {
      toast.error(
        getAuthErrorMessage(err, "Erro ao solicitar recuperação de senha."),
      );
    } finally {
      setLoading(false);
    }
  };

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
            Recuperar senha
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-text-muted">
            Insira seu e-mail institucional abaixo para receber as instruções de
            recuperação.
          </p>
        </div>

        <form className="space-y-6 text-left" onSubmit={handleSubmit}>
          <InputField
            id="forgot-password-email"
            label="E-mail institucional"
            icon={Mail}
            placeholder="Ex.: joao.silva@fab.mil.br"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-2xl shadow-lg hover:shadow-xl transform active:scale-95 transition-all duration-200"
          >
            {loading ? "Enviando..." : "Enviar Instruções"}
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

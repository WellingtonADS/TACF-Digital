import AuthLayout from "@/components/AuthLayout";
import { AlertCircle, ArrowLeft, KeyRound, Mail } from "@/icons";
import { supabase } from "@/services/supabase";
import { getAuthErrorMessage } from "@/utils/getAuthErrorMessage";
import type { ChangeEventHandler, ComponentType, FormEvent } from "react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

// using shared AuthLayout to match Login page image, typography and theme

type InputFieldProps = {
  label: string;
  icon: ComponentType<{ size?: number | string }>;
  type?: string;
  placeholder?: string;
  required?: boolean;
  value: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
};

const InputField = ({
  label,
  icon: Icon,
  type = "text",
  placeholder,
  required = false,
  value,
  onChange,
}: InputFieldProps) => (
  <div className="space-y-2">
    <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest ml-1">
      {label}
    </label>
    <div className="relative group">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-muted group-focus-within:text-primary transition-colors">
        <Icon size={18} />
      </div>
      <input
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
      const { error } = await supabase.auth.resetPasswordForEmail(email);
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
        <div className="w-16 h-16 bg-bg-card text-primary rounded-full flex items-center justify-center mx-auto mb-6">
          <KeyRound size={32} />
        </div>

        <div className="mb-8">
          <h2 className="text-3xl font-black text-text-body tracking-tight mb-2">
            Recuperar Senha
          </h2>
          <p className="text-text-muted text-sm font-medium leading-relaxed px-4">
            Insira seu e-mail institucional abaixo para receber as instruções de
            recuperação.
          </p>
        </div>

        <form className="space-y-6 text-left" onSubmit={handleSubmit}>
          <InputField
            label="E-mail Institucional"
            icon={Mail}
            placeholder="Ex.: joao.silva@fab.mil.br"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button
            disabled={loading}
            className="w-full py-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl font-bold text-sm uppercase tracking-widest shadow-lg shadow-primary/20 transition-all"
          >
            {loading ? "Enviando..." : "Enviar Instruções"}
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
            />{" "}
            Voltar para o Login
          </Link>
        </div>

        <div className="mt-8 p-5 bg-bg-card rounded-3xl flex items-center gap-4">
          <div className="text-primary">
            <AlertCircle size={24} />
          </div>
          <p className="text-[11px] text-text-muted font-bold uppercase tracking-wider leading-relaxed text-left">
            Problemas com o acesso? Procure a seção de informática da sua OM.
          </p>
        </div>
      </>
    </AuthLayout>
  );
}

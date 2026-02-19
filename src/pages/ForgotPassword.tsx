import AuthLayout from "@/components/AuthLayout";
import { supabase } from "@/services/supabase";
import { getAuthErrorMessage } from "@/utils/getAuthErrorMessage";
import { AlertCircle, ArrowLeft, KeyRound, Mail } from "lucide-react";
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

// using shared AuthLayout to match Login page image, typography and theme

const InputField = ({
  label,
  icon: Icon,
  type = "text",
  placeholder,
  value,
  onChange,
}: any) => (
  <div className="space-y-2">
    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">
      {label}
    </label>
    <div className="relative group">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#1B365D] transition-colors">
        <Icon size={18} />
      </div>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full pl-11 pr-4 py-4 bg-gray-100 text-gray-900 placeholder-gray-500 rounded-xl border-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all outline-none font-medium"
      />
    </div>
  </div>
);

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
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
        <div className="w-16 h-16 bg-blue-50 text-[#1B365D] rounded-full flex items-center justify-center mx-auto mb-6">
          <KeyRound size={32} />
        </div>

        <div className="mb-8">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
            Recuperar Senha
          </h2>
          <p className="text-slate-500 text-sm font-medium leading-relaxed px-4">
            Insira seu e-mail institucional abaixo para receber as instruções de
            recuperação.
          </p>
        </div>

        <form className="space-y-6 text-left" onSubmit={handleSubmit}>
          <InputField
            label="E-mail Institucional"
            icon={Mail}
            placeholder="usuario@fab.mil.br"
            value={email}
            onChange={(e: any) => setEmail(e.target.value)}
          />
          <button
            disabled={loading}
            className="w-full py-4 bg-[#1B365D] hover:bg-[#152a48] text-white rounded-2xl font-bold text-sm uppercase tracking-widest shadow-lg shadow-blue-900/20 transition-all"
          >
            {loading ? "Enviando..." : "Enviar Instruções"}
          </button>
        </form>

        <div className="mt-10">
          <Link
            to="/login"
            className="flex items-center justify-center gap-2 w-full text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors group"
          >
            <ArrowLeft
              size={18}
              className="group-hover:-translate-x-1 transition-transform"
            />{" "}
            Voltar para o Login
          </Link>
        </div>

        <div className="mt-8 p-5 bg-[#E9EEF5] rounded-3xl flex items-center gap-4">
          <div className="text-[#1B365D]">
            <AlertCircle size={24} />
          </div>
          <p className="text-[11px] text-[#1B365D]/70 font-bold uppercase tracking-wider leading-relaxed text-left">
            Problemas com o acesso? Procure a seção de informática da sua OM.
          </p>
        </div>
      </>
    </AuthLayout>
  );
}

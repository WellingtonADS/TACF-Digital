import AuthLayout from "@/components/AuthLayout";
import { signIn, signUp, upsertProfile } from "@/services/supabase";
import { getAuthErrorMessage } from "@/utils/getAuthErrorMessage";
import { Loader2, Plane } from "lucide-react";
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [saram, setSaram] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !saram || !email || !password) {
      toast.error("Preencha todos os campos.");
      return;
    }
    if (password.length < 8) {
      toast.error("A senha deve ter ao menos 8 caracteres.");
      return;
    }

    setLoading(true);
    try {
      const { error: signUpError } = await signUp(email, password);
      if (signUpError) {
        // show friendly message immediately and stop the flow
        toast.error(getAuthErrorMessage(signUpError, "Erro ao criar conta."));
        setLoading(false);
        return;
      }

      const { error: signInError, data } = (await signIn(
        email,
        password,
      )) as any;
      if (signInError) {
        toast.success("Conta criada. Verifique seu e-mail para confirmar.");
        navigate("/login");
        return;
      }

      const userId = data?.user?.id;
      if (userId) {
        await upsertProfile({
          id: userId,
          full_name: fullName,
          saram,
          email,
          active: true,
        });
      }

      toast.success("Conta criada e autenticada.");
      navigate("/app");
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
          <h1 className="text-2xl font-bold text-primary tracking-tight">
            TACF-Digital
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1">
            <input
              type="text"
              required
              placeholder="Nome Completo"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-5 py-4 bg-gray-100 text-gray-900 placeholder-gray-500 rounded-xl border-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all outline-none font-medium"
            />
          </div>

          <div className="space-y-1">
            <input
              type="text"
              required
              placeholder="SARAM (7 dígitos)"
              value={saram}
              onChange={(e) => setSaram(e.target.value)}
              className="w-full px-5 py-4 bg-gray-100 text-gray-900 placeholder-gray-500 rounded-xl border-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all outline-none font-medium"
            />
          </div>

          <div className="space-y-1">
            <input
              type="email"
              required
              placeholder="E-mail institucional"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-5 py-4 bg-gray-100 text-gray-900 placeholder-gray-500 rounded-xl border-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all outline-none font-medium"
            />
          </div>

          <div className="space-y-1">
            <input
              type="password"
              required
              placeholder="Senha (mínimo 8 caracteres)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-5 py-4 bg-gray-100 text-gray-900 placeholder-gray-500 rounded-xl border-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all outline-none font-medium"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-[#1B365D] hover:bg-[#152a48] text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transform active:scale-95 transition-all duration-200 flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              "CADASTRAR"
            )}
          </button>
        </form>

        <div className="text-center pt-4">
          <p className="text-sm text-slate-600">Já possui uma conta?</p>
          <Link
            to="/login"
            className="text-primary font-bold text-sm hover:underline mt-1 inline-block focus:outline-none"
          >
            Fazer login
          </Link>
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

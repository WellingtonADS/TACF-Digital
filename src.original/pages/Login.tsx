import { Loader2, Plane } from "@/components/ui/icons"; // Ícones visuais
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/services/supabase"; // Corrigida a importação do supabase
import React, { useState } from "react";
import { toast } from "sonner"; // Corrigida a importação para usar sonner

export default function Login() {
  // 1. Lógica de Backend (Preservada)
  const [isLoading, setIsLoading] = useState(false);

  // Adicione este estado para alternar entre Login e Cadastro
  const [isSignUp, setIsSignUp] = useState(false);

  // Estado unificado do formulário para login e cadastro
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });

  // Estado para indicar falha no auto-login (após signup)
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
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg || "Falha ao tentar login automático. Tente novamente.");
    } finally {
      setRetryingAutoLogin(false);
    }
  }

  // Use auth context at component level
  const { signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignUp) {
        // --- LÓGICA NOVA DE CADASTRO ---
        if (formData.password !== formData.confirmPassword) {
          toast.error("As senhas não coincidem.");
          setIsLoading(false);
          return;
        }

        const res = await signUp(formData.email, formData.password);
        if (res?.error) throw res.error;

        // Tentar login automático como conveniência
        try {
          const { error: signinErr } = await supabase.auth.signInWithPassword({
            email: formData.email,
            password: formData.password,
          });

          if (signinErr) {
            // Não remover a conta; apenas informar ao usuário e manter o e-mail no formulário
            toast.error(
              "Conta criada, mas falha no login automático. Faça login manualmente ou tente novamente.",
            );
            setIsSignUp(false);
            setAutoLoginFailed(true);
            return;
          }

          // Login automático OK, o AuthContext irá buscar profile e redirecionar
          toast.success("Conta criada e autenticada. Redirecionando...");
        } catch (e) {
          // Falha de rede ou outro problema durante o auto-login
          if (import.meta.env.DEV) console.warn("Auto-login failed:", e);
          toast.error(
            "Conta criada, mas não foi possível efetuar login automático. Tente novamente.",
          );
          setIsSignUp(false);
          setAutoLoginFailed(true);
          return;
        }
      } else {
        // --- SUA LÓGICA DE LOGIN EXISTENTE ---
        // Use o estado unificado `formData` para login
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });
        if (error) throw error;
      }
    } catch (err: unknown) {
      if (import.meta.env.DEV) console.error(err);
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg || "Erro na autenticação.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // SCAFFOLD: Grid Mestre
    <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-12 bg-white font-inter">
      {/* --- LADO ESQUERDO: Imagem Imersiva (8 colunas) --- */}
      <div className="hidden lg:block lg:col-span-8 relative overflow-hidden">
        {/* Camada de Imagem */}
        <div className="absolute inset-0 bg-[url('/baseareacanoas.jpg')] bg-cover bg-center transition-transform duration-1000 hover:scale-105" />
        {/* Camada de Overlay (Filtro Azulado para legibilidade e marca) */}
        <div className="absolute inset-0 bg-primary/40 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent" />
      </div>

      {/* --- LADO DIREITO: Formulário Clean (4 colunas) --- */}
      <div className="col-span-1 lg:col-span-4 flex flex-col justify-center items-center p-6 sm:p-12 relative">
        {/* Conteúdo Centralizado */}
        <div className="w-full max-w-sm space-y-8">
          {/* 1. Header com Logo */}
          <div className="flex items-center gap-3 mb-10">
            <div className="bg-primary text-white p-2 rounded-lg">
              {/* Ícone de Jato virado para cima/direita */}
              <Plane
                className="w-6 h-6 transform -rotate-45"
                fill="currentColor"
              />
            </div>
            <h1 className="text-2xl font-bold text-primary tracking-tight">
              TACF-Digital
            </h1>
          </div>

          {/* 2. Feedback de Erro (se houver) */}
          {/* 3. Formulário Estilizado (Igual ao Layout.png) */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Input E-mail */}
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

            {/* Input Senha */}
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

            {/* Só aparece se for cadastro */}
            {isSignUp && (
              <div className="space-y-1">
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  placeholder="Confirmar Senha"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      confirmPassword: e.target.value,
                    })
                  }
                  className="w-full px-5 py-4 bg-gray-100 text-gray-900 placeholder-gray-500 rounded-xl border-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all outline-none font-medium"
                />
              </div>
            )}

            {/* Botão Principal */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-secondary hover:bg-secondary/90 text-white font-bold rounded-full shadow-lg hover:shadow-xl transform active:scale-95 transition-all duration-200 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "ENTRAR"
              )}
            </button>

            {/* Link Esqueceu a Senha */}
            <div className="flex justify-end pt-2">
              <a
                href="#"
                className="text-sm font-medium text-gray-500 hover:text-primary underline decoration-transparent hover:decoration-primary transition-all"
              >
                Esqueceu a senha?
              </a>
            </div>
          </form>

          {/* Botão de Alternância entre Login e Cadastro */}
          <div className="text-center pt-4">
            <p className="text-sm text-slate-600">
              {isSignUp ? "Já possui cadastro?" : "Ainda não tem acesso?"}
            </p>
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-primary font-bold text-sm hover:underline mt-1 focus:outline-none"
            >
              {isSignUp ? "Fazer Login" : "Cadastre-se aqui"}
            </button>

            {/* Auto-login failed banner with retry action */}
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
                    {retryingAutoLogin
                      ? "Tentando..."
                      : "Tentar login novamente"}
                  </button>
                  <button
                    onClick={() => setIsSignUp(false)}
                    className="btn btn-sm border px-3 py-1 rounded"
                    type="button"
                  >
                    Entrar manualmente
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Discreto */}
        <div className="absolute bottom-6 text-center">
          <p className="text-xs text-gray-300 font-medium">
            © 2026 HACO — Força Aérea Brasileira
          </p>
        </div>
      </div>
    </div>
  );
}

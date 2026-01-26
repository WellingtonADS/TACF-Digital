import { useAuth } from "@/contexts/AuthContext"; // Mantendo a importação original
import { Loader2, Plane } from "lucide-react"; // Ícones visuais
import React, { useState } from "react";

const Login: React.FC = () => {
  // 1. Lógica de Backend (Preservada)
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await signIn(email, password);
      // O redirecionamento é feito automaticamente pelo AuthContext/Router
    } catch (err) {
      console.error(err);
      setError("Falha na autenticação. Verifique suas credenciais.");
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
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 hover:scale-105"
          style={{
            // Usando uma imagem de alta qualidade de "corridas/militar" similar ao mockup
            backgroundImage:
              "url('https://images.unsplash.com/photo-1543992437-0808e9a2656a?q=80&w=2574&auto=format&fit=crop')",
          }}
        />
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
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg animate-pulse">
              {error}
            </div>
          )}

          {/* 3. Formulário Estilizado (Igual ao Layout.png) */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Input E-mail */}
            <div className="space-y-1">
              <input
                id="email"
                type="email"
                required
                placeholder="E-mail institucional"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-5 py-4 bg-gray-100 text-gray-900 placeholder-gray-500 rounded-xl border-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all outline-none font-medium"
              />
            </div>

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
};

export default Login;

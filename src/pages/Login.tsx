import { useAuth } from "@/contexts/AuthContext";
import { Lock, LogIn, Mail, UserPlus } from "lucide-react";
import React, { useState } from "react";

const Login: React.FC = () => {
  const { signIn, signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading] = useState(false);

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-slate-100">
      <div className="hidden md:flex md:w-1/2 bg-[#1B365D] flex-col items-center justify-center p-12 text-white">
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/e/e0/Badge_of_the_Brazilian_Air_Force.svg"
          className="w-32 mb-8 drop-shadow-xl"
          alt="Logo FAB"
        />
        <h1 className="text-4xl font-bold uppercase tracking-widest">
          TACF‑Digital
        </h1>
        <p className="mt-4 text-lg opacity-80 text-center max-w-sm">
          Sistema de Gerenciamento de Condicionamento Físico do HACO
        </p>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 border border-slate-200">
          <header className="text-center mb-10">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/e/e0/Badge_of_the_Brazilian_Air_Force.svg"
              className="w-16 mx-auto mb-4 md:hidden"
              alt="Logo FAB"
            />
            <h2 className="text-2xl font-bold text-slate-800">
              Acesso ao Sistema
            </h2>
            <p className="text-slate-500 text-sm">Bem‑vindo ao SGCF do HACO</p>
          </header>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              signIn(email, password);
            }}
            className="space-y-6"
          >
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 block">
                E-mail Institucional
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nome.sobrenome@fab.mil.br"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#1B365D] outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 block">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#1B365D] outline-none transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-[#1B365D] text-white rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-[#152a4a] active:scale-[0.98] transition-all disabled:opacity-70"
            >
              {loading ? (
                "Entrando..."
              ) : (
                <>
                  <LogIn size={20} /> Acessar Sistema
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-2 text-sm text-slate-500 py-2">
              <span className="h-px w-full bg-slate-200"></span>
              <span>OU</span>
              <span className="h-px w-full bg-slate-200"></span>
            </div>

            <button
              type="button"
              onClick={() => signUp(email, password)}
              className="w-full py-3 border-2 border-slate-200 text-slate-700 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors"
            >
              <UserPlus size={20} /> Criar nova conta
            </button>
          </form>

          <footer className="mt-10 text-center text-xs text-slate-400">
            <p>HACO — Hospital da Força Aérea</p>
            <p>Seção de Preparo Físico • © 2026</p>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default Login;

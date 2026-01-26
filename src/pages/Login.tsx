import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useAuth } from "@/contexts/AuthContext";
import { Lock, LogIn, Mail, UserPlus } from "lucide-react";
import React, { useState } from "react";

const Login: React.FC = () => {
  const { signIn, signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading] = useState(false);
  // debug removed

  return (
    <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-5">
      {/* Left - Split image with heavy overlay (desktop only) */}
      <div className="hidden lg:block relative min-h-screen lg:col-span-3">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1562774051-3e1f8d7e1a8e?auto=format&fit=crop&w=1600&q=80')",
          }}
        />
        <div
          className="absolute inset-0"
          style={{ backgroundColor: "rgba(27,54,93,0.9)" }}
        />

        <div className="relative z-10 h-full w-full flex items-center justify-center px-12">
          <div className="max-w-lg text-white">
            <h1 className="text-4xl lg:text-5xl font-extrabold">
              TACF-Digital
            </h1>
            <p className="mt-4 text-lg opacity-90">
              Sistema de Gerenciamento de Condicionamento Físico do HACO
            </p>
          </div>
        </div>
      </div>

      {/* Right - Form area */}
      <div className="flex items-center justify-center bg-slate-50 min-h-screen p-6 sm:p-10 lg:col-span-2">
        <div className="w-full max-w-md mx-auto font-sans text-slate-900">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
            {/* Minimal header */}
            <div className="flex items-center gap-4 mb-8">
              <div className="h-12 w-12 rounded-lg bg-[#1B365D] flex items-center justify-center text-white font-bold text-lg ring-1 ring-slate-100">
                TD
              </div>
              <div>
                <h1 className="sr-only">Login</h1>
                <h2 className="text-2xl font-extrabold">Welcome back</h2>
                <p className="text-sm text-slate-700">
                  Acesso ao Sistema — SGCF HACO
                </p>
              </div>
            </div>

            {/* Form on white canvas (no card) */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                signIn(email, password);
              }}
              className="space-y-6"
              aria-label="Login form"
              noValidate
            >
              <Input
                label="E-mail institucional"
                id="email"
                type="email"
                placeholder="nome.sobrenome@fab.mil.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={<Mail size={16} />}
                className="text-base"
              />

              <Input
                label="Senha"
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={<Lock size={16} />}
                className="text-base"
              />

              <div className="flex justify-end">
                <a
                  href="#"
                  aria-label="Recuperar senha"
                  className="text-sm text-[#1B365D] hover:underline"
                >
                  Forgot Password?
                </a>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                block
                isLoading={loading}
              >
                <span className="flex items-center gap-2">
                  <LogIn size={16} />
                  Entrar
                </span>
              </Button>

              <div className="flex items-center justify-center gap-2 text-sm text-slate-500 py-2">
                <span className="h-px flex-1 bg-slate-200/40" />
                <span className="px-3">OU</span>
                <span className="h-px flex-1 bg-slate-200/40" />
              </div>

              <Button
                type="button"
                variant="outline"
                block
                onClick={() => signUp(email, password)}
              >
                <span className="flex items-center gap-2">
                  <UserPlus size={16} />
                  Criar conta
                </span>
              </Button>
            </form>

            <div className="mt-6 text-center text-xs text-slate-500">
              <p className="mb-1">Conexão segura • Autenticação disponível</p>
              <p>HACO — Hospital da Força Aérea • © 2026</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

import Button from "@/components/ui/Button";
import Card, { CardContent, CardHeader } from "@/components/ui/Card";
import Input from "@/components/ui/Input";
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
      <div
        className="hidden md:block md:w-3/4 h-[calc(100vh)] bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1526772662000-3f88f10405ff?auto=format&fit=crop&w=1600&q=70')",
        }}
      >
        <div className="h-full w-full bg-[#1B365D]/30 flex items-center justify-center">
          <div className="max-w-lg text-white px-8">
            <h1 className="text-5xl font-extrabold">TACF-Digital</h1>
            <p className="mt-4 text-lg opacity-90">
              Sistema de Gerenciamento de Condicionamento Físico do HACO
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 md:w-1/3 flex items-center justify-center p-6 sm:p-8">
        <Card className="w-full max-w-md mx-auto p-6 border-none">
          <CardHeader className="text-center">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/e/e0/Badge_of_the_Brazilian_Air_Force.svg"
              className="w-16 mx-auto mb-4 md:hidden"
              alt="Logo FAB"
            />
            <h2 className="text-2xl font-bold text-slate-800">
              Acesso ao Sistema
            </h2>
            <p className="text-slate-500 text-sm">Bem-vindo ao SGCF do HACO</p>
          </CardHeader>

          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                signIn(email, password);
              }}
              className="space-y-4"
            >
              <Input
                label="E-mail institucional"
                id="email"
                type="email"
                placeholder="nome.sobrenome@fab.mil.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={<Mail size={16} />}
              />

              <Input
                label="Senha"
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={<Lock size={16} />}
              />

              <Button type="submit" variant="primary" block isLoading={loading}>
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
          </CardContent>

          <footer className="mt-6 text-center text-xs text-slate-400">
            <p>HACO — Hospital da Força Aérea</p>
            <p>Seção de Preparo Físico • © 2026</p>
          </footer>
        </Card>
      </div>
    </div>
  );
};

export default Login;

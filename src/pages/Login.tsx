import Card from "@/components/ui/Card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/services/supabase";
import * as Dialog from "@radix-ui/react-dialog";
import React, { useState } from "react";

const Login: React.FC = () => {
  const { signIn, signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotDone, setForgotDone] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    const res = await signIn(email, password);
    if (res.error) setMsg(res.error.message || "Erro ao entrar");
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    const res = await signUp(email, password);
    if (res.error) setMsg(res.error.message || "Erro ao cadastrar");
    else setMsg("Cadastro iniciado. Complete seu perfil quando solicitado.");
    setLoading(false);
  };

  const handleForgot = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setForgotLoading(true);
    setForgotDone(false);
    try {
      // try multiple possible signatures to be resilient across supabase client versions
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const authAny: any = supabase.auth as any;
      if (typeof authAny.resetPasswordForEmail === "function") {
        try {
          await authAny.resetPasswordForEmail(forgotEmail);
        } catch {
          await authAny.resetPasswordForEmail({ email: forgotEmail });
        }
      } else if (
        typeof authAny.resetPasswordForEmail === "undefined" &&
        typeof authAny.api !== "undefined"
      ) {
        // older clients may provide API helpers — best-effort, ignore errors
        try {
          await authAny.api.resetPasswordForEmail(forgotEmail);
        } catch {
          // noop
        }
      }
      setForgotDone(true);
    } catch {
      setForgotDone(true);
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Card className="p-6 sm:p-8 rounded-xl shadow-md">
          <header className="text-center mb-6">
            <div className="text-3xl font-semibold text-sky-900">
              TACF‑Digital
            </div>
            <div className="text-sm text-slate-500 mt-1">
              HACO — Sistema de Gerenciamento
            </div>
            <p className="text-sm text-slate-600 mt-3">Bem‑vindo ao SGCF</p>
          </header>

          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                E-mail
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@militar"
                className="block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Senha
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <Dialog.Root>
                <Dialog.Trigger asChild>
                  <button
                    type="button"
                    className="text-sky-600 hover:underline"
                  >
                    Esqueci minha senha
                  </button>
                </Dialog.Trigger>

                <Dialog.Portal>
                  <Dialog.Overlay className="fixed inset-0 bg-black/40" />
                  <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg w-[90%] max-w-md p-6">
                    <Dialog.Title className="text-lg font-medium text-slate-900">
                      Recuperar senha
                    </Dialog.Title>
                    <Dialog.Description className="text-sm text-slate-600 mt-1">
                      Informe seu e-mail institucional para receber instruções.
                    </Dialog.Description>

                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleForgot();
                      }}
                      className="mt-4 space-y-3"
                    >
                      <div>
                        <label className="block text-sm text-slate-700 mb-1">
                          E-mail
                        </label>
                        <input
                          type="email"
                          required
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                        />
                      </div>

                      <div className="flex justify-end gap-2">
                        <Dialog.Close asChild>
                          <button
                            type="button"
                            className="px-3 py-2 text-sm rounded-md"
                          >
                            Fechar
                          </button>
                        </Dialog.Close>
                        <button
                          type="submit"
                          disabled={forgotLoading}
                          className="px-4 py-2 bg-sky-600 text-white rounded-md text-sm hover:bg-sky-700 disabled:opacity-60"
                        >
                          {forgotLoading ? "Enviando..." : "Enviar"}
                        </button>
                      </div>

                      {forgotDone && (
                        <p className="text-sm text-green-600">
                          Instruções enviadas se o e-mail existir.
                        </p>
                      )}
                    </form>
                  </Dialog.Content>
                </Dialog.Portal>
              </Dialog.Root>

              <div />
            </div>

            {msg && <div className="text-sm text-red-600">{msg}</div>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-sky-600 text-white rounded-md text-sm font-medium hover:bg-sky-700 disabled:opacity-60"
            >
              {loading ? "Entrando..." : "Acessar sistema"}
            </button>

            <div className="pt-3 text-center text-sm text-slate-600">
              Ainda não tem conta?{" "}
              <button
                type="button"
                onClick={handleSignUp}
                className="text-sky-600 font-medium hover:underline"
              >
                Criar cadastro
              </button>
            </div>
          </form>
        </Card>

        <div className="mt-4 text-xs text-slate-500 text-center">
          <span>HACO — Hospital da Força Aérea</span>
        </div>
      </div>
    </div>
  );
};

export default Login;
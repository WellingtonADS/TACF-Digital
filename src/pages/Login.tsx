import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import { useAuth } from "@/contexts/AuthContext";
import React, { useState } from "react";

const Login: React.FC = () => {
  const { signIn, signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMsg(null);
    const res = await signIn(email, password);
    if (res.error) setError(res.error.message || "Sign in error");
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMsg(null);
    const res = await signUp(email, password);
    if (res.error) setError(res.error.message || "Sign up error");
    else setMsg("Cadastro iniciado. Complete seu perfil quando solicitado.");
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto mt-12">
      <Card>
        <h2 className="text-2xl mb-4">Login / Sign Up</h2>
        <form onSubmit={handleSignIn} className="space-y-3">
          <Input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <div className="text-red-600">{error}</div>}
          {msg && <div className="text-green-600">{msg}</div>}

          <div className="flex gap-2">
            <Button type="submit" isLoading={loading}>
              Sign in
            </Button>
            <Button
              variant="outline"
              type="button"
              onClick={handleSignUp}
              disabled={loading}
            >
              Sign up
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default Login;
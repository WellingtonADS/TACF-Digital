import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import { useAuth } from "@/contexts/AuthContext";
import React, { useEffect, useState } from "react";

const ProfileSetup: React.FC = () => {
  const { profile, upsertProfile, user } = useAuth();
  const [saram, setSaram] = useState(profile?.saram ?? "");
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [rank, setRank] = useState(profile?.rank ?? "");
  const [semester, setSemester] = useState(profile?.semester ?? "1");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setSaram(profile?.saram ?? "");
    setFullName(profile?.full_name ?? "");
    setRank(profile?.rank ?? "");
    setSemester(profile?.semester ?? "1");
  }, [profile]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    // Client-side validations
    if (saram && !/^[0-9]{7}$/.test(saram)) {
      setMsg("SARAM deve conter exatamente 7 dígitos");
      return;
    }
    if (fullName && fullName.length < 10) {
      setMsg("Nome deve ter ao menos 10 caracteres");
      return;
    }

    setLoading(true);
    const res = await upsertProfile({
      saram,
      full_name: fullName,
      rank,
      semester,
    });
    setLoading(false);
    if (res.error) setMsg("Error: " + res.error.message);
    else setMsg("Profile salvo");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Card className="p-6 sm:p-8 rounded-xl shadow-md">
          <h2 className="text-2xl mb-4">Complete seu perfil</h2>
          <form onSubmit={handleSave} className="space-y-3">
            <Input
              label="SARAM"
              placeholder="SARAM"
              value={saram}
              inputMode="numeric"
              onChange={(e) => setSaram(e.target.value.replace(/\D/g, ""))}
            />
            <Input
              label="Nome completo"
              placeholder="Nome completo"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
            <Input
              label="Posto/Grad"
              placeholder="Posto/Grad"
              value={rank}
              onChange={(e) => setRank(e.target.value)}
            />

            <div>
              <label className="text-sm font-medium text-slate-700">
                Semestre
              </label>
              <select
                className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={semester}
                onChange={(e) => setSemester(e.target.value as "1" | "2")}
              >
                <option value="1">1</option>
                <option value="2">2</option>
              </select>
            </div>

            {msg && <div className="text-green-600">{msg}</div>}

            <div className="flex gap-2">
              <Button type="submit" isLoading={loading} block>
                Salvar
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default ProfileSetup;
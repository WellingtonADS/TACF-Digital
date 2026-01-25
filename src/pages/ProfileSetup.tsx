import Button from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { useAuth } from "@/contexts/AuthContext";
import { getCurrentSemester } from "@/utils/seasonal";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Hash,
  Medal,
  Save,
  User,
} from "lucide-react";
import React, { useEffect, useState } from "react";

const RANKS = [
  "Coronel",
  "Tenente-Coronel",
  "Major",
  "Capitão",
  "Primeiro Tenente",
  "Segundo Tenente",
  "Aspirante",
  "Suboficial",
  "Primeiro Sargento",
  "Segundo Sargento",
  "Terceiro Sargento",
  "Cabo",
  "Soldado",
];

const ProfileSetup: React.FC = () => {
  const { profile, upsertProfile, user } = useAuth();

  // Estados do Formulário
  const [saram, setSaram] = useState("");
  const [fullName, setFullName] = useState("");
  const [rank, setRank] = useState("");
  // O semestre agora é detectado automaticamente pela data do sistema
  const [semester, setSemester] = useState<"1" | "2">(getCurrentSemester());

  // Estados de UI
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<{
    type: "error" | "success";
    msg: string;
  } | null>(null);

  // Sincroniza dados se o perfil já existir parcialmente
  useEffect(() => {
    if (profile) {
      setSaram(profile.saram ?? "");
      setFullName(profile.full_name ?? "");
      setRank(profile.rank ?? "");
      setSemester(profile.semester ?? getCurrentSemester());
    }
  }, [profile]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!/^[0-9]{7}$/.test(saram))
      newErrors.saram = "O SARAM deve ter exatamente 7 dígitos.";
    if (fullName.trim().length < 10)
      newErrors.fullName = "Nome muito curto ou incompleto.";
    if (!rank) newErrors.rank = "Obrigatório.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !validate()) return;

    setLoading(true);
    setStatus(null);

    const { error } = await upsertProfile({
      saram,
      full_name: fullName.toUpperCase(),
      rank,
      semester,
    });

    setLoading(false);

    if (error) {
      setStatus({
        type: "error",
        msg: error.message || "Falha ao salvar perfil.",
      });
    } else {
      setStatus({
        type: "success",
        msg: "Perfil configurado! A carregar o sistema...",
      });
      // O AuthContext atualizará o estado e o App.tsx fará o redirecionamento automático
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-4 sm:p-6 lg:p-8 animate-in fade-in duration-500">
      <div className="w-full max-w-2xl">
        <Card>
          {/* Header com Branding HACO */}
          <CardHeader className="bg-primary text-white relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2 text-blue-200/80">
                <Medal size={20} />
                <span className="text-xs font-bold uppercase tracking-[0.2em]">
                  SGCF • HACO
                </span>
              </div>
              <h2 className="text-3xl font-bold tracking-tight">
                Completar Perfil
              </h2>
              <p className="text-blue-100/70 text-sm mt-1">
                Olá, militar! Informe seus dados oficiais para acessar o
                calendário do TACF.
              </p>
            </div>
            {/* Ícone de fundo decorativo */}
            <User className="absolute right-[-20px] bottom-[-20px] w-48 h-48 text-white/5 -rotate-12" />
          </CardHeader>

          <CardContent className="space-y-8 pt-10">
            <form
              id="onboarding-form"
              onSubmit={handleSave}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                {/* Nome Completo */}
                <div className="md:col-span-2">
                  <Input
                    label="Nome Completo (Conforme Identidade)"
                    id="fullname"
                    placeholder="DIGITE SEU NOME COMPLETO"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    icon={<User size={18} />}
                    error={errors.fullName}
                    required
                  />
                </div>

                {/* SARAM */}
                <Input
                  label="SARAM"
                  id="saram"
                  placeholder="0000000"
                  value={saram}
                  inputMode="numeric"
                  maxLength={7}
                  onChange={(e) => setSaram(e.target.value.replace(/\D/g, ""))}
                  icon={<Hash size={18} />}
                  error={errors.saram}
                  required
                />

                {/* Posto/Graduação */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-primary uppercase tracking-wider ml-1">
                    Posto / Graduação
                  </label>
                  <Select value={rank} onValueChange={setRank}>
                    <SelectTrigger
                      className={
                        errors.rank ? "border-error ring-error/20" : ""
                      }
                    >
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {RANKS.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.rank && (
                    <span className="text-[10px] font-bold text-error uppercase ml-1">
                      {errors.rank}
                    </span>
                  )}
                </div>

                {/* Semestre */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-primary uppercase tracking-wider ml-1">
                    Período de Avaliação
                  </label>
                  <Select
                    value={semester}
                    onValueChange={(val) => setSemester(val as "1" | "2")}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1º Semestre (FEV-MAI)</SelectItem>
                      <SelectItem value="2">2º Semestre (SET-NOV)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Status Alert */}
              {status && (
                <div
                  className={`p-4 rounded-xl flex items-center gap-3 text-sm animate-in zoom-in-95 ${
                    status.type === "error"
                      ? "bg-error/10 text-error border border-error/20"
                      : "bg-success/10 text-success border border-success/20"
                  }`}
                >
                  {status.type === "error" ? (
                    <AlertCircle size={20} />
                  ) : (
                    <CheckCircle2 size={20} />
                  )}
                  <span className="font-medium">{status.msg}</span>
                </div>
              )}
            </form>
          </CardContent>

          <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2 text-slate-400">
              <Calendar size={16} />
              <span className="text-[10px] font-medium uppercase tracking-widest">
                Sazonalidade Ativa: 2026
              </span>
            </div>

            <Button
              type="submit"
              form="onboarding-form"
              isLoading={loading}
              className="w-full sm:w-auto min-w-[200px]"
              size="lg"
            >
              Confirmar Dados <Save size={20} />
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default ProfileSetup;

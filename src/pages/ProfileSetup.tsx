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
  Calendar,
  CheckCircle2,
  Hash,
  Medal,
  Save,
  ShieldAlert,
  User,
} from "lucide-react";
import React, { useState } from "react";

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
  const [saram, setSaram] = useState(() => profile?.saram ?? "");
  const [fullName, setFullName] = useState(() => profile?.full_name ?? "");
  const [rank, setRank] = useState(() => profile?.rank ?? "");
  const [semester, setSemester] = useState<"1" | "2">(
    () => profile?.semester ?? getCurrentSemester(),
  );

  // Estados de UI
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<{
    type: "error" | "success";
    msg: string;
  } | null>(null);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!saram) newErrors.saram = "SARAM é obrigatório.";
    else if (!/^[0-9]{7}$/.test(saram))
      newErrors.saram = "Deve conter exatamente 7 dígitos numéricos.";

    if (!fullName) newErrors.fullName = "Nome completo é obrigatório.";
    else if (fullName.trim().length < 8)
      newErrors.fullName = "Nome muito curto. Use o nome completo.";

    if (!rank) newErrors.rank = "Selecione seu Posto/Graduação.";

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
        msg: error.message || "Falha ao salvar perfil. Tente novamente.",
      });
    } else {
      setStatus({
        type: "success",
        msg: "Perfil atualizado! Redirecionando...",
      });
      // AuthContext fará o redirecionamento automático ao detectar profile completo
    }
  };

  return (
    // SCAFFOLD: Fundo cinza suave, centralizado
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-500">
      <div className="w-full max-w-xl">
        <Card shadow="lg" className="border-0 ring-1 ring-slate-200">
          {/* HEADER: Identidade Visual Institucional */}
          <CardHeader className="bg-[#1B365D] text-white relative overflow-hidden rounded-t-2xl pb-10">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3 text-blue-200/80">
                <Medal size={18} />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em]">
                  SGCF • HACO
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Identificação Militar
              </h2>
              <p className="text-blue-100/80 text-sm mt-2 max-w-md">
                Para acessar o calendário de testes físicos, precisamos
                confirmar seus dados oficiais.
              </p>
            </div>
            {/* Elemento Decorativo de Fundo */}
            <User className="absolute right-[-24px] bottom-[-40px] w-40 h-40 text-white/5 -rotate-12 pointer-events-none" />
          </CardHeader>

          <CardContent className="space-y-6 pt-8">
            <form
              id="onboarding-form"
              onSubmit={handleSave}
              className="space-y-5"
            >
              {/* STATUS FEEDBACK (Sucesso ou Erro Geral) */}
              {status && (
                <div
                  className={`p-4 rounded-xl flex items-start gap-3 text-sm animate-in zoom-in-95 ${
                    status.type === "error"
                      ? "bg-red-50 text-red-700 border border-red-100"
                      : "bg-green-50 text-green-700 border border-green-100"
                  }`}
                >
                  {status.type === "error" ? (
                    <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                  )}
                  <span className="font-medium">{status.msg}</span>
                </div>
              )}

              {/* GRID DE CAMPOS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Nome Completo (Ocupa 2 colunas) */}
                <div className="md:col-span-2">
                  <Input
                    label="Nome Completo (Conforme Identidade)"
                    id="fullname"
                    placeholder="EX: FULANO DA SILVA"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    icon={<User size={18} />}
                    error={errors.fullName}
                  />
                </div>

                {/* SARAM */}
                <div>
                  <Input
                    label="SARAM (7 Dígitos)"
                    id="saram"
                    placeholder="0000000"
                    value={saram}
                    inputMode="numeric"
                    maxLength={7}
                    onChange={(e) =>
                      setSaram(e.target.value.replace(/\D/g, ""))
                    }
                    icon={<Hash size={18} />}
                    error={errors.saram}
                  />
                </div>

                {/* Posto/Graduação */}
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 ml-1 block">
                    Posto / Graduação
                  </label>
                  <Select value={rank} onValueChange={setRank}>
                    <SelectTrigger
                      className={
                        errors.rank ? "border-error ring-1 ring-error/20" : ""
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
                    <span className="text-[11px] font-bold text-error uppercase ml-1">
                      {errors.rank}
                    </span>
                  )}
                </div>

                {/* Semestre (Campo Informativo/Travado ou Selecionável) */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-sm font-semibold text-slate-700 ml-1 block">
                    Período de Referência
                  </label>
                  <Select
                    value={semester}
                    onValueChange={(val) => setSemester(val as "1" | "2")}
                  >
                    <SelectTrigger className="bg-slate-50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">
                        1º Semestre (Fevereiro - Maio)
                      </SelectItem>
                      <SelectItem value="2">
                        2º Semestre (Setembro - Novembro)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] text-slate-400 ml-1 flex items-center gap-1 mt-1">
                    <Calendar size={10} />
                    Sazonalidade detectada automaticamente
                  </p>
                </div>
              </div>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 pb-8 bg-transparent border-t-0">
            <span className="text-xs text-slate-400 font-medium hidden sm:block">
              * Dados obrigatórios para agendamento
            </span>

            <Button
              type="submit"
              form="onboarding-form"
              isLoading={loading}
              variant="primary"
              size="lg"
              className="w-full sm:w-auto shadow-xl shadow-primary/20"
            >
              Confirmar Dados <Save size={18} />
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default ProfileSetup;

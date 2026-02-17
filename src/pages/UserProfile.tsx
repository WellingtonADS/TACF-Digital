import PageHeader from "@/components/ui/PageHeader";
import { useAuth } from "@/contexts/AuthContext";
import { supabase, upsertProfile } from "@/services/supabase";
import { getCurrentSemester } from "@/utils/seasonal";
import {
  CalendarToday,
  CheckCircle,
  HealthAndSafety,
  LockReset,
  MilitaryTech,
  PersonOutline,
  Verified,
} from "@mui/icons-material";
import { useEffect, useState } from "react";
import { toast } from "sonner";

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

export default function UserProfile() {
  const { user, profile } = useAuth();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    saram: "",
    war_name: "",
    sector: "",
    phone_number: "",
    full_name: "",
    rank: "",
    email: "",
    semester: getCurrentSemester(),
  });

  useEffect(() => {
    if (profile && user) {
      setFormData({
        saram: profile.saram || "",
        war_name: profile.war_name || "",
        sector: profile.sector || "",
        phone_number: profile.phone_number || "",
        full_name: profile.full_name || "",
        rank: profile.rank || "",
        email: user.email || "",
        semester: profile.semester || getCurrentSemester(),
      });
    }
  }, [profile, user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      const { error: profileError } = await upsertProfile({
        id: user.id,
        saram: formData.saram,
        war_name: formData.war_name.toUpperCase(),
        sector: formData.sector.toUpperCase(),
        phone_number: formData.phone_number,
        full_name: formData.full_name.toUpperCase(),
        rank: formData.rank,
        semester: formData.semester,
        updated_at: new Date().toISOString(),
      });

      if (profileError) throw profileError;

      if (formData.email !== user.email) {
        const { error: authError } = await supabase.auth.updateUser({
          email: formData.email,
        });

        if (authError) {
          toast.warning(
            "Perfil salvo, mas erro ao atualizar e-mail: " + authError.message,
          );
        } else {
          toast.success(
            "Perfil salvo! Verifique seu novo e-mail para confirmar a troca.",
          );
        }
      } else {
        toast.success("Dados atualizados com sucesso!");
      }
    } catch (err: unknown) {
      if (import.meta.env.DEV) console.error(err);
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg || "Erro ao salvar dados.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        icon={<PersonOutline />}
        title="Gerenciamento de Perfil"
        description="Atualize suas informações pessoais e militares para o TACF."
        actions={
          <div className="text-sm text-slate-400 bg-white dark:bg-slate-800 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700">
            Último acesso:{" "}
            {new Date().toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}{" "}
            às{" "}
            {new Date().toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        }
      />

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Column: Profile Summary */}
        <div className="lg:w-1/3 space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 flex flex-col items-center text-center">
            <div className="relative mb-6">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-primary/10 p-1 bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
                <PersonOutline
                  sx={{ fontSize: 80 }}
                  className="text-slate-400"
                />
              </div>
            </div>

            <h3 className="text-2xl font-bold text-primary dark:text-white uppercase">
              {formData.war_name || "NOME DE GUERRA"}
            </h3>
            <p className="text-slate-500 font-medium">
              {formData.rank || "Posto/Graduação"}
            </p>

            <div className="mt-8 w-full">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                Status de Aptidão
              </p>
              <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 py-4 px-6 rounded-2xl flex items-center justify-center gap-3">
                <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                  Apto para o TACF
                </span>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4 w-full pt-8 border-t border-slate-100 dark:border-slate-700">
              <div className="text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase">
                  SARAM
                </p>
                <p className="font-bold text-slate-700 dark:text-slate-200 text-lg">
                  {formData.saram || "—"}
                </p>
              </div>
              <div className="text-center border-l border-slate-100 dark:border-slate-700">
                <p className="text-[10px] font-bold text-slate-400 uppercase">
                  Setor
                </p>
                <p className="font-bold text-slate-700 dark:text-slate-200 text-lg">
                  {formData.sector || "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Support Card */}
          <div className="bg-primary rounded-3xl p-8 text-white shadow-xl relative overflow-hidden group">
            <div className="relative z-10">
              <h4 className="font-bold text-lg mb-2">Suporte Técnico</h4>
              <p className="text-white/70 text-sm mb-4">
                Dúvidas sobre seus dados militares? Entre em contato com sua OM.
              </p>
              <a
                className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
                href="#"
              >
                <span className="material-icons text-sm">help_outline</span>
                Central de Ajuda
              </a>
            </div>
            <span className="material-icons absolute -right-4 -bottom-4 text-white/10 text-9xl">
              support_agent
            </span>
          </div>
        </div>

        {/* Right Column: Form */}
        <div className="lg:w-2/3">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200/50 dark:border-slate-700 p-8 lg:p-10">
            <form onSubmit={handleSave} className="space-y-10">
              {/* DADOS PESSOAIS */}
              <section>
                <div className="flex items-center gap-3 mb-6 border-b border-slate-100 dark:border-slate-700 pb-4">
                  <PersonOutline className="text-primary dark:text-blue-400" />
                  <h4 className="font-bold text-slate-900 dark:text-white tracking-wider">
                    DADOS PESSOAIS
                  </h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2 space-y-2">
                    <label
                      htmlFor="full_name"
                      className="text-[10px] font-bold text-slate-400 uppercase tracking-widest"
                    >
                      Nome Completo
                    </label>
                    <input
                      id="full_name"
                      className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-slate-700 dark:text-slate-200 focus:ring-primary focus:border-primary transition-all uppercase"
                      type="text"
                      value={formData.full_name}
                      onChange={(e) =>
                        setFormData({ ...formData, full_name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="email"
                      className="text-[10px] font-bold text-slate-400 uppercase tracking-widest"
                    >
                      E-mail Institucional
                    </label>
                    <input
                      id="email"
                      className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-slate-700 dark:text-slate-200 focus:ring-primary focus:border-primary transition-all"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="phone_number"
                      className="text-[10px] font-bold text-slate-400 uppercase tracking-widest"
                    >
                      Telefone / WhatsApp
                    </label>
                    <input
                      id="phone_number"
                      className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-slate-700 dark:text-slate-200 focus:ring-primary focus:border-primary transition-all"
                      type="tel"
                      value={formData.phone_number}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          phone_number: e.target.value.replace(/\D/g, ""),
                        })
                      }
                      required
                    />
                  </div>
                </div>
              </section>

              {/* DADOS MILITARES */}
              <section>
                <div className="flex items-center gap-3 mb-6 border-b border-slate-100 dark:border-slate-700 pb-4">
                  <MilitaryTech className="text-primary dark:text-blue-400" />
                  <h4 className="font-bold text-slate-900 dark:text-white tracking-wider">
                    DADOS MILITARES
                  </h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label
                      htmlFor="saram"
                      className="text-[10px] font-bold text-slate-400 uppercase tracking-widest"
                    >
                      SARAM
                    </label>
                    <input
                      id="saram"
                      className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-slate-700 dark:text-slate-200 focus:ring-primary focus:border-primary transition-all"
                      type="text"
                      value={formData.saram}
                      onChange={(e) =>
                        setFormData({ ...formData, saram: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="rank"
                      className="text-[10px] font-bold text-slate-400 uppercase tracking-widest"
                    >
                      Posto / Graduação
                    </label>
                    <select
                      id="rank"
                      className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-slate-700 dark:text-slate-200 focus:ring-primary focus:border-primary transition-all"
                      value={formData.rank}
                      onChange={(e) =>
                        setFormData({ ...formData, rank: e.target.value })
                      }
                      required
                    >
                      <option value="">Selecione...</option>
                      {RANKS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="sector"
                      className="text-[10px] font-bold text-slate-400 uppercase tracking-widest"
                    >
                      OM de Origem
                    </label>
                    <input
                      id="sector"
                      className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-slate-700 dark:text-slate-200 focus:ring-primary focus:border-primary transition-all uppercase"
                      type="text"
                      value={formData.sector}
                      onChange={(e) =>
                        setFormData({ ...formData, sector: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>
              </section>

              {/* SAÚDE (READ ONLY) */}
              <section>
                <div className="flex items-center gap-3 mb-6 border-b border-slate-100 dark:border-slate-700 pb-4">
                  <HealthAndSafety className="text-primary dark:text-blue-400" />
                  <h4 className="font-bold text-slate-900 dark:text-white tracking-wider">
                    SAÚDE
                  </h4>
                  <span className="ml-auto text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded font-bold uppercase">
                    Apenas Visualização
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 dark:bg-slate-900/30 p-6 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-700">
                      <CalendarToday className="text-slate-400" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Última Inspeção
                      </p>
                      <p className="font-semibold text-slate-700 dark:text-slate-300">
                        12 JAN 2024
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-700">
                      <Verified className="text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Validade da INSPSAU
                      </p>
                      <p className="font-semibold text-slate-700 dark:text-slate-300">
                        12 JAN 2025
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* SEGURANÇA */}
              <section className="pt-6 border-t border-slate-100 dark:border-slate-700">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
                      <LockReset className="text-slate-500 dark:text-slate-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white">
                        Segurança da Conta
                      </h4>
                      <p className="text-xs text-slate-500">
                        Última alteração de senha há 3 meses.
                      </p>
                    </div>
                  </div>
                  <button
                    className="px-6 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-primary dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors uppercase tracking-widest"
                    type="button"
                  >
                    Alterar Senha
                  </button>
                </div>
              </section>

              {/* ACTIONS */}
              <div className="flex flex-col sm:flex-row items-center justify-end gap-4 pt-8">
                <button
                  className="w-full sm:w-auto px-8 py-4 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-sm hover:text-slate-800 dark:hover:text-white transition-colors"
                  type="button"
                >
                  CANCELAR
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white px-10 py-4 rounded-xl font-bold uppercase tracking-widest text-sm shadow-xl shadow-primary/20 flex items-center justify-center gap-3 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></span>
                      SALVANDO...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="text-lg" />
                      SALVAR ALTERAÇÕES
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

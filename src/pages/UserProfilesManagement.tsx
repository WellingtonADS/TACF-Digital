import useAuth from "@/hooks/useAuth";
import { differenceInYears, isAfter, parseISO } from "date-fns";
import {
  Award,
  Calendar,
  CheckCircle,
  Key,
  ShieldCheck,
  User,
} from "lucide-react";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import Breadcrumbs from "../components/Breadcrumbs";
import Layout from "../layout/Layout";
import supabase, { upsertProfile } from "../services/supabase";

const onlyDigits = (value: string) => value.replace(/\D/g, "");

function formatPhone(value: string) {
  const digits = onlyDigits(value).slice(0, 11);

  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

type Profile = {
  id: string;
  full_name?: string | null;
  war_name?: string | null;
  saram?: string | null;
  email?: string | null;
  phone_number?: string | null;
  rank?: string | null;
  sector?: string | null;
  inspsau_valid_until?: string | null;
  inspsau_last_inspection?: string | null;
  birth_date?: string | null;
  physical_group?: string | null;
};

export default function UserProfilesManagement() {
  const { user, profile: authProfile, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    // prefer profile already loaded by useAuth to avoid duplicate fetches
    if (authProfile) {
      setProfile(authProfile as Profile);
      return;
    }
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user?.id, authProfile]);

  async function loadProfile() {
    if (!user?.id) {
      setProfile(null);
      return;
    }

    setLoading(true);
    try {
      const profileSelect =
        "id, saram, full_name, rank, role, created_at, updated_at, phone_number, email, active, war_name, sector, metadata, inspsau_valid_until, inspsau_last_inspection, birth_date, physical_group";

      const result = await supabase
        .from("profiles")
        .select(profileSelect)
        .eq("id", user.id)
        .maybeSingle();

      const data = (result.data as Profile | null) ?? null;
      const error = result.error;

      if (error) {
        console.error(error);
        setProfile({
          id: user.id,
          full_name:
            typeof user.user_metadata?.full_name === "string"
              ? user.user_metadata.full_name
              : null,
          email: user.email ?? null,
        });
      } else {
        setProfile(
          data ?? {
            id: user.id,
            full_name:
              typeof user.user_metadata?.full_name === "string"
                ? user.user_metadata.full_name
                : null,
            email: user.email ?? null,
          },
        );
      }
    } catch (err) {
      console.error(err);
      setProfile(null);
      toast.error("Não foi possível carregar seu perfil.");
    } finally {
      setLoading(false);
    }
  }

  function handleChange<K extends keyof Profile>(key: K, value: Profile[K]) {
    setProfile((p) => (p ? { ...p, [key]: value } : p));
  }

  async function handleSave(e?: FormEvent) {
    if (e) e.preventDefault();
    if (!profile) return;
    if (!user?.id) {
      toast.error("Usuário não autenticado.");
      return;
    }

    // validações obrigatórias para conclusão do cadastro militar
    const nomeGuerra = profile.war_name?.trim() ?? "";
    const saram = onlyDigits(profile.saram ?? "");
    const rank = profile.rank?.trim() ?? "";
    const setor = profile.sector?.trim() ?? "";
    const email = profile.email?.trim().toLowerCase() ?? "";
    const phone = formatPhone(profile.phone_number ?? "");

    if (!profile.full_name || !email) {
      toast.error("Preencha nome e e-mail antes de salvar.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Informe um e-mail válido.");
      return;
    }

    if (saram.length !== 7) {
      toast.error("SARAM deve conter 7 números.");
      return;
    }

    if (!nomeGuerra || !saram || !rank || !setor) {
      toast.error(
        "Para concluir o cadastro, preencha: Nome de Guerra, SARAM, Posto/Graduação e Setor.",
      );
      return;
    }

    setSaving(true);
    try {
      const { data, error } = await upsertProfile({
        id: user.id,
        full_name: profile.full_name?.trim(),
        email,
        rank,
        saram,
        war_name: nomeGuerra,
        phone_number: phone,
        sector: setor,
      });

      if (error) {
        toast.error("Erro ao salvar: " + error.message);
      } else {
        toast.success("Alterações salvas com sucesso.");
        const saved = (Array.isArray(data) ? data[0] : data) as
          | Profile
          | null
          | undefined;
        setProfile(saved ?? profile);
      }
    } catch (err: unknown) {
      console.error(err);
      toast.error("Erro ao salvar o perfil.");
    } finally {
      setSaving(false);
    }
  }

  const lastAccess = user?.last_sign_in_at
    ? new Date(user.last_sign_in_at).toLocaleString("pt-BR")
    : "--";

  // avoid flicker: if we already have a profile to show, render it
  if ((authLoading || loading) && !profile) {
    return (
      <Layout>
        <div className="max-w-6xl mx-auto">Carregando perfil...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <Breadcrumbs items={["Perfil"]} />

        <header className="mb-8 flex justify-between items-end">
          <div>
            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-primary dark:text-white">
              Gerenciamento de Perfil
            </h2>
            <p className="text-slate-500 mt-1">
              Atualize suas informações pessoais e militares para o TACF.
            </p>
          </div>
          <div className="text-sm text-slate-400 bg-white dark:bg-slate-800 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700">
            Último acesso: {lastAccess}
          </div>
        </header>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left column: profile summary */}
          <div className="lg:w-72 flex-shrink-0">
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 md:p-8 flex flex-col items-center text-center">
              {/* Avatar */}
              <div className="w-24 h-24 rounded-full bg-primary/10 border-4 border-primary/20 flex items-center justify-center mb-4">
                <span className="text-xl md:text-3xl font-black text-primary tracking-tight">
                  {(profile?.war_name ?? profile?.full_name ?? "?")
                    .split(" ")
                    .slice(0, 2)
                    .map((n) => n[0])
                    .join("")}
                </span>
              </div>
              <h3 className="text-lg font-black text-primary dark:text-white uppercase tracking-tight">
                {profile?.war_name ?? profile?.full_name ?? "--"}
              </h3>
              <p className="text-sm text-slate-500 font-medium">
                {profile?.rank ?? "--"}
              </p>

              {/* Status chip */}
              <div className="mt-5 w-full">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                  Status de Aptidão
                </p>
                {profile?.inspsau_valid_until ? (
                  isAfter(parseISO(profile.inspsau_valid_until), new Date()) ? (
                    <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 py-3 px-4 rounded-2xl flex items-center justify-center gap-2">
                      <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 text-xs uppercase tracking-wide">
                        Apto para o TACF
                      </span>
                    </div>
                  ) : (
                    <div className="bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 py-3 px-4 rounded-2xl flex items-center justify-center gap-2">
                      <div className="w-2.5 h-2.5 bg-red-500 rounded-full" />
                      <span className="font-bold text-red-600 dark:text-red-400 text-xs uppercase tracking-wide">
                        Inapto
                      </span>
                    </div>
                  )
                ) : (
                  <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 py-3 px-4 rounded-2xl flex items-center justify-center gap-2">
                    <span className="font-bold text-slate-400 text-xs uppercase tracking-wide">
                      Não informado
                    </span>
                  </div>
                )}
              </div>

              {/* Age & group */}
              <div className="mt-6 grid grid-cols-2 gap-4 w-full pt-6 border-t border-slate-100 dark:border-slate-700">
                <div className="text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">
                    Idade
                  </p>
                  <p className="font-bold text-slate-700 dark:text-slate-200 text-lg">
                    {profile?.birth_date
                      ? differenceInYears(
                          new Date(),
                          parseISO(profile.birth_date),
                        )
                      : "--"}
                  </p>
                </div>
                <div className="text-center border-l border-slate-100 dark:border-slate-700">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">
                    Grupo
                  </p>
                  <p className="font-bold text-slate-700 dark:text-slate-200 text-lg">
                    {profile?.physical_group ?? "--"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right column: form */}
          <div className="flex-1">
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200/50 dark:border-slate-700 p-4 md:p-8 lg:p-10">
              <form className="space-y-10" onSubmit={handleSave}>
                <p className="text-xs text-slate-500">
                  Campos com <span className="font-bold">*</span> são
                  obrigatórios para concluir o cadastro.
                </p>

                <section>
                  <div className="flex items-center gap-3 mb-6 border-b border-slate-100 dark:border-slate-700 pb-4">
                    <User className="w-5 h-5 text-primary dark:text-blue-400" />
                    <h4 className="font-bold text-slate-900 dark:text-white tracking-wider">
                      DADOS PESSOAIS
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Nome Completo *
                      </label>
                      <input
                        value={profile?.full_name ?? ""}
                        onChange={(e) =>
                          handleChange("full_name", e.target.value)
                        }
                        className="w-full bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 rounded-lg p-3 text-slate-700 dark:text-slate-200 focus:ring-primary focus:border-primary transition-all"
                        type="text"
                        placeholder="Ex.: João da Silva"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        E-mail Institucional *
                      </label>
                      <input
                        value={profile?.email ?? ""}
                        onChange={(e) => handleChange("email", e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 rounded-lg p-3 text-slate-700 dark:text-slate-200 focus:ring-primary focus:border-primary transition-all"
                        type="email"
                        placeholder="Ex.: joao.silva@fab.mil.br"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Telefone / WhatsApp
                      </label>
                      <input
                        value={profile?.phone_number ?? ""}
                        onChange={(e) =>
                          handleChange(
                            "phone_number",
                            formatPhone(e.target.value),
                          )
                        }
                        className="w-full bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 rounded-lg p-3 text-slate-700 dark:text-slate-200 focus:ring-primary focus:border-primary transition-all"
                        type="tel"
                        inputMode="numeric"
                        placeholder="(00) 00000-0000"
                      />
                    </div>
                  </div>
                </section>

                <section>
                  <div className="flex items-center gap-3 mb-6 border-b border-slate-100 dark:border-slate-700 pb-4">
                    <Award className="w-5 h-5 text-primary dark:text-blue-400" />
                    <h4 className="font-bold text-slate-900 dark:text-white tracking-wider">
                      DADOS MILITARES
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Nome de Guerra *
                      </label>
                      <input
                        value={profile?.war_name ?? ""}
                        onChange={(e) =>
                          handleChange("war_name", e.target.value)
                        }
                        className="w-full bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 rounded-lg p-3 text-slate-700 dark:text-slate-200 focus:ring-primary focus:border-primary transition-all"
                        type="text"
                        placeholder="Ex.: SILVA"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        SARAM *
                      </label>
                      <input
                        value={profile?.saram ?? ""}
                        onChange={(e) =>
                          handleChange(
                            "saram",
                            onlyDigits(e.target.value).slice(0, 7),
                          )
                        }
                        className="w-full bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 rounded-lg p-3 text-slate-700 dark:text-slate-200 focus:ring-primary focus:border-primary transition-all"
                        type="text"
                        placeholder="Ex.: 1234567"
                        inputMode="numeric"
                        maxLength={7}
                        pattern="[0-9]{7}"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Posto/Graduação *
                      </label>
                      <select
                        value={profile?.rank ?? ""}
                        onChange={(e) => handleChange("rank", e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 rounded-lg p-3 text-slate-700 dark:text-slate-200 focus:ring-primary focus:border-primary transition-all"
                        required
                        title="Posto/Graduação"
                        aria-label="Posto/Graduação"
                      >
                        <option value="">Selecione...</option>
                        <option value="Soldado">Soldado</option>
                        <option value="Cabo">Cabo</option>
                        <option value="3º Sargento">3º Sargento</option>
                        <option value="2º Sargento">2º Sargento</option>
                        <option value="1º Sargento">1º Sargento</option>
                        <option value="Subtenente">Subtenente</option>
                        <option value="Aspirante">Aspirante</option>
                        <option value="2º Tenente">2º Tenente</option>
                        <option value="1º Tenente">1º Tenente</option>
                        <option value="Capitão">Capitão</option>
                        <option value="Major">Major</option>
                        <option value="Coronel">Coronel</option>
                        <option value="General">General</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        OM / Setor *
                      </label>
                      <input
                        value={profile?.sector ?? ""}
                        onChange={(e) => handleChange("sector", e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 rounded-lg p-3 text-slate-700 dark:text-slate-200 focus:ring-primary focus:border-primary transition-all"
                        type="text"
                        placeholder="Ex.: 2º/10º GAV"
                        required
                      />
                    </div>
                  </div>
                </section>

                <section>
                  <div className="flex items-center gap-3 mb-6 border-b border-slate-100 dark:border-slate-700 pb-4">
                    <ShieldCheck className="w-5 h-5 text-primary dark:text-blue-400" />
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
                        <Calendar className="w-6 h-6 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          Última Inspeção
                        </p>
                        <p className="font-semibold text-slate-700 dark:text-slate-300">
                          {profile?.inspsau_last_inspection
                            ? new Date(
                                profile.inspsau_last_inspection,
                              ).toLocaleDateString("pt-BR")
                            : "--"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-700">
                        <CheckCircle className="w-6 h-6 text-emerald-500" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          Validade da INSPSAU
                        </p>
                        <p className="font-semibold text-slate-700 dark:text-slate-300">
                          {profile?.inspsau_valid_until
                            ? new Date(
                                profile.inspsau_valid_until,
                              ).toLocaleDateString("pt-BR")
                            : "--"}
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="pt-6 border-t border-slate-100 dark:border-slate-700">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
                        <Key className="w-5 h-5 text-slate-500 dark:text-slate-400" />
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
                      type="button"
                      className="px-6 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-primary dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors uppercase tracking-widest"
                    >
                      Alterar Senha
                    </button>
                  </div>
                </section>

                <div className="flex flex-col sm:flex-row items-center justify-end gap-4 pt-8">
                  <button
                    type="button"
                    onClick={() => loadProfile()}
                    className="w-full sm:w-auto px-8 py-4 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-sm hover:text-slate-800 dark:hover:text-white transition-colors"
                  >
                    CANCELAR
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white px-10 py-4 rounded-xl font-bold uppercase tracking-widest text-sm shadow-xl shadow-primary/20 flex items-center justify-center gap-3 transition-all hover:scale-[1.02]"
                  >
                    <CheckCircle className="w-5 h-5" />
                    {saving ? "SALVANDO..." : "SALVAR ALTERAÇÕES"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <footer className="mt-12 text-center text-slate-400 text-[10px] uppercase tracking-[0.2em] font-medium pb-8">
          TACF-Digital © 2024 - Sistema de Gerenciamento de Teste de Avaliação
          do Condicionamento Físico
        </footer>
      </div>
    </Layout>
  );
}

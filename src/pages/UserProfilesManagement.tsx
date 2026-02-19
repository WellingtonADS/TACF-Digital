import {
  Award,
  Calendar,
  Camera,
  CheckCircle,
  Headphones,
  HelpCircle,
  Key,
  ShieldCheck,
  User,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import supabase, { upsertProfile } from "../services/supabase";

type Profile = {
  id: string;
  full_name?: string | null;
  saram?: string | null;
  email?: string | null;
  phone?: string | null;
  rank?: string | null;
  om?: string | null;
  age?: number | null;
  group?: string | null;
  last_inspection?: string | null;
  inspsau_valid_until?: string | null;
};

export default function UserProfilesManagement() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id ?? null;

      let res: any;
      if (userId) {
        res = await supabase
          .from("profiles")
          .select(
            `id, full_name, saram, email, phone, rank, om, age, "group", last_inspection, inspsau_valid_until`,
          )
          .eq("id", userId)
          .maybeSingle();
      } else {
        // fallback to first profile in DB (preview/dev)
        res = await supabase
          .from("profiles")
          .select(
            `id, full_name, saram, email, phone, rank, om, age, "group", last_inspection, inspsau_valid_until`,
          )
          .limit(1)
          .maybeSingle();
      }

      if (res.error) {
         
        console.error(res.error);
        setProfile(null);
      } else {
        setProfile((res.data as Profile) || null);
      }
    } catch (err) {
       
      console.error(err);
      setProfile(null);
    }

    setLoading(false);
  }

  function handleChange<K extends keyof Profile>(key: K, value: Profile[K]) {
    setProfile((p) => (p ? { ...p, [key]: value } : p));
  }

  async function handleSave(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!profile) return;
    // basic validation
    if (!profile.full_name || !profile.saram || !profile.email) {
      toast.error("Preencha nome, SARAM e e-mail antes de salvar.");
      return;
    }

    setSaving(true);
    try {
      const { data, error } = await upsertProfile({
        id: profile.id,
        full_name: profile.full_name,
        email: profile.email,
        phone: profile.phone,
        rank: profile.rank,
        om: profile.om,
        saram: profile.saram,
      } as any);

      if (error) {
        toast.error("Erro ao salvar: " + error.message);
      } else {
        toast.success("Alterações salvas com sucesso.");
        setProfile((data as Profile) ?? profile);
      }
    } catch (err: any) {
       
      console.error(err);
      toast.error("Erro ao salvar o perfil.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6 min-h-screen bg-background-light dark:bg-background-dark">
        <div className="max-w-6xl mx-auto">Carregando perfil...</div>
      </div>
    );
  }

  return (
    <div className="p-8 min-h-screen bg-background-light dark:bg-background-dark">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-bold text-primary dark:text-white">
              Gerenciamento de Perfil
            </h2>
            <p className="text-slate-500 mt-1">
              Atualize suas informações pessoais e militares para o TACF.
            </p>
          </div>
          <div className="text-sm text-slate-400 bg-white dark:bg-slate-800 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700">
            Último acesso: --
          </div>
        </header>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-1/3 space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 flex flex-col items-center text-center">
              <div className="relative mb-6">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-primary/10 p-1">
                  <img
                    alt="Profile"
                    className="w-full h-full object-cover rounded-full"
                    src="https://via.placeholder.com/320x320.png?text=Avatar"
                  />
                </div>
                <button className="absolute bottom-1 right-1 bg-primary text-white p-2 rounded-full shadow-lg hover:scale-105 transition-transform">
                  <Camera className="w-4 h-4" />
                </button>
              </div>

              <h3 className="text-2xl font-bold text-primary dark:text-white uppercase">
                {profile?.full_name ?? "--"}
              </h3>
              <p className="text-slate-500 font-medium">
                {profile?.rank ?? "--"}
              </p>

              <div className="mt-8 w-full">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                  Status de Aptidão
                </p>
                <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 py-4 px-6 rounded-2xl flex items-center justify-center gap-3">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                    Apto para o TACF
                  </span>
                </div>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-4 w-full pt-8 border-t border-slate-100 dark:border-slate-700">
                <div className="text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">
                    Idade
                  </p>
                  <p className="font-bold text-slate-700 dark:text-slate-200 text-lg">
                    {profile?.age ?? "--"}
                  </p>
                </div>
                <div className="text-center border-l border-slate-100 dark:border-slate-700">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">
                    Grupo
                  </p>
                  <p className="font-bold text-slate-700 dark:text-slate-200 text-lg">
                    {profile?.group ?? "--"}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-primary rounded-3xl p-8 text-white shadow-xl relative overflow-hidden group">
              <div className="relative z-10">
                <h4 className="font-bold text-lg mb-2">Suporte Técnico</h4>
                <p className="text-white/70 text-sm mb-4">
                  Dúvidas sobre seus dados militares? Entre em contato com sua
                  OM.
                </p>
                <a
                  className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
                  href="#"
                >
                  <HelpCircle className="w-4 h-4" />
                  Central de Ajuda
                </a>
              </div>
              <Headphones className="absolute -right-4 -bottom-4 text-white/10 w-36 h-36" />
            </div>
          </div>

          <div className="lg:w-2/3">
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200/50 dark:border-slate-700 p-8 lg:p-10">
              <form className="space-y-10" onSubmit={handleSave}>
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
                        Nome Completo
                      </label>
                      <input
                        value={profile?.full_name ?? ""}
                        onChange={(e) =>
                          handleChange("full_name", e.target.value)
                        }
                        className="w-full bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 rounded-lg p-3 text-slate-700 dark:text-slate-200 focus:ring-primary focus:border-primary transition-all"
                        type="text"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        E-mail Institucional
                      </label>
                      <input
                        value={profile?.email ?? ""}
                        onChange={(e) => handleChange("email", e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 rounded-lg p-3 text-slate-700 dark:text-slate-200 focus:ring-primary focus:border-primary transition-all"
                        type="email"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Telefone / WhatsApp
                      </label>
                      <input
                        value={profile?.phone ?? ""}
                        onChange={(e) => handleChange("phone", e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 rounded-lg p-3 text-slate-700 dark:text-slate-200 focus:ring-primary focus:border-primary transition-all"
                        type="tel"
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
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        SARAM
                      </label>
                      <input
                        value={profile?.saram ?? ""}
                        onChange={(e) => handleChange("saram", e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 rounded-lg p-3 text-slate-700 dark:text-slate-200 focus:ring-primary focus:border-primary transition-all"
                        type="text"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Posto / Graduação
                      </label>
                      <input
                        value={profile?.rank ?? ""}
                        onChange={(e) => handleChange("rank", e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 rounded-lg p-3 text-slate-700 dark:text-slate-200 focus:ring-primary focus:border-primary transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        OM de Origem
                      </label>
                      <input
                        value={profile?.om ?? ""}
                        onChange={(e) => handleChange("om", e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 rounded-lg p-3 text-slate-700 dark:text-slate-200 focus:ring-primary focus:border-primary transition-all"
                        type="text"
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
                          {profile?.last_inspection ?? "--"}
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
                          {profile?.inspsau_valid_until ?? "--"}
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
    </div>
  );
}

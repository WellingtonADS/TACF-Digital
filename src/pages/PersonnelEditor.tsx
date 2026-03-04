import Layout from "@/layout/Layout";
import supabase from "@/services/supabase";
import {
  ArrowLeft,
  Building2,
  Loader2,
  Save,
  UserCheck,
  UserX,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

type Profile = {
  full_name: string | null;
  war_name: string | null;
  rank: string | null;
  sector: string | null;
  active: boolean;
};

export default function PersonnelEditor() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [active, setActive] = useState(true);
  const [sector, setSector] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    supabase
      .from("profiles")
      .select("full_name, war_name, rank, sector, active")
      .eq("id", userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) {
          console.error("[PersonnelEditor] query error:", error);
          setLoadError(error.message ?? "Erro ao carregar dados do militar.");
          setLoading(false);
          return;
        }
        if (!data) {
          setLoadError("Militar nao encontrado.");
          setLoading(false);
          return;
        }
        const p = data as Profile;
        setProfile(p);
        setActive(p.active !== false);
        setSector(p.sector ?? "");
        setLoading(false);
      });
  }, [userId]);

  async function handleSave() {
    if (!userId) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ active, sector: sector.trim() || null })
        .eq("id", userId);
      if (error) throw error;
      toast.success(active ? "Militar ativado." : "Militar inativado.");
      navigate("/app/efetivo");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Erro ao salvar: ${msg}`);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64 text-slate-400">
          <Loader2 size={28} className="animate-spin mr-3" />
          Carregando dados...
        </div>
      </Layout>
    );
  }

  if (loadError || !profile) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <p className="text-red-500 font-semibold">
            {loadError ?? "Militar nao encontrado."}
          </p>
          <button
            type="button"
            onClick={() => navigate("/app/efetivo")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
          >
            <ArrowLeft size={15} /> Voltar
          </button>
        </div>
      </Layout>
    );
  }

  const displayName =
    [profile.rank, profile.war_name ?? profile.full_name]
      .filter(Boolean)
      .join(" ") || "desconhecido";

  return (
    <Layout>
      <header className="flex items-center gap-4 mb-8">
        <button
          type="button"
          onClick={() => navigate("/app/efetivo")}
          className="p-2 rounded-xl text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          aria-label="Voltar"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Editar Status
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">{displayName}</p>
        </div>
      </header>

      <div className="max-w-md bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6 space-y-6">
        <div>
          <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
            <Building2 size={13} className="text-primary" />
            OM / Setor
          </label>
          <input
            type="text"
            value={sector}
            onChange={(e) => setSector(e.target.value)}
            placeholder="Ex: 1º BIS, CMNE, GACC..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">
            Status da Conta
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setActive(true)}
              className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl border-2 text-sm font-bold transition-all ${
                active
                  ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300"
                  : "border-slate-200 dark:border-slate-700 text-slate-400 hover:border-emerald-300"
              }`}
            >
              <UserCheck size={18} />
              Ativo
            </button>
            <button
              type="button"
              onClick={() => setActive(false)}
              className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl border-2 text-sm font-bold transition-all ${
                !active
                  ? "border-red-400 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"
                  : "border-slate-200 dark:border-slate-700 text-slate-400 hover:border-red-300"
              }`}
            >
              <UserX size={18} />
              Inativo
            </button>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate("/app/efetivo")}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-slate-800 transition-colors disabled:opacity-60"
          >
            {saving ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Save size={15} />
            )}
            Salvar
          </button>
        </div>
      </div>
    </Layout>
  );
}

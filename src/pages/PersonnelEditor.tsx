import { Button } from "@/components/atomic/Button";
import { Input } from "@/components/atomic/Input";
import Layout from "@/components/layout/Layout";
import { getProfileById, updateProfile } from "@/hooks/usePersonnel";
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
import type { Profile } from "@/types";
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
    getProfileById(userId)
      .then((p) => {
        if (!p) {
          setLoadError("Militar nao encontrado.");
          setLoading(false);
          return;
        }
        setProfile(p);
        setActive(p.active !== false);
        setSector(p.sector ?? "");
        setLoading(false);
      })
      .catch((err) => {
        console.error("[PersonnelEditor] query error:", err);
        setLoadError(err.message ?? "Erro ao carregar dados do militar.");
        setLoading(false);
      });
  }, [userId]);
  async function handleSave() {
    if (!userId) return;
    setSaving(true);
    try {
      await updateProfile(userId, { active, sector: sector.trim() || null });
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
        {" "}
        <div className="flex items-center justify-center h-64 text-slate-400">
          {" "}
          <Loader2 size={28} className="animate-spin mr-3" /> Carregando
          dados...{" "}
        </div>{" "}
      </Layout>
    );
  }
  if (loadError || !profile) {
    return (
      <Layout>
        {" "}
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          {" "}
          <p className="text-red-500 font-semibold">
            {" "}
            {loadError ?? "Militar nao encontrado."}{" "}
          </p>{" "}
          <Button
            type="button"
            onClick={() => navigate("/app/efetivo")}
            className="flex items-center gap-2 rounded-xl bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-300"
            icon={<ArrowLeft size={15} />}
          >
            {" "}
            Voltar{" "}
          </Button>{" "}
        </div>{" "}
      </Layout>
    );
  }
  const displayName =
    [profile.rank, profile.war_name ?? profile.full_name]
      .filter(Boolean)
      .join(" ") || "desconhecido";
  return (
    <Layout>
      {" "}
      <header className="flex items-center gap-4 mb-8">
        {" "}
        <button
          type="button"
          onClick={() => navigate("/app/efetivo")}
          className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-200"
          aria-label="Voltar"
        >
          {" "}
          <ArrowLeft size={20} />{" "}
        </button>{" "}
        <div>
          {" "}
          <h1 className="text-2xl font-bold text-slate-900">
            Editar Status
          </h1>{" "}
          <p className="text-sm text-slate-500 mt-0.5">{displayName}</p>{" "}
        </div>{" "}
      </header>{" "}
      <div className="max-w-md space-y-6 rounded-2xl border border-slate-100 bg-white p-6">
        {" "}
        <div>
          {" "}
          <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
            {" "}
            <Building2 size={13} className="text-primary" /> OM / Setor{" "}
          </label>{" "}
          <Input
            type="text"
            value={sector}
            onChange={(v) => setSector(v)}
            placeholder="Ex: 1º BIS, CMNE, GACC..."
          />{" "}
        </div>{" "}
        <div>
          {" "}
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">
            {" "}
            Status da Conta{" "}
          </p>{" "}
          <div className="flex gap-3">
            {" "}
            <button
              type="button"
              onClick={() => setActive(true)}
              className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl border-2 text-sm font-bold transition-all ${active ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-200 text-slate-400 hover:border-emerald-300"}`}
            >
              {" "}
              <UserCheck size={18} /> Ativo{" "}
            </button>{" "}
            <button
              type="button"
              onClick={() => setActive(false)}
              className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl border-2 text-sm font-bold transition-all ${!active ? "border-red-400 bg-red-50 text-red-600" : "border-slate-200 text-slate-400 hover:border-red-300"}`}
            >
              {" "}
              <UserX size={18} /> Inativo{" "}
            </button>{" "}
          </div>{" "}
        </div>{" "}
        <div className="flex gap-3">
          {" "}
          <Button
            type="button"
            onClick={() => navigate("/app/efetivo")}
            className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-500 transition-colors hover:bg-slate-100"
          >
            {" "}
            Cancelar{" "}
          </Button>{" "}
          <Button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-slate-800 transition-colors disabled:opacity-60"
          >
            {" "}
            {saving ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Save size={15} />
            )}{" "}
            Salvar{" "}
          </Button>{" "}
        </div>{" "}
      </div>{" "}
    </Layout>
  );
}

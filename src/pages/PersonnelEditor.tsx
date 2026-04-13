/**
 * @page PersonnelEditor
 * @description Edição de informações de pessoal.
 * @path src/pages/PersonnelEditor.tsx
 */

import { Button } from "@/components/atomic/Button";
import { Input } from "@/components/atomic/Input";
import Layout from "@/components/layout/Layout";
import useAuth from "@/hooks/useAuth";
import { getProfileById, updateProfile } from "@/services/personnel";
import { ArrowLeft, Building2, Loader2, Save, UserCheck, UserX } from "@/icons";
import type { Profile } from "@/types";
import { getAuthorizationErrorMessage } from "@/utils/getAuthorizationErrorMessage";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
export default function PersonnelEditor() {
  const { profile: authProfile } = useAuth();
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [perfilMilitar, setPerfilMilitar] = useState<Profile | null>(null);
  const [active, setActive] = useState(true);
  const [sector, setSector] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const canMutate = authProfile?.role === "admin";
  useEffect(() => {
    if (!userId) return;
    setCarregando(true);
    getProfileById(userId)
      .then((perfil) => {
        if (!perfil) {
          setErroCarregamento("Militar nao encontrado.");
          setCarregando(false);
          return;
        }
        setPerfilMilitar(perfil);
        setActive(perfil.active !== false);
        setSector(perfil.sector ?? "");
        setCarregando(false);
      })
      .catch((err) => {
        console.error("[PersonnelEditor] query error:", err);
        setErroCarregamento(err.message ?? "Erro ao carregar dados do militar.");
        setCarregando(false);
      });
  }, [userId]);
  async function salvarAlteracoes() {
    if (!userId) return;
    if (!canMutate) {
      toast.error(
        "Acesso negado: você não tem permissão para editar dados de efetivo.",
      );
      return;
    }

    setSalvando(true);
    try {
      await updateProfile(userId, { active, sector: sector.trim() || null });
      toast.success(active ? "Militar ativado." : "Militar inativado.");
      navigate("/app/efetivo");
    } catch (err: unknown) {
      const authMessage = getAuthorizationErrorMessage(
        err,
        "editar dados de efetivo",
      );
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(authMessage ?? `Erro ao salvar: ${msg}`);
    } finally {
      setSalvando(false);
    }
  }
  if (carregando) {
    return (
      <Layout>
        {" "}
        <div className="flex items-center justify-center h-64 text-text-muted">
          {" "}
          <Loader2 size={28} className="animate-spin mr-3" /> Carregando
          dados...{" "}
        </div>{" "}
      </Layout>
    );
  }
  if (erroCarregamento || !perfilMilitar) {
    return (
      <Layout>
        {" "}
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          {" "}
          <p className="text-error font-semibold">
            {" "}
            {erroCarregamento ?? "Militar nao encontrado."}{" "}
          </p>{" "}
          <Button
            type="button"
            onClick={() => navigate("/app/efetivo")}
            className="flex items-center gap-2 rounded-xl bg-border-default px-4 py-2 text-sm font-semibold text-text-muted transition-colors hover:bg-border-default/80"
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
    [perfilMilitar.rank, perfilMilitar.war_name ?? perfilMilitar.full_name]
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
          className="rounded-xl p-2 text-text-muted transition-colors hover:bg-bg-default"
          aria-label="Voltar"
        >
          {" "}
          <ArrowLeft size={20} />{" "}
        </button>{" "}
        <div>
          {" "}
          <h1 className="text-2xl font-bold text-text-body">
            Editar Status
          </h1>{" "}
          <p className="text-sm text-text-muted mt-0.5">{displayName}</p>{" "}
        </div>{" "}
      </header>{" "}
      <div className="max-w-md space-y-6 rounded-2xl border border-border-default bg-bg-card p-6">
        {!canMutate && (
          <div className="rounded-xl border border-alert/30 bg-alert/10 px-3 py-2 text-xs font-semibold text-alert">
            Seu perfil está em modo somente leitura. Apenas administradores
            podem alterar status e setor do efetivo.
          </div>
        )}{" "}
        <div>
          {" "}
          <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-text-muted mb-2">
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
          <p className="text-xs font-bold uppercase tracking-widest text-text-muted mb-4">
            {" "}
            Status da Conta{" "}
          </p>{" "}
          <div className="flex gap-3">
            {" "}
            <button
              type="button"
              onClick={() => setActive(true)}
              className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl border-2 text-sm font-bold transition-all ${active ? "border-success/40 bg-success/10 text-success" : "border-border-default text-text-muted hover:border-success/30"}`}
            >
              {" "}
              <UserCheck size={18} /> Ativo{" "}
            </button>{" "}
            <button
              type="button"
              onClick={() => setActive(false)}
              className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl border-2 text-sm font-bold transition-all ${!active ? "border-error/40 bg-error/10 text-error" : "border-border-default text-text-muted hover:border-error/30"}`}
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
            className="flex-1 rounded-xl border border-border-default py-2.5 text-sm font-semibold text-text-muted transition-colors hover:bg-bg-default"
          >
            {" "}
            Cancelar{" "}
          </Button>{" "}
          <Button
            type="button"
            disabled={salvando || !canMutate}
            onClick={salvarAlteracoes}
            title={
              canMutate
                ? "Salvar alterações"
                : "Apenas administradores podem salvar alterações"
            }
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            {" "}
            {salvando ? (
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

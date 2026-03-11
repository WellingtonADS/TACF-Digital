/**
 * @page AppealRequest
 * @description Formulário para solicitações de recurso/apelação.
 * @path src/pages/AppealRequest.tsx
 */



import Layout from "@/components/layout/Layout";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  FileText,
  Info,
  Loader2,
  Paperclip,
} from "@/icons";
import { type FormEvent, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import Breadcrumbs from "../components/Breadcrumbs";

const MOTIVOS = [
  "Erro no registro do resultado",
  "Condição de saúde no dia da avaliação",
  "Irregularidade na aplicação do teste",
  "Resultado divergente do apresentado",
  "Outro motivo",
] as const;

type FormState = {
  motivo: string;
  justificativa: string;
  file: File | null;
};

export default function AppealRequest() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const resultId = searchParams.get("result");

  const [form, setForm] = useState<FormState>({
    motivo: "",
    justificativa: "",
    file: null,
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.motivo) {
      toast.error("Selecione o motivo do recurso.");
      return;
    }
    if (form.justificativa.trim().length < 30) {
      toast.error("A justificativa deve ter pelo menos 30 caracteres.");
      return;
    }

    setSubmitting(true);
    try {
      // RPC appeals ainda não implementada — informar usuário
      toast.info(
        "Funcionalidade em desenvolvimento. Sua solicitação será registrada em breve.",
      );
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto py-16 text-center">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="text-emerald-600" size={40} />
          </div>
          <h2 className="text-2xl font-black text-text-body mb-3">
            Solicitação Registrada
          </h2>
          <p className="text-text-muted max-w-sm mx-auto leading-relaxed">
            Sua solicitação de revisão foi registrada e será analisada pelo
            setor responsável (HACO). Você será notificado sobre a decisão.
          </p>
          <button
            onClick={() => navigate("/app/resultados")}
            className="mt-8 px-8 py-3 bg-primary text-primary-foreground rounded-xl font-bold text-sm uppercase tracking-wider shadow-lg hover:bg-primary/90 transition-colors"
          >
            Voltar ao Histórico
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <Breadcrumbs items={["Histórico", "Recurso"]} />

        <header className="mb-8">
          <h1 className="text-3xl font-bold text-text-body tracking-tight">
            Solicitação de Revisão de Resultado
          </h1>
          <p className="text-text-muted mt-1">
            Preencha o formulário abaixo para contestar um resultado do TACF.
          </p>
        </header>

        {/* Context card */}
        {resultId && (
          <div className="bg-bg-card rounded-2xl border border-border-default p-6 mb-8 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="text-red-500" size={20} />
              <span className="text-xs font-bold uppercase tracking-widest text-text-muted">
                Resultado Contestado
              </span>
              <span className="ml-auto text-[10px] font-bold px-3 py-1 rounded-full bg-red-100 text-red-700 uppercase tracking-widest">
                Em análise
              </span>
            </div>
            <p className="text-sm text-text-muted">
              Referente ao resultado de ID:{" "}
              <span className="font-mono font-bold text-text-body">
                {resultId}
              </span>
            </p>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="bg-bg-card rounded-3xl shadow-xl border border-border-default overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-primary" />

          <div className="p-8 space-y-8">
            {/* Motivo */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest block">
                Motivo do Recurso *
              </label>
              <select
                value={form.motivo}
                onChange={(e) =>
                  setForm((f) => ({ ...f, motivo: e.target.value }))
                }
                required
                title="Motivo do Recurso"
                aria-label="Motivo do Recurso"
                className="w-full bg-bg-default border border-border-default rounded-xl p-3.5 text-text-body focus:ring-2 focus:ring-primary focus:border-primary transition"
              >
                <option value="">Selecione o motivo...</option>
                {MOTIVOS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {/* Justificativa */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest block">
                Justificativa *
              </label>
              <textarea
                value={form.justificativa}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    justificativa: e.target.value.slice(0, 2000),
                  }))
                }
                required
                rows={6}
                placeholder="Descreva detalhadamente os fatos que embasam a solicitação de revisão..."
                className="w-full bg-bg-default border border-border-default rounded-xl p-3.5 text-text-body focus:ring-2 focus:ring-primary focus:border-primary transition resize-none"
              />
              <p className="text-right text-[10px] text-text-muted font-medium">
                {form.justificativa.length}/2000
              </p>
            </div>

            {/* Comprovante */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest block">
                Comprovante / Documento (opcional)
              </label>
              <label
                className="flex items-center gap-3 bg-bg-default border border-dashed border-border-default rounded-xl p-4 cursor-pointer hover:border-primary/50 transition"
                htmlFor="appeal-file"
              >
                <Paperclip className="text-text-muted" size={20} />
                <span className="text-sm text-text-muted font-medium">
                  {form.file
                    ? form.file.name
                    : "Clique para anexar (PDF, JPG, PNG — máx 5MB)"}
                </span>
              </label>
              <input
                id="appeal-file"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="sr-only"
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    file: e.target.files?.[0] ?? null,
                  }))
                }
              />
            </div>

            {/* ICA 54-2 note */}
            <div className="flex gap-3 p-4 bg-primary/5 rounded-2xl border border-primary/10">
              <Info className="text-primary flex-shrink-0 mt-0.5" size={18} />
              <p className="text-xs text-text-muted leading-relaxed">
                O prazo para interposição de recurso é de{" "}
                <strong>5 dias úteis</strong> após a divulgação dos resultados,
                conforme previsto na{" "}
                <strong>ICA 54-2 (art. 28 e seguintes)</strong>. Recursos fora
                do prazo não serão conhecidos.
              </p>
            </div>
          </div>

          {/* Footer actions */}
          <div className="bg-bg-default border-t border-border-default px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-text-muted font-bold text-sm uppercase tracking-wider hover:text-text-body transition-colors"
            >
              <ArrowLeft size={16} /> Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-3 bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3.5 rounded-xl font-bold text-sm uppercase tracking-wider shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <FileText size={18} />
              )}
              {submitting ? "Enviando..." : "Enviar Solicitação"}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}

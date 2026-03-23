/**
 * @page AppealRequest
 * @description Formulário para solicitações de recurso/apelação.
 * @path src/pages/AppealRequest.tsx
 */

import FullPageLoading from "@/components/FullPageLoading";
import ResultSummaryCard from "@/components/Results/ResultSummaryCard";
import Layout from "@/components/layout/Layout";
import {
  ArrowLeft,
  CheckCircle,
  FileText,
  Info,
  Loader2,
  Paperclip,
} from "@/icons";
import { fetchResultById } from "@/services/results";
import { prefetchRoute } from "@/utils/prefetchRoutes";
import { canOpenAppeal, type ResultSummary } from "@/utils/results";
import { type FormEvent, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

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

  const [loadingContext, setLoadingContext] = useState(true);
  const [result, setResult] = useState<ResultSummary | null>(null);
  const [form, setForm] = useState<FormState>({
    motivo: "",
    justificativa: "",
    file: null,
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadContext() {
      if (!resultId) {
        setResult(null);
        setLoadingContext(false);
        return;
      }

      setLoadingContext(true);

      try {
        const data = await fetchResultById(resultId);
        if (active) {
          setResult(data);
        }
      } catch (error) {
        console.error(error);
        if (active) {
          setResult(null);
          toast.error("Não foi possível carregar o contexto do resultado.");
        }
      } finally {
        if (active) {
          setLoadingContext(false);
        }
      }
    }

    void loadContext();

    return () => {
      active = false;
    };
  }, [resultId]);

  const detailPath = resultId
    ? `/app/resultados/${resultId}`
    : "/app/resultados";
  const appealAllowed = result ? canOpenAppeal(result) : false;

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

  if (loadingContext) {
    return <FullPageLoading message="Carregando contexto do recurso" />;
  }

  if (submitted) {
    return (
      <Layout>
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-0">
          <header className="mb-8 rounded-3xl bg-primary px-5 py-6 text-primary-foreground shadow-2xl shadow-primary/20 md:px-8 md:py-8">
            <h1 className="text-xl font-bold tracking-tight md:text-2xl lg:text-3xl">
              Solicitação de Recurso
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-primary-foreground/85">
              O pedido foi registrado no fluxo de revisão do resultado.
            </p>
          </header>

          <section className="mx-auto max-w-3xl rounded-3xl border border-border-default bg-bg-card p-8 text-center shadow-sm">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-success/10 text-success">
              <CheckCircle size={40} />
            </div>
            <h2 className="mb-3 text-2xl font-black text-text-body">
              Solicitação Registrada
            </h2>
            <p className="mx-auto max-w-sm leading-relaxed text-text-muted">
              Sua solicitação de revisão foi registrada e será analisada pelo
              setor responsável (HACO). Você será notificado sobre a decisão.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onMouseEnter={() => prefetchRoute("/app/resultados")}
                onClick={() => navigate("/app/resultados")}
                className="inline-flex items-center gap-2 rounded-xl border border-border-default px-6 py-3 text-sm font-bold uppercase tracking-wider text-text-body transition-colors hover:bg-bg-default"
              >
                <ArrowLeft size={16} />
                Voltar ao Histórico
              </button>
            </div>
          </section>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-0">
        <header className="mb-8 rounded-3xl bg-primary px-5 py-6 text-primary-foreground shadow-2xl shadow-primary/20 md:px-8 md:py-8">
          <h1 className="text-xl font-bold tracking-tight md:text-2xl lg:text-3xl">
            Solicitação de Revisão de Resultado
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-primary-foreground/85">
            Registre a contestação formal somente após revisar os dados
            consolidados da avaliação.
          </p>
        </header>

        {!result ? (
          <section className="rounded-3xl border border-border-default bg-bg-card p-8 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-text-muted">
              Contexto indisponível
            </p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-text-body">
              Nenhum resultado válido foi informado para esta solicitação.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-text-muted">
              Volte ao histórico, abra o resultado desejado e use a ação de
              recurso a partir do registro correto.
            </p>
            <div className="mt-6">
              <button
                type="button"
                onMouseEnter={() => prefetchRoute("/app/resultados")}
                onClick={() => navigate("/app/resultados")}
                className="inline-flex items-center gap-2 rounded-xl border border-border-default px-5 py-3 text-sm font-bold uppercase tracking-wider text-text-body transition-colors hover:bg-bg-default"
              >
                <ArrowLeft size={16} />
                Voltar ao Histórico
              </button>
            </div>
          </section>
        ) : (
          <div className="space-y-6">
            <ResultSummaryCard
              result={result}
              eyebrow="Resultado em análise"
              title="Confirme os dados antes de recorrer"
              description="O recurso deve ser aberto com base no resultado final já disponibilizado no sistema."
              actions={
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="button"
                    onMouseEnter={() =>
                      prefetchRoute("/app/resultados/:resultId")
                    }
                    onClick={() => navigate(detailPath)}
                    className="inline-flex items-center gap-2 rounded-xl border border-border-default px-5 py-3 text-sm font-bold uppercase tracking-wider text-text-body transition-colors hover:bg-bg-default"
                  >
                    <ArrowLeft size={16} />
                    Voltar ao Resultado
                  </button>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
                    Recurso disponível apenas para resultado final
                  </p>
                </div>
              }
            />

            {!appealAllowed ? (
              <section className="rounded-3xl border border-border-default bg-bg-card p-6 shadow-sm">
                <div className="flex items-start gap-3 rounded-2xl border border-primary/10 bg-primary/5 p-4">
                  <Info
                    className="mt-0.5 flex-shrink-0 text-primary"
                    size={18}
                  />
                  <div>
                    <p className="text-sm font-bold text-text-body">
                      Recurso indisponível neste momento
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-text-muted">
                      A abertura de recurso fica disponível somente quando o
                      resultado final estiver classificado como apto ou inapto.
                    </p>
                  </div>
                </div>
              </section>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="overflow-hidden rounded-3xl border border-border-default bg-bg-card shadow-sm"
              >
                <div className="border-b border-border-default bg-bg-default/50 p-6">
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-text-muted">
                    Formulário de contestação
                  </p>
                  <h2 className="mt-2 text-xl font-bold tracking-tight text-text-body">
                    Fundamente o pedido de revisão
                  </h2>
                </div>

                <div className="space-y-8 p-8">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-text-muted">
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
                      className="w-full rounded-xl border border-border-default bg-bg-default p-3.5 text-text-body transition focus:border-primary focus:ring-2 focus:ring-primary"
                    >
                      <option value="">Selecione o motivo...</option>
                      {MOTIVOS.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-text-muted">
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
                      className="w-full resize-none rounded-xl border border-border-default bg-bg-default p-3.5 text-text-body transition focus:border-primary focus:ring-2 focus:ring-primary"
                    />
                    <p className="text-right text-[10px] font-medium text-text-muted">
                      {form.justificativa.length}/2000
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-text-muted">
                      Comprovante / Documento (opcional)
                    </label>
                    <label
                      className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-border-default bg-bg-default p-4 transition hover:border-primary/50"
                      htmlFor="appeal-file"
                    >
                      <Paperclip className="text-text-muted" size={20} />
                      <span className="text-sm font-medium text-text-muted">
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

                  <div className="flex gap-3 rounded-2xl border border-primary/10 bg-primary/5 p-4">
                    <Info
                      className="mt-0.5 flex-shrink-0 text-primary"
                      size={18}
                    />
                    <p className="text-xs leading-relaxed text-text-muted">
                      O prazo para interposição de recurso é de{" "}
                      <strong>5 dias úteis</strong> após a divulgação dos
                      resultados, conforme previsto na{" "}
                      <strong>ICA 54-2 (art. 28 e seguintes)</strong>. Recursos
                      fora do prazo não serão conhecidos.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-center justify-between gap-4 border-t border-border-default bg-bg-default px-8 py-5 sm:flex-row">
                  <button
                    type="button"
                    onMouseEnter={() =>
                      prefetchRoute("/app/resultados/:resultId")
                    }
                    onClick={() => navigate(detailPath)}
                    className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-text-muted transition-colors hover:text-text-body"
                  >
                    <ArrowLeft size={16} /> Voltar ao Resultado
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-3 rounded-xl bg-primary px-8 py-3.5 text-sm font-bold uppercase tracking-wider text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
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
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}

/**
 * @page ResultDetails
 * @description Tela de detalhes consolidados do resultado do TACF.
 * @path src/pages/ResultDetails.tsx
 */

import FullPageLoading from "@/components/FullPageLoading";
import ResultSummaryCard from "@/components/Results/ResultSummaryCard";
import Layout from "@/components/layout/Layout";
import { ArrowLeft, ExternalLink, Info } from "@/icons";
import { fetchResultById } from "@/services/results";
import { prefetchRoute } from "@/utils/prefetchRoutes";
import {
  canOpenAppeal,
  getAppealAvailability,
  type ResultSummary,
} from "@/utils/results";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

export default function ResultDetails() {
  const navigate = useNavigate();
  const { resultId } = useParams<{ resultId: string }>();

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<ResultSummary | null>(null);

  useEffect(() => {
    let active = true;

    async function loadResult() {
      if (!resultId) {
        setResult(null);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const data = await fetchResultById(resultId);
        if (active) {
          setResult(data);
        }
      } catch (error) {
        console.error(error);
        if (active) {
          setResult(null);
          toast.error("Não foi possível carregar o resultado.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadResult();

    return () => {
      active = false;
    };
  }, [resultId]);

  const appealAvailable = result ? canOpenAppeal(result) : false;
  const appealAvailability = result
    ? getAppealAvailability(result)
    : {
        allowed: false,
        reason:
          "Este registro está disponível apenas para consulta no momento.",
      };

  if (loading) {
    return <FullPageLoading message="Carregando resultado" />;
  }

  return (
    <Layout>
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-0">
        <header className="mb-8 rounded-3xl bg-primary px-5 py-6 text-white shadow-2xl shadow-primary/20 md:px-8 md:py-8">
          <h1 className="text-xl font-bold tracking-tight md:text-2xl lg:text-3xl">
            Detalhes do Resultado
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/85">
            Consulte as informações consolidadas da sua avaliação antes de tomar
            qualquer ação adicional.
          </p>
        </header>

        {!result ? (
          <section className="rounded-3xl border border-border-default bg-bg-card p-8 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-text-muted">
              Resultado indisponível
            </p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-text-body">
              Não foi possível localizar este registro.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-text-muted">
              O resultado pode não pertencer ao usuário autenticado ou ainda não
              estar disponível para consulta.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
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
              eyebrow="Resultado consolidado"
              title="Resumo da Avaliação"
              description="Os dados abaixo refletem o registro atualmente disponível para consulta no sistema."
              actions={
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="button"
                    onClick={() => navigate("/app/resultados")}
                    className="inline-flex items-center gap-2 rounded-xl border border-border-default px-5 py-3 text-sm font-bold uppercase tracking-wider text-text-body transition-colors hover:bg-bg-default"
                  >
                    <ArrowLeft size={16} />
                    Voltar ao Histórico
                  </button>

                  {appealAvailable && (
                    <button
                      type="button"
                      onMouseEnter={() => prefetchRoute("/app/recurso")}
                      onClick={() =>
                        navigate(`/app/recurso?result=${result.id}`)
                      }
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold uppercase tracking-wider text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
                    >
                      Solicitar Recurso
                      <ExternalLink size={16} />
                    </button>
                  )}
                </div>
              }
            />

            <section className="rounded-3xl border border-border-default bg-bg-card p-6 shadow-sm">
              <div className="flex items-start gap-3 rounded-2xl border border-primary/10 bg-primary/5 p-4">
                <Info className="mt-0.5 flex-shrink-0 text-primary" size={18} />
                <div>
                  <p className="text-sm font-bold text-text-body">
                    Próximo passo recomendado
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-text-muted">
                    {appealAvailable
                      ? "Se houver divergência no resultado apresentado, utilize a ação de recurso para registrar a contestação formal."
                      : appealAvailability.reason ??
                        "Este registro está disponível apenas para consulta."}
                  </p>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
    </Layout>
  );
}

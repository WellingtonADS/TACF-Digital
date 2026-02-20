import { useEffect } from "react";
import Breadcrumbs from "../components/Breadcrumbs";
import PageSkeleton from "../components/PageSkeleton";
import usePaginatedQuery from "../hooks/usePaginatedQuery";
import Layout from "../layout/Layout";

type Result = {
  id: string;
  profile_id?: string | null;
  full_name?: string | null;
  saram?: string | null;
  test_date?: string | null;
  score?: string | null;
  created_at?: string | null;
};

export default function ResultsHistory() {
  const { items, loading, hasMore, fetchPage } = usePaginatedQuery<Result>(
    "get_results_history",
    { limit: 25 },
  );

  useEffect(() => {
    // initial load
    fetchPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <Breadcrumbs items={["Resultados"]} />

        <header className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Meus Resultados</h1>
        </header>

        <section className="bg-white dark:bg-slate-900 rounded-xl shadow p-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm table-auto">
              <thead>
                <tr className="text-left text-xs text-slate-500 uppercase">
                  <th className="px-3 py-2">Data do Teste</th>
                  <th className="px-3 py-2">SARAM</th>
                  <th className="px-3 py-2">Resultado</th>
                  <th className="px-3 py-2">Registrado em</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 && loading ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-6">
                      <PageSkeleton rows={6} />
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-3 py-6 text-center text-slate-500"
                    >
                      Você ainda não possui resultados registrados.
                    </td>
                  </tr>
                ) : (
                  items.map((r) => (
                    <tr key={r.id} className="border-t">
                      <td className="px-3 py-3">{r.test_date ?? "-"}</td>
                      <td className="px-3 py-3 font-mono">{r.saram ?? "-"}</td>
                      <td className="px-3 py-3">{r.score ?? "-"}</td>
                      <td className="px-3 py-3">{r.created_at ?? "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-center">
            {hasMore ? (
              <button
                onClick={() => fetchPage()}
                className="px-4 py-2 rounded-lg bg-primary text-white"
                disabled={loading}
              >
                {loading ? "Carregando..." : "Carregar mais"}
              </button>
            ) : (
              <span className="text-sm text-slate-500">Fim dos resultados</span>
            )}
          </div>
        </section>
      </div>
    </Layout>
  );
}

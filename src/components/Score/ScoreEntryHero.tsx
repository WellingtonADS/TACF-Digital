import type { SessionRow as DBSessionRow } from "@/types";

type SessaoResumo = Pick<DBSessionRow, "id" | "date" | "period">;

export default function ScoreEntryHero({
  sessaoSelecionada: _sessaoSelecionada,
  totalLancados: _totalLancados,
  totalMilitares: _totalMilitares,
}: {
  sessaoSelecionada: SessaoResumo | null;
  totalLancados: number;
  totalMilitares: number;
}) {
  return (
    <section className="mb-8">
      <div className="relative overflow-hidden rounded-3xl bg-primary px-5 py-6 text-white shadow-2xl shadow-primary/20 md:px-8 md:py-8 lg:px-10 lg:py-10">
        <div className="pointer-events-none absolute inset-0 opacity-10 dashboard-hero-texture" />
        <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight md:text-2xl lg:text-3xl">
              Lançamento de Índices
            </h1>
            <p className="mt-2 text-sm text-white/85 md:text-base">
              Painel administrativo de lançamento de nota final TACF Digital.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function AccessProfilesHero({
  roleSelecionado,
  totalPerfis: _totalPerfis,
  totalModulos: _totalModulos,
}: {
  roleSelecionado: string;
  totalPerfis: number;
  totalModulos: number;
}) {
  return (
    <section>
      <div className="relative overflow-hidden rounded-3xl bg-primary px-5 py-6 text-white shadow-2xl shadow-primary/20 md:px-8 md:py-8 lg:px-10 lg:py-10">
        <div className="pointer-events-none absolute inset-0 opacity-10 dashboard-hero-texture" />
        <div className="relative z-10">
          <div>
            <h1 className="text-xl font-bold tracking-tight md:text-2xl lg:text-3xl">
              Gestão de Perfis de Acesso
            </h1>
            <p className="mt-2 text-sm text-white/85 md:text-base">
              Perfil selecionado: {roleSelecionado}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * @page OmScheduleEditor
 * @description Edição de cronogramas e horários das OM.
 * @path src/pages/OmScheduleEditor.tsx
 */



import FullPageLoading from "@/components/FullPageLoading";
import Layout from "@/components/layout/Layout";
import useLocations from "@/hooks/useLocations";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  Clock3,
  Loader2,
  Moon,
  Save,
  Search,
  Sun,
} from "@/icons";
import supabase from "@/services/supabase";
import type { LocationSchedule } from "@/types/database.types";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

// ─── Constantes ─────────────────────────────────────────────────────────────

const DAYS: { num: number; short: string; long: string }[] = [
  { num: 1, short: "Seg", long: "Segunda-feira" },
  { num: 2, short: "Ter", long: "Terça-feira" },
  { num: 3, short: "Qua", long: "Quarta-feira" },
  { num: 4, short: "Qui", long: "Quinta-feira" },
  { num: 5, short: "Sex", long: "Sexta-feira" },
];

const PERIODS: { key: "morning" | "afternoon"; label: string }[] = [
  { key: "morning", label: "Manhã" },
  { key: "afternoon", label: "Tarde" },
];

const DEFAULT_TIMES: Record<"morning" | "afternoon", string> = {
  morning: "07:00",
  afternoon: "13:00",
};

// ─── Tipos ───────────────────────────────────────────────────────────────────

type SlotKey = `${number}-${"morning" | "afternoon"}`;

type SlotState = {
  day_of_week: number;
  period: "morning" | "afternoon";
  start_time: string;
  is_active: boolean;
};

type DayFilter = "all" | "active" | "inactive";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildDefaultSlots(): Record<SlotKey, SlotState> {
  const result = {} as Record<SlotKey, SlotState>;
  for (const d of DAYS) {
    for (const p of PERIODS) {
      const key: SlotKey = `${d.num}-${p.key}`;
      result[key] = {
        day_of_week: d.num,
        period: p.key,
        start_time: DEFAULT_TIMES[p.key],
        is_active: false,
      };
    }
  }
  return result;
}

function mergeDbSlots(
  defaults: Record<SlotKey, SlotState>,
  rows: LocationSchedule[],
): Record<SlotKey, SlotState> {
  const merged = { ...defaults };
  for (const row of rows) {
    const key: SlotKey = `${row.day_of_week}-${row.period}`;
    merged[key] = {
      day_of_week: row.day_of_week,
      period: row.period,
      start_time: row.start_time.slice(0, 5), // "HH:MM"
      is_active: row.is_active,
    };
  }
  return merged;
}

function PageHero({
  locationName,
  activeCount,
  onBack,
}: {
  locationName: string;
  activeCount: number;
  onBack: () => void;
}) {
  return (
    <section className="mb-6">
      <div className="relative overflow-hidden rounded-3xl bg-primary px-5 py-6 text-white shadow-2xl shadow-primary/20 md:px-8 md:py-8 lg:px-10 lg:py-10">
        <div className="pointer-events-none absolute inset-0 opacity-10 dashboard-hero-texture" />
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight md:text-2xl lg:text-3xl">
              Horários Disponíveis
            </h1>
            <p className="mt-2 text-sm text-white/85 md:text-base">
              Controle operacional de turnos e janelas de atendimento para{" "}
              <span className="font-semibold">{locationName}</span>.
            </p>
          </div>

          <div className="flex flex-col items-start gap-3 sm:items-end">
            <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-white">
              {activeCount} turno{activeCount === 1 ? "" : "s"} ativo
              {activeCount === 1 ? "" : "s"}
            </span>
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/30 bg-white/10 px-5 py-2 text-sm font-semibold text-white transition-all hover:bg-white hover:text-primary"
            >
              <ArrowLeft size={16} />
              Voltar
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function Toolbar({
  query,
  setQuery,
  filter,
  setFilter,
}: {
  query: string;
  setQuery: (value: string) => void;
  filter: DayFilter;
  setFilter: (value: DayFilter) => void;
}) {
  return (
    <div className="mb-6 overflow-hidden rounded-2xl border border-border-default bg-bg-card shadow-sm">
      <div className="flex flex-col items-stretch justify-between gap-3 border-b border-border-default p-3 md:flex-row md:items-center md:p-5">
        <div className="relative w-full md:flex-1 md:min-w-0">
          <input
            type="text"
            placeholder="Buscar dia ou turno..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full rounded-xl border-none bg-bg-default py-2 pl-10 pr-4 text-sm text-text-body placeholder:text-text-muted focus:ring-2 focus:ring-primary/20"
          />
          <Search
            size={16}
            className="absolute left-3 top-2.5 text-text-muted"
          />
        </div>

        <div
          className="flex w-full items-center gap-1 overflow-x-auto rounded-xl bg-bg-default p-1 no-scrollbar md:w-auto"
          role="group"
          aria-label="Filtrar horários"
        >
          {(
            [
              ["all", "Todos"],
              ["active", "Ativos"],
              ["inactive", "Inativos"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={`whitespace-nowrap rounded-lg px-2 py-1.5 text-xs font-semibold transition-colors md:px-3 ${
                filter === value
                  ? "bg-primary/10 text-primary shadow-sm"
                  : "text-text-muted hover:text-text-body"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  locationName,
  activeCount,
  morningCount,
  afternoonCount,
}: {
  locationName: string;
  activeCount: number;
  morningCount: number;
  afternoonCount: number;
}) {
  return (
    <section className="overflow-hidden rounded-3xl border border-border-default bg-bg-card shadow-sm">
      <div className="border-b border-border-default px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-text-muted">
          Resumo da Agenda
        </p>
      </div>

      <div className="space-y-5 p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Building2 size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-base font-bold text-text-body">{locationName}</p>
            <p className="mt-1 text-sm text-text-muted">
              Distribuição atual de disponibilidade por turno.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <div className="rounded-2xl border border-border-default bg-bg-default px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-text-muted">
              Total Ativo
            </p>
            <p className="mt-1 text-lg font-bold text-text-body">
              {activeCount}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-border-default bg-bg-default px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-text-muted">
                Manhã
              </p>
              <p className="mt-1 text-lg font-bold text-text-body">
                {morningCount}
              </p>
            </div>
            <div className="rounded-2xl border border-border-default bg-bg-default px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-text-muted">
                Tarde
              </p>
              <p className="mt-1 text-lg font-bold text-text-body">
                {afternoonCount}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function GuidanceCard() {
  return (
    <section className="overflow-hidden rounded-3xl border border-border-default bg-bg-card shadow-sm">
      <div className="border-b border-border-default px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-text-muted">
          Orientações
        </p>
      </div>

      <div className="space-y-3 p-5 text-sm text-text-muted">
        <div className="rounded-2xl border border-border-default bg-bg-default px-4 py-3">
          Manhã representa o turno matutino. Tarde representa o turno
          vespertino.
        </div>
        <div className="rounded-2xl border border-border-default bg-bg-default px-4 py-3">
          Ative apenas os turnos realmente disponíveis para evitar conflito em
          agendamentos.
        </div>
        <div className="rounded-2xl border border-border-default bg-bg-default px-4 py-3">
          Fins de semana permanecem indisponíveis e não entram na grade
          operacional.
        </div>
      </div>
    </section>
  );
}

// ─── Componente ──────────────────────────────────────────────────────────────

export default function OmScheduleEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { locations, fetch, loading: loadingLocation } = useLocations();

  const [slots, setSlots] =
    useState<Record<SlotKey, SlotState>>(buildDefaultSlots);
  const [loadingSchedules, setLoadingSchedules] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<DayFilter>("all");

  // Carrega dados da OM
  useEffect(() => {
    if (id) fetch({ limit: 100 });
  }, [id, fetch]);

  // Carrega horários existentes do banco
  useEffect(() => {
    if (!id) return;
    setLoadingSchedules(true);
    supabase
      .from("location_schedules")
      .select("*")
      .eq("location_id", id)
      .then(({ data, error }) => {
        if (error) {
          toast.error("Erro ao carregar horários.");
          console.error(error);
        } else {
          setSlots((prev) =>
            mergeDbSlots(prev, (data ?? []) as LocationSchedule[]),
          );
        }
        setLoadingSchedules(false);
      });
  }, [id]);

  const location = locations.find((l) => l.id === id);
  const isLoading = loadingLocation || loadingSchedules;

  function updateSlot(key: SlotKey, patch: Partial<SlotState>) {
    setSlots((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  }

  async function handleSave() {
    if (!id) return;
    setSaving(true);
    try {
      const rows = Object.values(slots).map((s) => ({
        location_id: id,
        day_of_week: s.day_of_week,
        period: s.period,
        start_time: s.start_time,
        is_active: s.is_active,
      }));

      const { error } = await supabase
        .from("location_schedules")
        .upsert(rows, { onConflict: "location_id,day_of_week,period" });

      if (error) throw error;
      toast.success("Horários salvos com sucesso.");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao salvar horários.");
    } finally {
      setSaving(false);
    }
  }

  const activeCount = useMemo(
    () => Object.values(slots).filter((s) => s.is_active).length,
    [slots],
  );

  const morningCount = useMemo(
    () =>
      Object.values(slots).filter((s) => s.period === "morning" && s.is_active)
        .length,
    [slots],
  );

  const afternoonCount = useMemo(
    () =>
      Object.values(slots).filter(
        (s) => s.period === "afternoon" && s.is_active,
      ).length,
    [slots],
  );

  const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR");

  const filteredDays = useMemo(() => {
    return DAYS.filter((day) => {
      const daySlots = PERIODS.map(
        (period) => slots[`${day.num}-${period.key}`],
      );
      const hasActiveSlot = daySlots.some((slot) => slot.is_active);

      const matchesFilter =
        filter === "all"
          ? true
          : filter === "active"
            ? hasActiveSlot
            : !hasActiveSlot;

      const matchesQuery =
        normalizedQuery.length === 0 ||
        day.long.toLocaleLowerCase("pt-BR").includes(normalizedQuery) ||
        day.short.toLocaleLowerCase("pt-BR").includes(normalizedQuery) ||
        PERIODS.some((period) =>
          period.label.toLocaleLowerCase("pt-BR").includes(normalizedQuery),
        );

      return matchesFilter && matchesQuery;
    });
  }, [filter, normalizedQuery, slots]);

  if (isLoading) {
    return (
      <FullPageLoading
        message="Carregando horários"
        description="Aguarde enquanto consolidamos a agenda operacional da OM."
      />
    );
  }

  return (
    <Layout>
      <div className="mx-auto w-full max-w-6xl pb-16">
        <PageHero
          locationName={location?.name ?? "OM não encontrada"}
          activeCount={activeCount}
          onBack={() => navigate("/app/om-locations")}
        />

        <Toolbar
          query={query}
          setQuery={setQuery}
          filter={filter}
          setFilter={setFilter}
        />

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
          <div className="overflow-hidden rounded-3xl border border-border-default bg-bg-card shadow-sm">
            <div className="border-b border-border-default px-6 py-4 md:px-8">
              <div className="flex flex-col gap-3 text-xs text-text-muted md:flex-row md:items-center md:justify-between">
                <div className="flex flex-wrap items-center gap-4">
                  <span className="flex items-center gap-1.5">
                    <Sun size={14} className="text-secondary" />
                    Manhã — turno matutino
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Moon size={14} className="text-primary" />
                    Tarde — turno vespertino
                  </span>
                </div>
                <span className="flex items-center gap-1.5">
                  <CalendarDays size={13} />
                  Fins de semana permanecem indisponíveis
                </span>
              </div>
            </div>

            <div className="p-6 md:p-8">
              <div className="mb-3 grid grid-cols-3 gap-4">
                <div />
                {PERIODS.map((period) => (
                  <div
                    key={period.key}
                    className="flex items-center justify-center gap-2 rounded-xl bg-bg-default py-3 text-xs font-bold uppercase tracking-widest text-text-muted"
                  >
                    {period.key === "morning" ? (
                      <Sun size={14} className="text-secondary" />
                    ) : (
                      <Moon size={14} className="text-primary" />
                    )}
                    {period.label}
                  </div>
                ))}
              </div>

              {filteredDays.length === 0 ? (
                <div className="rounded-2xl border border-border-default bg-bg-default px-6 py-10 text-center">
                  <p className="text-sm font-semibold text-text-body">
                    Nenhum horário encontrado para os filtros atuais.
                  </p>
                  <p className="mt-2 text-sm text-text-muted">
                    Ajuste a busca ou altere o filtro para visualizar outros
                    turnos.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredDays.map((day) => (
                    <div
                      key={day.num}
                      className="grid grid-cols-3 items-center gap-4"
                    >
                      <div className="text-sm font-semibold text-text-body">
                        <span className="hidden md:block">{day.long}</span>
                        <span className="block md:hidden">{day.short}</span>
                      </div>

                      {PERIODS.map((period) => {
                        const key: SlotKey = `${day.num}-${period.key}`;
                        const slot = slots[key];

                        return (
                          <div
                            key={key}
                            className={`flex flex-col gap-3 rounded-xl border p-3 transition-all ${
                              slot.is_active
                                ? "border-primary/20 bg-primary/5"
                                : "border-border-default bg-bg-default"
                            }`}
                          >
                            <label className="flex cursor-pointer items-center justify-between gap-2">
                              <span
                                className={`text-xs font-semibold ${slot.is_active ? "text-primary" : "text-text-muted"}`}
                              >
                                {slot.is_active ? "Ativo" : "Inativo"}
                              </span>
                              <div className="relative inline-flex items-center">
                                <input
                                  type="checkbox"
                                  className="peer sr-only"
                                  checked={slot.is_active}
                                  onChange={(event) =>
                                    updateSlot(key, {
                                      is_active: event.target.checked,
                                    })
                                  }
                                />
                                <div className="h-5 w-10 rounded-full bg-border-default transition peer-checked:bg-primary" />
                                <div className="absolute left-[2px] top-[2px] h-4 w-4 rounded-full bg-white transition peer-checked:translate-x-5" />
                              </div>
                            </label>

                            {slot.is_active && (
                              <div className="flex items-center gap-1.5">
                                <Clock3
                                  size={12}
                                  className="shrink-0 text-text-muted"
                                />
                                <input
                                  type="time"
                                  value={slot.start_time}
                                  onChange={(event) =>
                                    updateSlot(key, {
                                      start_time: event.target.value,
                                    })
                                  }
                                  className="w-full rounded-lg border border-border-default bg-bg-card px-3 py-2 text-xs text-text-body focus-ring"
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col-reverse items-center justify-end gap-4 border-t border-border-default bg-bg-default px-8 py-6 md:flex-row md:px-10">
              <button
                type="button"
                onClick={() => navigate("/app/om-locations")}
                className="w-full px-8 py-3 text-xs font-bold uppercase tracking-widest text-text-muted transition-colors hover:text-text-body md:w-auto"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-8 py-3 text-white shadow-lg shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-60 md:w-auto"
              >
                {saving ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                <span className="text-xs font-bold uppercase tracking-widest">
                  {saving ? "Salvando…" : "Salvar Horários"}
                </span>
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <SummaryCard
              locationName={location?.name ?? "OM não encontrada"}
              activeCount={activeCount}
              morningCount={morningCount}
              afternoonCount={afternoonCount}
            />
            <GuidanceCard />
          </div>
        </div>
      </div>
    </Layout>
  );
}

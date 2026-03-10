import Layout from "@/components/layout/Layout";
import useLocations from "@/hooks/useLocations";
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  Loader2,
  Moon,
  Save,
  Sun,
} from "@/icons";
import supabase from "@/services/supabase";
import type { LocationSchedule } from "@/types/database.types";
import { useEffect, useState } from "react";
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

// ─── Componente ──────────────────────────────────────────────────────────────

export default function OmScheduleEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { locations, fetch, loading: loadingLocation } = useLocations();

  const [slots, setSlots] =
    useState<Record<SlotKey, SlotState>>(buildDefaultSlots);
  const [loadingSchedules, setLoadingSchedules] = useState(true);
  const [saving, setSaving] = useState(false);

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

  const activeCount = Object.values(slots).filter((s) => s.is_active).length;

  return (
    <Layout>
      <div className="mx-auto w-full max-w-4xl pb-16">
        {/* Header */}
        <header className="mb-8 flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <button
              type="button"
              onClick={() => navigate("/app/om-locations")}
              className="mt-1 rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="rounded-lg bg-primary/10 p-2.5">
              <Clock3 className="text-primary" size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                Horários Disponíveis
              </h1>
              <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                {isLoading
                  ? "Carregando…"
                  : location
                    ? location.name
                    : "OM não encontrada"}
              </p>
            </div>
          </div>
          {activeCount > 0 && (
            <span className="mt-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
              {activeCount} turno{activeCount !== 1 ? "s" : ""} ativo
              {activeCount !== 1 ? "s" : ""}
            </span>
          )}
        </header>

        {isLoading ? (
          <div className="flex items-center justify-center py-24 text-slate-400">
            <Loader2 className="animate-spin" size={28} />
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl border border-slate-200/50 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            {/* Legenda de períodos */}
            <div className="border-b border-slate-100 px-8 py-4 dark:border-slate-800">
              <div className="flex items-center gap-6 text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <Sun size={14} className="text-amber-400" />
                  Manhã — turno matutino
                </span>
                <span className="flex items-center gap-1.5">
                  <Moon size={14} className="text-indigo-400" />
                  Tarde — turno vespertino
                </span>
                <span className="ml-auto flex items-center gap-1.5 text-slate-400">
                  <CalendarDays size={13} />
                  Fins de semana sempre indisponíveis
                </span>
              </div>
            </div>

            {/* Grade */}
            <div className="p-6 md:p-10">
              {/* Cabeçalho das colunas */}
              <div className="mb-3 grid grid-cols-3 gap-4">
                <div /> {/* espaço dos dias */}
                {PERIODS.map((p) => (
                  <div
                    key={p.key}
                    className="flex items-center justify-center gap-2 rounded-xl bg-slate-50 py-3 text-xs font-bold uppercase tracking-widest text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                  >
                    {p.key === "morning" ? (
                      <Sun size={14} className="text-amber-400" />
                    ) : (
                      <Moon size={14} className="text-indigo-400" />
                    )}
                    {p.label}
                  </div>
                ))}
              </div>

              {/* Linhas por dia */}
              <div className="space-y-3">
                {DAYS.map((day) => (
                  <div
                    key={day.num}
                    className="grid grid-cols-3 items-center gap-4"
                  >
                    {/* Nome do dia */}
                    <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                      <span className="hidden md:block">{day.long}</span>
                      <span className="block md:hidden">{day.short}</span>
                    </div>

                    {/* Célula por período */}
                    {PERIODS.map((p) => {
                      const key: SlotKey = `${day.num}-${p.key}`;
                      const slot = slots[key];

                      return (
                        <div
                          key={key}
                          className={`flex flex-col gap-2 rounded-xl border p-3 transition-all ${
                            slot.is_active
                              ? "border-primary/30 bg-primary/5 dark:bg-primary/10"
                              : "border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/40"
                          }`}
                        >
                          {/* Toggle ativo */}
                          <label className="flex cursor-pointer items-center justify-between gap-2">
                            <span
                              className={`text-xs font-semibold ${slot.is_active ? "text-primary" : "text-slate-400"}`}
                            >
                              {slot.is_active ? "Ativo" : "Inativo"}
                            </span>
                            <div className="relative inline-flex items-center">
                              <input
                                type="checkbox"
                                className="peer sr-only"
                                checked={slot.is_active}
                                onChange={(e) =>
                                  updateSlot(key, {
                                    is_active: e.target.checked,
                                  })
                                }
                              />
                              <div className="h-5 w-10 rounded-full bg-slate-200 transition peer-checked:bg-primary dark:bg-slate-600" />
                              <div className="absolute left-[2px] top-[2px] h-4 w-4 rounded-full bg-white transition peer-checked:translate-x-5" />
                            </div>
                          </label>

                          {/* Hora de início */}
                          {slot.is_active && (
                            <div className="flex items-center gap-1.5">
                              <Clock3
                                size={12}
                                className="shrink-0 text-slate-400"
                              />
                              <input
                                type="time"
                                value={slot.start_time}
                                onChange={(e) =>
                                  updateSlot(key, {
                                    start_time: e.target.value,
                                  })
                                }
                                className="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Rodapé */}
            <div className="flex flex-col-reverse items-center justify-end gap-4 border-t border-slate-200/50 bg-slate-50 px-8 py-6 md:flex-row md:px-10 dark:border-slate-800 dark:bg-slate-800/30">
              <button
                type="button"
                onClick={() => navigate("/app/om-locations")}
                className="w-full px-8 py-3 text-xs font-bold uppercase tracking-widest text-slate-600 transition hover:text-slate-900 md:w-auto dark:text-slate-400 dark:hover:text-white"
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
        )}
      </div>
    </Layout>
  );
}

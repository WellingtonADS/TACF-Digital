import Layout from "@/components/layout/Layout";
import useLocations from "@/hooks/useLocations";
import supabase from "@/services/supabase";
import { PT_MONTHS } from "@/utils/ptMonths";
import { AlertCircle, CalendarDays, Clock3, Save, XCircle } from "lucide-react";
import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

type DateMode = "single" | "week" | "month";

type FormState = {
  className: string;
  location_id: string;
  instructor_id: string;
  dateMode: DateMode;
  date: string;
  weekValue: string;
  monthValue: string;
  startTime: string;
  maxCapacity: number;
  allowWaitlist: boolean;
  notes: string;
};

const INITIAL_STATE: FormState = {
  className: "",
  location_id: "",
  instructor_id: "",
  dateMode: "single",
  date: "",
  weekValue: "",
  monthValue: "",
  startTime: "",
  maxCapacity: 8,
  allowWaitlist: false,
  notes: "",
};

// ─── Helpers de calendário ───────────────────────────────────────────────────
function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function isWeekend(dateStr: string): boolean {
  const dow = new Date(dateStr + "T12:00:00").getDay();
  return dow === 0 || dow === 6;
}

function getWeekDates(weekValue: string): string[] {
  const match = weekValue.match(/^(\d{4})-W(\d{2})$/);
  if (!match) return [];
  const year = Number(match[1]);
  const week = Number(match[2]);
  const jan4 = new Date(year, 0, 4);
  const dow = jan4.getDay() || 7;
  const monday = new Date(jan4);
  monday.setDate(jan4.getDate() - (dow - 1) + (week - 1) * 7);
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return toDateStr(d);
  });
}

/** Retorna todos os dias úteis (seg–sex) de um mês no formato YYYY-MM. */
function getMonthWeekdays(monthValue: string): string[] {
  const match = monthValue.match(/^(\d{4})-(\d{2})$/);
  if (!match) return [];
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const result: string[] = [];
  for (let d = 1; d <= lastDay; d++) {
    const date = new Date(year, month, d);
    const dow = date.getDay();
    if (dow !== 0 && dow !== 6) result.push(toDateStr(date));
  }
  return result;
}

function fmtDateChip(dateStr: string): string {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

function derivePeriod(startTime: string): "morning" | "afternoon" {
  const [hoursRaw] = startTime.split(":");
  const hours = Number(hoursRaw || 0);
  return hours < 12 ? "morning" : "afternoon";
}

export default function ClassCreationForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [saving, setSaving] = useState(false);
  const [instructors, setInstructors] = useState<
    { id: string; full_name?: string | null; war_name?: string | null }[]
  >([]);
  const [loadingInstructors, setLoadingInstructors] = useState(false);
  const {
    locations,
    fetch: fetchLocations,
    loading: loadingLocations,
  } = useLocations();

  useEffect(() => {
    fetchLocations({ status: "active", limit: 100 });
  }, [fetchLocations]);

  useEffect(() => {
    async function loadInstructors() {
      setLoadingInstructors(true);
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, full_name, war_name, rank")
          .eq("role", "coordinator")
          .eq("active", true)
          .order("full_name", { ascending: true });

        if (error) throw error;
        setInstructors(
          (data ?? []) as {
            id: string;
            full_name?: string | null;
            war_name?: string | null;
            rank?: string | null;
          }[],
        );
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingInstructors(false);
      }
    }

    loadInstructors();
  }, []);

  const isValidCapacity = useMemo(
    () => form.maxCapacity >= 8 && form.maxCapacity <= 21,
    [form.maxCapacity],
  );

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    let datesToCreate: string[];

    if (form.dateMode === "single") {
      if (!form.date) {
        toast.error("Informe a data do teste.");
        return;
      }
      if (isWeekend(form.date)) {
        toast.error("Sábados e domingos não estão disponíveis.");
        return;
      }
      datesToCreate = [form.date];
    } else if (form.dateMode === "week") {
      if (!form.weekValue) {
        toast.error("Selecione uma semana.");
        return;
      }
      datesToCreate = getWeekDates(form.weekValue);
    } else {
      const days = getMonthWeekdays(form.monthValue);
      if (days.length === 0) {
        toast.error("Selecione um mês válido.");
        return;
      }
      datesToCreate = days;
    }

    if (!form.startTime) {
      toast.error("Informe o horário de início.");
      return;
    }

    if (!isValidCapacity) {
      toast.error("A capacidade deve estar entre 8 e 21 vagas.");
      return;
    }

    setSaving(true);
    try {
      const period = derivePeriod(form.startTime);
      const rows = datesToCreate.map((date) => ({
        date,
        period,
        max_capacity: form.maxCapacity,
        ...(form.location_id ? { location_id: form.location_id } : {}),
        ...(form.instructor_id ? { applicators: [form.instructor_id] } : {}),
      }));

      const { error } = await supabase.from("sessions").insert(rows);

      if (error) {
        if (error.code === "23505") {
          toast.error("Já existe turma no mesmo dia e turno.");
        } else {
          toast.error(error.message || "Não foi possível criar a turma.");
        }
        return;
      }

      const count = datesToCreate.length;
      toast.success(
        count === 1
          ? "Turma publicada com sucesso."
          : `${count} turmas publicadas com sucesso.`,
      );
      navigate("/app/agendamentos");
    } catch (error) {
      console.error(error);
      toast.error("Erro inesperado ao publicar turma.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Layout>
      <div className="mx-auto w-full max-w-4xl pb-16 px-4 sm:px-6 xl:px-0">
        <header className="mb-8 flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-primary/10 p-2.5">
              <CalendarDays className="text-primary" size={24} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                Criar Nova Turma
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Preencha os dados abaixo para configurar a nova turma de teste
                físico.
              </p>
            </div>
          </div>
        </header>

        <div className="overflow-hidden rounded-3xl border border-slate-200/50 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
          <form className="flex flex-col" onSubmit={handleSubmit}>
            <div className="space-y-8 sm:space-y-10 p-5 sm:p-8 md:p-12">
              <section className="space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-3 dark:border-slate-800">
                  <AlertCircle className="text-primary/60" size={18} />
                  <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-700 dark:text-slate-300">
                    Informações Básicas
                  </h2>
                </div>

                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                      Nome da Turma
                    </label>
                    <input
                      value={form.className}
                      onChange={(event) =>
                        updateField("className", event.target.value)
                      }
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white"
                      placeholder="Ex: TAF 2º Semestre"
                      type="text"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                      Local do Teste
                    </label>
                    <select
                      value={form.location_id}
                      onChange={(event) =>
                        updateField("location_id", event.target.value)
                      }
                      disabled={loadingLocations}
                      className="w-full cursor-pointer appearance-none rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white"
                    >
                      <option value="">
                        {loadingLocations
                          ? "Carregando locais..."
                          : "Selecione um local"}
                      </option>
                      {locations.map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          {loc.name}
                          {loc.address ? ` — ${loc.address}` : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                      Quem vai aplicar
                    </label>
                    <select
                      value={form.instructor_id}
                      onChange={(e) =>
                        updateField("instructor_id", e.target.value)
                      }
                      disabled={loadingInstructors}
                      className="w-full cursor-pointer appearance-none rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white"
                    >
                      <option value="">
                        {loadingInstructors
                          ? "Carregando instrutores..."
                          : "Selecione um instrutor"}
                      </option>
                      {instructors.map((ins) => (
                        <option key={ins.id} value={ins.id}>
                          {ins.full_name ?? ins.war_name ?? ins.id}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </section>

              <section className="space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-3 dark:border-slate-800">
                  <CalendarDays className="text-primary/60" size={18} />
                  <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-700 dark:text-slate-300">
                    Calendário e Horário
                  </h2>
                </div>

                {/* Seletor de modo */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    Data do Teste
                  </label>
                  <div className="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-1 dark:border-slate-700 dark:bg-slate-800">
                    {(
                      [
                        { mode: "single", label: "Um dia" },
                        { mode: "week", label: "Uma semana" },
                        { mode: "month", label: "Um mês" },
                      ] as { mode: DateMode; label: string }[]
                    ).map(({ mode, label }) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => updateField("dateMode", mode)}
                        className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
                          form.dateMode === mode
                            ? "bg-white text-primary shadow-sm dark:bg-slate-900 dark:text-primary"
                            : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Um dia */}
                {form.dateMode === "single" && (
                  <div className="space-y-1.5">
                    <input
                      type="date"
                      value={form.date}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v && isWeekend(v)) {
                          toast.error(
                            "Sábados e domingos não estão disponíveis.",
                          );
                          updateField("date", "");
                        } else {
                          updateField("date", v);
                        }
                      }}
                      className="w-full max-w-xs rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white"
                    />
                    <p className="text-[11px] text-slate-400">
                      Sábados e domingos são bloqueados automaticamente.
                    </p>
                  </div>
                )}

                {/* Uma semana */}
                {form.dateMode === "week" && (
                  <div className="space-y-3">
                    <input
                      type="week"
                      value={form.weekValue}
                      onChange={(e) => updateField("weekValue", e.target.value)}
                      className="w-full max-w-xs rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white"
                    />
                    {form.weekValue && (
                      <div className="flex flex-wrap gap-2">
                        {getWeekDates(form.weekValue).map((d) => (
                          <span
                            key={d}
                            className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold capitalize text-primary"
                          >
                            {fmtDateChip(d)}
                          </span>
                        ))}
                      </div>
                    )}
                    <p className="text-[11px] text-slate-400">
                      Cria uma turma por dia (seg–sex) para a semana
                      selecionada.
                    </p>
                  </div>
                )}

                {/* Um mês inteiro */}
                {form.dateMode === "month" &&
                  (() => {
                    const days = getMonthWeekdays(form.monthValue);
                    return (
                      <div className="space-y-3">
                        <input
                          type="month"
                          value={form.monthValue}
                          onChange={(e) =>
                            updateField("monthValue", e.target.value)
                          }
                          className="w-full max-w-xs rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white"
                        />
                        {form.monthValue && (
                          <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 dark:bg-primary/10">
                            <CalendarDays
                              size={18}
                              className="shrink-0 text-primary"
                            />
                            <p className="text-sm text-slate-700 dark:text-slate-300">
                              <span className="font-bold text-primary">
                                {days.length} turmas
                              </span>{" "}
                              serão criadas (
                              {
                                PT_MONTHS[
                                  Number(form.monthValue.split("-")[1]) - 1
                                ]
                              }{" "}
                              {form.monthValue.split("-")[0]}), seg–sex, sem
                              fins de semana.
                            </p>
                          </div>
                        )}
                        <p className="text-[11px] text-slate-400">
                          Cria uma turma por dia útil (seg–sex) do mês
                          selecionado.
                        </p>
                      </div>
                    );
                  })()}

                {/* Horário de Início */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    Horário de Início
                  </label>
                  <div className="relative max-w-xs">
                    <Clock3
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      size={16}
                    />
                    <input
                      required
                      value={form.startTime}
                      onChange={(event) =>
                        updateField("startTime", event.target.value)
                      }
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-slate-900 transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white"
                      type="time"
                    />
                  </div>
                </div>
              </section>

              <section className="space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-3 dark:border-slate-800">
                  <AlertCircle className="text-primary/60" size={18} />
                  <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-700 dark:text-slate-300">
                    Configuração de Capacidade
                  </h2>
                </div>

                <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                      Limite de Vagas (8 a 21)
                    </label>
                    <input
                      required
                      min={8}
                      max={21}
                      value={form.maxCapacity}
                      onChange={(event) =>
                        updateField(
                          "maxCapacity",
                          Number(event.target.value || 0),
                        )
                      }
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white"
                      type="number"
                    />
                    {!isValidCapacity && (
                      <p className="text-xs text-red-500">
                        Capacidade fora do intervalo permitido.
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-primary/10 bg-primary/5 p-4 dark:bg-primary/10">
                    <div>
                      <span className="block text-xs font-semibold uppercase tracking-widest text-primary">
                        Lista de Espera
                      </span>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        Permitir inscrições excedentes
                      </p>
                    </div>
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        className="peer sr-only"
                        checked={form.allowWaitlist}
                        onChange={(event) =>
                          updateField("allowWaitlist", event.target.checked)
                        }
                      />
                      <div className="h-6 w-12 rounded-full bg-slate-200 transition peer-checked:bg-primary dark:bg-slate-700" />
                      <div className="absolute left-[2px] top-[2px] h-5 w-5 rounded-full bg-white transition peer-checked:translate-x-6" />
                    </label>
                  </div>
                </div>
              </section>

              <section className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  Instruções Adicionais
                </label>
                <textarea
                  value={form.notes}
                  onChange={(event) => updateField("notes", event.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white"
                  placeholder="Ex: Traje específico, documento oficial com foto e garrafa de água."
                  rows={4}
                />
              </section>
            </div>

            <div className="flex flex-col-reverse items-center justify-end gap-4 border-t border-slate-200/50 bg-slate-50 px-5 py-5 sm:px-8 sm:py-8 md:flex-row md:px-12 dark:border-slate-800 dark:bg-slate-800/30">
              <button
                type="button"
                onClick={() => navigate("/app/turmas")}
                className="w-full px-8 py-3 text-xs font-bold uppercase tracking-widest text-slate-600 transition-colors hover:text-slate-900 md:w-auto dark:text-slate-400 dark:hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-8 py-3 text-white shadow-lg shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-60 md:w-auto"
              >
                {saving ? <Save size={18} /> : <XCircle size={18} />}
                <span className="text-xs font-bold uppercase tracking-widest">
                  {saving ? "Publicando..." : "Publicar Turma"}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}

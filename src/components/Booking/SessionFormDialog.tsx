import Dialog from "@/components/Dialog";
import useLocations from "@/hooks/useLocations";
import { Loader2, Save } from "@/icons";
import { createSessions } from "@/services/bookings";
import { fetchCoordinators, type Coordinator } from "@/services/personnel";
import {
  fetchSessionForEdit,
  updateSession,
  type SessionForEdit,
} from "@/services/sessions";
import { fetchSystemSettings } from "@/services/systemSettings";
import type { Database, SessionPeriod } from "@/types/database.types";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type SessionFormMode = "create" | "edit";
type DateMode = "single" | "week" | "month";

type SessionFormDialogProps = {
  open: boolean;
  mode: SessionFormMode;
  sessionId?: string | null;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
};

type SessionFormState = {
  dateMode: DateMode;
  date: string;
  weekValue: string;
  monthValue: string;
  period: SessionPeriod;
  location_id: string;
  coordinator_id: string;
  min_capacity: number;
  max_capacity: number;
};

type SessionDefaults = {
  min_capacity: number;
  max_capacity: number;
  default_periods: SessionPeriod[];
};

const FALLBACK_DEFAULTS: SessionDefaults = {
  min_capacity: 8,
  max_capacity: 21,
  default_periods: ["manha", "tarde"],
};

const INITIAL_FORM: SessionFormState = {
  dateMode: "single",
  date: "",
  weekValue: "",
  monthValue: "",
  period: "manha",
  location_id: "",
  coordinator_id: "",
  min_capacity: FALLBACK_DEFAULTS.min_capacity,
  max_capacity: FALLBACK_DEFAULTS.max_capacity,
};

function toDateStr(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isWeekend(dateStr: string): boolean {
  const day = new Date(`${dateStr}T12:00:00`).getDay();
  return day === 0 || day === 6;
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

  return Array.from({ length: 5 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return toDateStr(date);
  });
}

function getMonthWeekdays(monthValue: string): string[] {
  const match = monthValue.match(/^(\d{4})-(\d{2})$/);
  if (!match) return [];

  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const result: string[] = [];

  for (let day = 1; day <= lastDay; day += 1) {
    const date = new Date(year, month, day);
    const dow = date.getDay();
    if (dow !== 0 && dow !== 6) {
      result.push(toDateStr(date));
    }
  }

  return result;
}

function normalizeSessionDefaults(
  settings: Awaited<ReturnType<typeof fetchSystemSettings>>,
): SessionDefaults {
  if (!settings) {
    return FALLBACK_DEFAULTS;
  }

  const defaultPeriods =
    settings.default_periods?.filter(
      (period): period is SessionPeriod =>
        period === "manha" || period === "tarde",
    ) ?? [];

  return {
    min_capacity: settings.min_capacity ?? FALLBACK_DEFAULTS.min_capacity,
    max_capacity: settings.max_capacity ?? FALLBACK_DEFAULTS.max_capacity,
    default_periods:
      defaultPeriods.length > 0
        ? defaultPeriods
        : FALLBACK_DEFAULTS.default_periods,
  };
}

function buildEditForm(
  session: SessionForEdit,
  defaults: SessionDefaults,
): SessionFormState {
  return {
    dateMode: "single",
    date: session.date ?? "",
    weekValue: "",
    monthValue: "",
    period: (session.period as SessionPeriod | null) ?? defaults.default_periods[0],
    location_id: session.location_id ?? "",
    coordinator_id:
      session.coordinator_id ??
      (Array.isArray(session.applicators) ? session.applicators[0] ?? "" : ""),
    min_capacity: session.capacity ?? defaults.min_capacity,
    max_capacity: session.max_capacity ?? defaults.max_capacity,
  };
}

function resolveSessionDates(
  mode: SessionFormMode,
  form: SessionFormState,
): string[] {
  if (mode === "edit") {
    return form.date ? [form.date] : [];
  }

  if (form.dateMode === "single") {
    return form.date ? [form.date] : [];
  }

  if (form.dateMode === "week") {
    return getWeekDates(form.weekValue);
  }

  return getMonthWeekdays(form.monthValue);
}

export default function SessionFormDialog({
  open,
  mode,
  sessionId,
  onClose,
  onSaved,
}: SessionFormDialogProps) {
  const {
    locations,
    loading: loadingLocations,
    fetch: fetchLocations,
  } = useLocations();
  const [form, setForm] = useState<SessionFormState>(INITIAL_FORM);
  const [defaults, setDefaults] = useState<SessionDefaults>(FALLBACK_DEFAULTS);
  const [coordinators, setCoordinators] = useState<Coordinator[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    let active = true;

    async function loadContext() {
      setLoading(true);

      try {
        const [settings, fetchedCoordinators] = await Promise.all([
          fetchSystemSettings(),
          fetchCoordinators(),
          fetchLocations({ status: "active", limit: 100 }),
        ]);

        if (!active) {
          return;
        }

        const nextDefaults = normalizeSessionDefaults(settings);
        setDefaults(nextDefaults);
        setCoordinators(fetchedCoordinators);

        if (mode === "edit" && sessionId) {
          const { session } = await fetchSessionForEdit(sessionId);
          if (!active) {
            return;
          }

          setForm(buildEditForm(session, nextDefaults));
        } else {
          setForm({
            ...INITIAL_FORM,
            period: nextDefaults.default_periods[0],
            min_capacity: nextDefaults.min_capacity,
            max_capacity: nextDefaults.max_capacity,
          });
        }
      } catch (error) {
        console.error(error);
        toast.error(
          mode === "create"
            ? "Nao foi possivel carregar o formulario de sessao."
            : "Nao foi possivel carregar os dados da sessao.",
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadContext();

    return () => {
      active = false;
    };
  }, [open, mode, sessionId, fetchLocations]);

  const periodOptions = useMemo(() => {
    const unique = Array.from(new Set(defaults.default_periods));
    return unique.length > 0 ? unique : FALLBACK_DEFAULTS.default_periods;
  }, [defaults.default_periods]);

  const selectedLocation = useMemo(
    () => locations.find((location) => location.id === form.location_id) ?? null,
    [locations, form.location_id],
  );

  function updateField<K extends keyof SessionFormState>(
    key: K,
    value: SessionFormState[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const dates = resolveSessionDates(mode, form);

    if (dates.length === 0) {
      toast.error("Selecione ao menos uma data valida para a sessao.");
      return;
    }

    if (dates.some(isWeekend)) {
      toast.error("Sessoes nao podem ser criadas ou editadas aos fins de semana.");
      return;
    }

    if (!form.location_id) {
      toast.error("Selecione o local de aplicacao.");
      return;
    }

    if (!form.coordinator_id) {
      toast.error("Selecione o coordenador aplicador.");
      return;
    }

    if (form.min_capacity < 1) {
      toast.error("A capacidade minima precisa ser maior que zero.");
      return;
    }

    if (form.max_capacity < form.min_capacity) {
      toast.error("A capacidade maxima nao pode ser menor que a minima.");
      return;
    }

    setSaving(true);

    try {
      if (mode === "create") {
        const rows: Database["public"]["Tables"]["sessions"]["Insert"][] =
          dates.map((date) => ({
            date,
            period: form.period,
            capacity: form.min_capacity,
            max_capacity: form.max_capacity,
            location_id: form.location_id,
            coordinator_id: form.coordinator_id,
            applicators: [form.coordinator_id],
            status: "open",
          }));

        await createSessions(rows);
        toast.success(
          rows.length === 1
            ? "Sessao criada com sucesso."
            : `${rows.length} sessoes criadas com sucesso.`,
        );
      } else {
        if (!sessionId) {
          throw new Error("Sessao nao informada para edicao.");
        }

        await updateSession(sessionId, {
          date: dates[0],
          period: form.period,
          capacity: form.min_capacity,
          max_capacity: form.max_capacity,
          location_id: form.location_id,
          coordinator_id: form.coordinator_id,
          applicators: [form.coordinator_id],
        });
        toast.success("Sessao atualizada com sucesso.");
      }

      await onSaved();
      onClose();
    } catch (error) {
      const err = error as { code?: string; message?: string } | null;
      console.error(error);
      if (err?.code === "23505") {
        toast.error("Ja existe sessao no mesmo dia e turno.");
      } else {
        toast.error(
          err?.message ??
            (mode === "create"
              ? "Nao foi possivel criar a sessao."
              : "Nao foi possivel atualizar a sessao."),
        );
      }
    } finally {
      setSaving(false);
    }
  }

  const previewDates = useMemo(() => {
    if (mode === "edit") {
      return [];
    }

    return resolveSessionDates(mode, form);
  }, [form, mode]);

  const datePreview = useMemo(() => {
    if (mode === "edit") {
      return null;
    }

    if (previewDates.length === 0) {
      return null;
    }

    const label =
      previewDates.length === 1
        ? "1 sessao sera criada."
        : `${previewDates.length} sessoes serao criadas.`;

    return (
      <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-text-body">
        <span className="font-semibold text-primary">{label}</span>
      </div>
    );
  }, [mode, previewDates]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={mode === "create" ? "Nova sessao" : "Editar sessao"}
      description={
        mode === "create"
          ? "Crie novas sessoes sem sair do Hub."
          : "As alteracoes feitas aqui valem apenas para esta sessao e nao alteram o cadastro global do local."
      }
      widthClassName="max-w-4xl"
      footer={
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border-default px-4 py-2 text-sm font-semibold text-text-body"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="session-form-dialog"
            disabled={saving || loading || loadingLocations}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            {mode === "create" ? "Salvar sessao" : "Salvar alteracoes"}
          </button>
        </div>
      }
    >
      {loading ? (
        <div className="flex items-center justify-center gap-3 py-12 text-sm text-text-muted">
          <Loader2 size={18} className="animate-spin" />
          Carregando formulario...
        </div>
      ) : (
        <form
          id="session-form-dialog"
          className="space-y-6"
          onSubmit={handleSubmit}
        >
          {mode === "create" ? (
            <section className="space-y-3">
              <label className="block text-xs font-semibold uppercase tracking-widest text-text-muted">
                Modo de criacao
              </label>
              <div className="inline-flex rounded-xl border border-border-default bg-bg-default p-1">
                {(
                  [
                    { mode: "single" as DateMode, label: "Um dia" },
                    { mode: "week" as DateMode, label: "Uma semana" },
                    { mode: "month" as DateMode, label: "Um mes" },
                  ] as const
                ).map((option) => (
                  <button
                    key={option.mode}
                    type="button"
                    onClick={() => updateField("dateMode", option.mode)}
                    className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
                      form.dateMode === option.mode
                        ? "bg-bg-card text-primary shadow-sm"
                        : "text-text-muted hover:text-text-body"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          <section className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm font-medium text-text-body">
              <span>Local de aplicacao</span>
              <select
                value={form.location_id}
                onChange={(event) =>
                  updateField("location_id", event.target.value)
                }
                disabled={loadingLocations}
                className="w-full rounded-lg border border-border-default bg-bg-default px-4 py-3 text-text-body"
              >
                <option value="">
                  {loadingLocations ? "Carregando locais..." : "Selecione um local"}
                </option>
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                    {location.address ? ` - ${location.address}` : ""}
                  </option>
                ))}
              </select>
              {selectedLocation ? (
                <span className="block text-xs text-text-muted">
                  Padrao global atual do local: {selectedLocation.max_capacity} vagas.
                </span>
              ) : null}
            </label>

            <label className="space-y-2 text-sm font-medium text-text-body">
              <span>Coordenador aplicador</span>
              <select
                value={form.coordinator_id}
                onChange={(event) =>
                  updateField("coordinator_id", event.target.value)
                }
                className="w-full rounded-lg border border-border-default bg-bg-default px-4 py-3 text-text-body"
              >
                <option value="">Selecione um coordenador</option>
                {coordinators.map((coordinator) => (
                  <option key={coordinator.id} value={coordinator.id}>
                    {coordinator.full_name ?? coordinator.war_name ?? coordinator.id}
                  </option>
                ))}
              </select>
              <span className="block text-xs text-text-muted">
                O coordenador selecionado sera o responsavel pela aplicacao desta sessao no dia.
              </span>
            </label>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            {mode === "create" && form.dateMode === "week" ? (
              <label className="space-y-2 text-sm font-medium text-text-body">
                <span>Semana</span>
                <input
                  type="week"
                  value={form.weekValue}
                  onChange={(event) => updateField("weekValue", event.target.value)}
                  className="w-full rounded-lg border border-border-default bg-bg-default px-4 py-3 text-text-body"
                />
              </label>
            ) : mode === "create" && form.dateMode === "month" ? (
              <label className="space-y-2 text-sm font-medium text-text-body">
                <span>Mes</span>
                <input
                  type="month"
                  value={form.monthValue}
                  onChange={(event) =>
                    updateField("monthValue", event.target.value)
                  }
                  className="w-full rounded-lg border border-border-default bg-bg-default px-4 py-3 text-text-body"
                />
              </label>
            ) : (
              <label className="space-y-2 text-sm font-medium text-text-body">
                <span>Data</span>
                <input
                  type="date"
                  value={form.date}
                  onChange={(event) => updateField("date", event.target.value)}
                  className="w-full rounded-lg border border-border-default bg-bg-default px-4 py-3 text-text-body"
                />
              </label>
            )}

            <label className="space-y-2 text-sm font-medium text-text-body">
              <span>Turno</span>
              <select
                value={form.period}
                onChange={(event) =>
                  updateField("period", event.target.value as SessionPeriod)
                }
                className="w-full rounded-lg border border-border-default bg-bg-default px-4 py-3 text-text-body"
              >
                {periodOptions.map((period) => (
                  <option key={period} value={period}>
                    {period === "manha" ? "Manha" : "Tarde"}
                  </option>
                ))}
              </select>
            </label>
          </section>

          {datePreview}

          <section className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm font-medium text-text-body">
              <span>Capacidade minima da sessao</span>
              <input
                type="number"
                min={1}
                value={form.min_capacity}
                onChange={(event) =>
                  updateField("min_capacity", Number(event.target.value || 0))
                }
                className="w-full rounded-lg border border-border-default bg-bg-default px-4 py-3 text-text-body"
              />
            </label>

            <label className="space-y-2 text-sm font-medium text-text-body">
              <span>Capacidade maxima da sessao</span>
              <input
                type="number"
                min={1}
                value={form.max_capacity}
                onChange={(event) =>
                  updateField("max_capacity", Number(event.target.value || 0))
                }
                className="w-full rounded-lg border border-border-default bg-bg-default px-4 py-3 text-text-body"
              />
            </label>
          </section>
        </form>
      )}
    </Dialog>
  );
}

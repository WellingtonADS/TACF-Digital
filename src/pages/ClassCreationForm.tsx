import Layout from "@/layout/Layout";
import supabase from "@/services/supabase";
import { AlertCircle, CalendarDays, Clock3, Save, XCircle } from "lucide-react";
import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

type FormState = {
  className: string;
  location: string;
  date: string;
  startTime: string;
  maxCapacity: number;
  allowWaitlist: boolean;
  notes: string;
};

const INITIAL_STATE: FormState = {
  className: "",
  location: "",
  date: "",
  startTime: "",
  maxCapacity: 8,
  allowWaitlist: false,
  notes: "",
};

function derivePeriod(startTime: string): "morning" | "afternoon" {
  const [hoursRaw] = startTime.split(":");
  const hours = Number(hoursRaw || 0);
  return hours < 12 ? "morning" : "afternoon";
}

export default function ClassCreationForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [saving, setSaving] = useState(false);

  const isValidCapacity = useMemo(
    () => form.maxCapacity >= 8 && form.maxCapacity <= 21,
    [form.maxCapacity],
  );

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.date || !form.startTime) {
      toast.error("Informe a data e o horário da turma.");
      return;
    }

    if (!isValidCapacity) {
      toast.error("A capacidade deve estar entre 8 e 21 vagas.");
      return;
    }

    setSaving(true);
    try {
      const period = derivePeriod(form.startTime);

      const { error } = await supabase.from("sessions").insert({
        date: form.date,
        period,
        max_capacity: form.maxCapacity,
      });

      if (error) {
        if (error.code === "23505") {
          toast.error("Já existe turma no mesmo dia e turno.");
        } else {
          toast.error(error.message || "Não foi possível criar a turma.");
        }
        return;
      }

      toast.success("Turma publicada com sucesso.");
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
      <div className="mx-auto w-full max-w-4xl pb-16">
        <header className="mb-8 flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-primary/10 p-2.5">
              <CalendarDays className="text-primary" size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
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
            <div className="space-y-10 p-8 md:p-12">
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
                      value={form.location}
                      onChange={(event) =>
                        updateField("location", event.target.value)
                      }
                      className="w-full cursor-pointer appearance-none rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white"
                    >
                      <option value="">Selecione um local</option>
                      <option value="HACO">
                        HACO - Hospital de Aeronáutica de Canoas
                      </option>
                      <option value="HAAF">
                        HAAF - Hospital de Aeronáutica dos Afonsos
                      </option>
                      <option value="HFASP">
                        HFASP - Hospital de Força Aérea de São Paulo
                      </option>
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

                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                      Data do Teste
                    </label>
                    <input
                      required
                      value={form.date}
                      onChange={(event) =>
                        updateField("date", event.target.value)
                      }
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white"
                      type="date"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                      Horário de Início
                    </label>
                    <div className="relative">
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

            <div className="flex flex-col-reverse items-center justify-end gap-4 border-t border-slate-200/50 bg-slate-50 px-8 py-8 md:flex-row md:px-12 dark:border-slate-800 dark:bg-slate-800/30">
              <button
                type="button"
                onClick={() => navigate("/app/agendamentos")}
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

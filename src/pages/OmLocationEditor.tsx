import Layout from "@/components/layout/Layout";
import useLocations from "@/hooks/useLocations";
import {
  ArrowLeft,
  Building2,
  CheckCircle,
  Loader2,
  MapPin,
  Tag,
  Users,
  X,
} from "@/icons";
import type { Location } from "@/types/database.types";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

const STATUS_CONFIG = {
  active: {
    label: "Ativo",
    description: "Em plena operação",
    accent:
      "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300",
  },
  maintenance: {
    label: "Manutenção",
    description: "Temporariamente fora",
    accent:
      "border-amber-400 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300",
  },
  inactive: {
    label: "Inativo",
    description: "Desativado",
    accent:
      "border-slate-400 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400",
  },
} as const;

export default function OmLocationEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { locations, create, update, loading, error, fetch } = useLocations();

  const isNew = id === "new";

  // Garante que as locations estejam carregadas ao editar diretamente pela URL
  useEffect(() => {
    if (!isNew) fetch({ limit: 100 });
  }, [isNew, fetch]);
  const [data, setData] = useState<
    Omit<Location, "id" | "created_at" | "updated_at">
  >({
    name: "",
    address: "",
    max_capacity: 0,
    status: "active",
    facilities: [],
    metadata: null,
    created_by: null,
  });
  const [facilityInput, setFacilityInput] = useState("");

  const existing = useMemo(() => {
    if (isNew || !id) return null;
    return locations.find((l) => l.id === id) || null;
  }, [isNew, id, locations]);

  useEffect(() => {
    if (existing) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setData({
        name: existing.name,
        address: existing.address,
        max_capacity: existing.max_capacity,
        status: existing.status,
        facilities: existing.facilities || [],
        metadata: existing.metadata || null,
        created_by: existing.created_by || null,
      });
    }
  }, [existing]);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  function handleChange<K extends keyof typeof data>(
    key: K,
    value: (typeof data)[K],
  ) {
    setData((prev) => ({ ...prev, [key]: value }));
  }

  function addFacility() {
    const tag = facilityInput.trim();
    if (!tag) return;
    if (!(data.facilities ?? []).includes(tag)) {
      handleChange("facilities", [...(data.facilities ?? []), tag]);
    }
    setFacilityInput("");
  }

  function removeFacility(f: string) {
    handleChange(
      "facilities",
      (data.facilities ?? []).filter((x) => x !== f),
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!data.name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    if (data.max_capacity < 0) {
      toast.error("Capacidade deve ser positiva");
      return;
    }
    try {
      if (isNew) {
        const loc = await create(data);
        if (loc) {
          toast.success("Unidade criada com sucesso");
          navigate("/app/om-locations");
        }
      } else if (id) {
        const loc = await update(id, data);
        if (loc) {
          toast.success("Unidade atualizada com sucesso");
          navigate("/app/om-locations");
        }
      }
    } catch {
      // errors handled in hook
    }
  }

  return (
    <Layout>
      <div className="mx-auto w-full max-w-4xl pb-16">
        {/* ── Breadcrumb ── */}
        <button
          type="button"
          onClick={() => navigate("/app/om-locations")}
          className="mb-6 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 transition-colors hover:text-primary"
        >
          <ArrowLeft size={14} />
          Gestão de OMs e Locais
        </button>

        {/* ── Page header ── */}
        <header className="mb-8 flex items-start gap-4">
          <div className="rounded-lg bg-primary/10 p-2.5">
            <Building2 className="text-primary" size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              {isNew ? "Nova Organização Militar" : "Editar Unidade"}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {isNew
                ? "Preencha os dados para cadastrar uma nova OM."
                : `Editando: ${existing?.name ?? "..."}`}
            </p>
          </div>
        </header>

        {/* ── Form card ── */}
        <div className="overflow-hidden rounded-3xl border border-slate-200/50 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
          <form className="flex flex-col" onSubmit={handleSubmit}>
            <div className="space-y-10 p-8 md:p-12">
              {/* Identificação */}
              <section className="space-y-5">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-3 dark:border-slate-800">
                  <Building2 className="text-primary/60" size={16} />
                  <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-700 dark:text-slate-300">
                    Identificação
                  </h2>
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    Nome oficial
                  </label>
                  <input
                    type="text"
                    placeholder="Ex.: HACO – Hospital de Aeronáutica de Canoas"
                    value={data.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white"
                  />
                </div>
              </section>

              {/* Localização */}
              <section className="space-y-5">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-3 dark:border-slate-800">
                  <MapPin className="text-primary/60" size={16} />
                  <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-700 dark:text-slate-300">
                    Localização
                  </h2>
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    Endereço completo
                  </label>
                  <input
                    type="text"
                    placeholder="Rua, número, bairro, cidade — UF"
                    value={data.address}
                    onChange={(e) => handleChange("address", e.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white"
                  />
                </div>
              </section>

              {/* Capacidade + Status */}
              <section className="space-y-5">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-3 dark:border-slate-800">
                  <Users className="text-primary/60" size={16} />
                  <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-700 dark:text-slate-300">
                    Capacidade e Status
                  </h2>
                </div>
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                      Vagas simultâneas
                    </label>
                    <input
                      type="number"
                      min={0}
                      placeholder="0"
                      value={data.max_capacity}
                      onChange={(e) =>
                        handleChange("max_capacity", Number(e.target.value))
                      }
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-slate-900 transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white"
                    />
                    <p className="text-[11px] text-slate-400">
                      Número máximo de avaliados simultâneos neste local.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <p className="block text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                      Status operacional
                    </p>
                    <div className="flex flex-col gap-2">
                      {(
                        Object.keys(
                          STATUS_CONFIG,
                        ) as (keyof typeof STATUS_CONFIG)[]
                      ).map((s) => {
                        const cfg = STATUS_CONFIG[s];
                        const isSelected = data.status === s;
                        return (
                          <button
                            key={s}
                            type="button"
                            onClick={() => handleChange("status", s)}
                            className={`flex items-center gap-3 rounded-lg border-2 p-3 text-left transition-all ${
                              isSelected
                                ? cfg.accent
                                : "border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600"
                            }`}
                          >
                            <div
                              className={`h-3 w-3 flex-shrink-0 rounded-full ${
                                isSelected
                                  ? s === "active"
                                    ? "bg-emerald-500"
                                    : s === "maintenance"
                                      ? "bg-amber-400"
                                      : "bg-slate-400"
                                  : "bg-slate-200 dark:bg-slate-600"
                              }`}
                            />
                            <div>
                              <p className="text-xs font-bold">{cfg.label}</p>
                              <p className="text-[10px] text-slate-400">
                                {cfg.description}
                              </p>
                            </div>
                            {isSelected && (
                              <CheckCircle
                                size={14}
                                className="ml-auto flex-shrink-0"
                              />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </section>

              {/* Instalações */}
              <section className="space-y-5">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-3 dark:border-slate-800">
                  <Tag className="text-primary/60" size={16} />
                  <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-700 dark:text-slate-300">
                    Instalações Disponíveis
                  </h2>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ex.: Pista de Atletismo"
                    value={facilityInput}
                    onChange={(e) => setFacilityInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addFacility();
                      }
                    }}
                    className="w-full flex-1 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={addFacility}
                    className="rounded-lg bg-primary/10 px-5 py-3 text-xs font-bold text-primary transition-colors hover:bg-primary/20"
                  >
                    Adicionar
                  </button>
                </div>
                {(data.facilities ?? []).length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {(data.facilities ?? []).map((f) => (
                      <span
                        key={f}
                        className="inline-flex items-center gap-1.5 rounded-full border border-primary/10 bg-primary/5 px-3 py-1 text-xs font-medium text-primary dark:bg-primary/10"
                      >
                        {f}
                        <button
                          type="button"
                          onClick={() => removeFacility(f)}
                          aria-label={`Remover ${f}`}
                          className="text-primary/60 transition-colors hover:text-red-500"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400">
                    Nenhuma instalação adicionada.
                  </p>
                )}
              </section>
            </div>

            {/* ── Footer ── */}
            <div className="flex flex-col-reverse items-center justify-end gap-4 border-t border-slate-200/50 bg-slate-50 px-8 py-6 md:flex-row md:px-12 dark:border-slate-800 dark:bg-slate-800/30">
              <button
                type="button"
                onClick={() => navigate("/app/om-locations")}
                className="w-full px-8 py-3 text-xs font-bold uppercase tracking-widest text-slate-500 transition-colors hover:text-slate-800 md:w-auto dark:text-slate-400 dark:hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-8 py-3 text-white shadow-lg shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-60 md:w-auto"
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <CheckCircle size={16} />
                )}
                <span className="text-xs font-bold uppercase tracking-widest">
                  {isNew ? "Cadastrar Unidade" : "Salvar Alterações"}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}

/**
 * @page OmLocationEditor
 * @description Edição de locais/Organizações Militares (OM).
 * @path src/pages/OmLocationEditor.tsx
 */

import FullPageLoading from "@/components/FullPageLoading";
import Layout from "@/components/layout/Layout";
import useLocations from "@/hooks/useLocations";
import {
  Building2,
  CheckCircle,
  Loader2,
  MapPin,
  Tag,
  Users,
  X,
} from "@/icons";
import type { Location } from "@/types/database.types";
import { OM_STATUS } from "@/utils/omStatus";
import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

function PageHero({
  isNew,
  title,
  onBack: _onBack,
}: {
  isNew: boolean;
  title: string;
  onBack: () => void;
}) {
  return (
    <section className="mb-6">
      <div className="relative overflow-hidden rounded-3xl bg-primary px-5 py-6 text-white shadow-2xl shadow-primary/20 md:px-8 md:py-8 lg:px-10 lg:py-10">
        <div className="pointer-events-none absolute inset-0 opacity-10 dashboard-hero-texture" />
        <div className="relative z-10">
          <div>
            <h1 className="text-xl font-bold tracking-tight md:text-2xl lg:text-3xl">
              {isNew
                ? "Nova Organização Militar"
                : "Editar Organização Militar"}
            </h1>
            <p className="mt-2 text-sm text-white/85 md:text-base">{title}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function SummaryCard({
  name,
  address,
  capacity,
  status,
  facilities,
}: {
  name: string;
  address: string;
  capacity: number;
  status: keyof typeof OM_STATUS;
  facilities: string[];
}) {
  const meta = OM_STATUS[status];

  return (
    <section className="overflow-hidden rounded-3xl border border-border-default bg-bg-card shadow-sm">
      <div className="border-b border-border-default px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-text-muted">
          Resumo da Unidade
        </p>
      </div>

      <div className="space-y-5 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Building2 size={18} />
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-base font-bold text-text-body">
                {name || "Nova Organização Militar"}
              </h2>
              <p className="mt-1 text-sm text-text-muted">
                {address || "Endereço ainda não informado"}
              </p>
            </div>
          </div>

          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${meta.badge}`}
          >
            {meta.label}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-1">
          <div className="rounded-2xl border border-border-default bg-bg-default px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-text-muted">
              Capacidade
            </p>
            <p className="mt-1 text-lg font-bold text-text-body">
              {capacity} vaga{capacity === 1 ? "" : "s"}
            </p>
          </div>

          <div className="rounded-2xl border border-border-default bg-bg-default px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-text-muted">
              Status Operacional
            </p>
            <p className="mt-1 text-lg font-bold text-text-body">
              {meta.labelLong}
            </p>
            <p className="mt-1 text-xs text-text-muted">{meta.description}</p>
          </div>
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-text-muted">
            Instalações
          </p>
          {facilities.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {facilities.map((facility) => (
                <span
                  key={facility}
                  className="inline-flex items-center rounded-full border border-primary/10 bg-primary/5 px-3 py-1 text-xs font-medium text-primary"
                >
                  {facility}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-text-muted">
              Adicione instalações para facilitar a identificação operacional da
              OM.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function GuidanceCard({ isNew }: { isNew: boolean }) {
  return (
    <section className="overflow-hidden rounded-3xl border border-border-default bg-bg-card shadow-sm">
      <div className="border-b border-border-default px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-text-muted">
          {isNew ? "Checklist de Cadastro" : "Boas Práticas"}
        </p>
      </div>

      <div className="space-y-3 p-5 text-sm text-text-muted">
        <div className="rounded-2xl border border-border-default bg-bg-default px-4 py-3">
          Use o nome oficial da OM para manter consistência entre cadastro,
          agenda e relatórios.
        </div>
        <div className="rounded-2xl border border-border-default bg-bg-default px-4 py-3">
          Informe um endereço claro para evitar ambiguidades em convocações e
          deslocamentos.
        </div>
        <div className="rounded-2xl border border-border-default bg-bg-default px-4 py-3">
          Ajuste o status operacional conforme a disponibilidade real da
          infraestrutura.
        </div>
      </div>
    </section>
  );
}

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

  async function handleSubmit(e: FormEvent) {
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

  const isInitialLoad = !isNew && loading && locations.length === 0;
  const facilityList = data.facilities ?? [];

  if (isInitialLoad) {
    return <FullPageLoading message="Carregando unidade" />;
  }

  return (
    <Layout>
      <div className="mx-auto w-full max-w-5xl pb-16">
        <PageHero
          isNew={isNew}
          title={
            isNew
              ? "Preencha os dados para cadastrar uma nova OM."
              : `Editando: ${existing?.name ?? "..."}`
          }
          onBack={() => navigate("/app/om-locations")}
        />

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
          <div className="overflow-hidden rounded-3xl border border-border-default bg-bg-card shadow-sm">
            <form className="flex flex-col" onSubmit={handleSubmit}>
              <div className="space-y-10 p-8 md:p-12">
                <section className="space-y-5">
                  <div className="flex items-center gap-3 border-b border-border-default pb-3">
                    <Building2 className="text-primary/60" size={16} />
                    <h2 className="text-xs font-semibold uppercase tracking-widest text-text-muted">
                      Identificação
                    </h2>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold uppercase tracking-widest text-text-muted">
                      Nome oficial
                    </label>
                    <input
                      type="text"
                      placeholder="Ex.: HACO – Hospital de Aeronáutica de Canoas"
                      value={data.name}
                      onChange={(e) => handleChange("name", e.target.value)}
                      required
                      className="w-full rounded-xl border border-border-default bg-bg-default px-4 py-3 text-text-body transition-all placeholder:text-text-muted focus-ring"
                    />
                  </div>
                </section>

                <section className="space-y-5">
                  <div className="flex items-center gap-3 border-b border-border-default pb-3">
                    <MapPin className="text-primary/60" size={16} />
                    <h2 className="text-xs font-semibold uppercase tracking-widest text-text-muted">
                      Localização
                    </h2>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold uppercase tracking-widest text-text-muted">
                      Endereço completo
                    </label>
                    <input
                      type="text"
                      placeholder="Rua, número, bairro, cidade — UF"
                      value={data.address}
                      onChange={(e) => handleChange("address", e.target.value)}
                      required
                      className="w-full rounded-xl border border-border-default bg-bg-default px-4 py-3 text-text-body transition-all placeholder:text-text-muted focus-ring"
                    />
                  </div>
                </section>

                <section className="space-y-5">
                  <div className="flex items-center gap-3 border-b border-border-default pb-3">
                    <Users className="text-primary/60" size={16} />
                    <h2 className="text-xs font-semibold uppercase tracking-widest text-text-muted">
                      Capacidade e Status
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold uppercase tracking-widest text-text-muted">
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
                        className="w-full rounded-xl border border-border-default bg-bg-default px-4 py-3 font-mono text-text-body transition-all focus-ring"
                      />
                      <p className="text-[11px] text-text-muted">
                        Número máximo de avaliados simultâneos neste local.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <p className="block text-xs font-semibold uppercase tracking-widest text-text-muted">
                        Status operacional
                      </p>
                      <div className="flex flex-col gap-2">
                        {(
                          Object.keys(OM_STATUS) as (keyof typeof OM_STATUS)[]
                        ).map((s) => {
                          const cfg = OM_STATUS[s];
                          const isSelected = data.status === s;
                          return (
                            <button
                              key={s}
                              type="button"
                              onClick={() => handleChange("status", s)}
                              className={`flex items-center gap-3 rounded-lg border-2 p-3 text-left transition-all ${
                                isSelected
                                  ? cfg.editorAccent
                                  : "border-border-default bg-bg-default text-text-body hover:border-primary/40"
                              }`}
                            >
                              <div
                                className={`h-3 w-3 flex-shrink-0 rounded-full ${
                                  isSelected ? cfg.bar : "bg-border-default"
                                }`}
                              />
                              <div>
                                <p className="text-xs font-bold">
                                  {cfg.labelLong}
                                </p>
                                <p className="text-[10px] text-text-muted">
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

                <section className="space-y-5">
                  <div className="flex items-center gap-3 border-b border-border-default pb-3">
                    <Tag className="text-primary/60" size={16} />
                    <h2 className="text-xs font-semibold uppercase tracking-widest text-text-muted">
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
                      className="w-full flex-1 rounded-xl border border-border-default bg-bg-default px-4 py-3 text-text-body transition-all placeholder:text-text-muted focus-ring"
                    />
                    <button
                      type="button"
                      onClick={addFacility}
                      className="rounded-lg bg-primary/10 px-5 py-3 text-xs font-bold text-primary transition-colors hover:bg-primary/20"
                    >
                      Adicionar
                    </button>
                  </div>
                  {facilityList.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {facilityList.map((f) => (
                        <span
                          key={f}
                          className="inline-flex items-center gap-1.5 rounded-full border border-primary/10 bg-primary/5 px-3 py-1 text-xs font-medium text-primary"
                        >
                          {f}
                          <button
                            type="button"
                            onClick={() => removeFacility(f)}
                            aria-label={`Remover ${f}`}
                            className="text-primary/60 transition-colors hover:text-error"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-text-muted">
                      Nenhuma instalação adicionada.
                    </p>
                  )}
                </section>
              </div>

              <div className="flex flex-col-reverse items-center justify-end gap-4 border-t border-border-default bg-bg-default px-8 py-6 md:flex-row md:px-12">
                <button
                  type="button"
                  onClick={() => navigate("/app/om-locations")}
                  className="w-full px-8 py-3 text-xs font-bold uppercase tracking-widest text-text-muted transition-colors hover:text-text-body md:w-auto"
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

          <div className="space-y-6">
            <SummaryCard
              name={data.name.trim()}
              address={data.address.trim()}
              capacity={data.max_capacity}
              status={data.status}
              facilities={facilityList}
            />
            <GuidanceCard isNew={isNew} />
          </div>
        </div>
      </div>
    </Layout>
  );
}

/**
 * @page OmLocationManager
 * @description Gerenciamento de locais/Organizações Militares.
 * @path src/pages/OmLocationManager.tsx
 */

import { CARD_INTERACTIVE_CLASS } from "@/components/atomic/Card";
import FullPageLoading from "@/components/FullPageLoading";
import Layout from "@/components/layout/Layout";
import useLocations from "@/hooks/useLocations";
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit,
  MapPin,
  Plus,
  Search,
  Users,
} from "@/icons";
import type { Location } from "@/types/database.types";
import { OM_STATUS, STATUS_OPTIONS } from "@/utils/omStatus";
import type { Dispatch, SetStateAction } from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const TAMANHO_PAGINA = 12;

function HeroPagina({
  onNavigate,
}: {
  loading: boolean;
  total: number;
  onNavigate: (path: string) => void;
}) {
  return (
    <section className="mb-6">
      <div className="relative overflow-hidden rounded-3xl bg-primary px-5 py-6 text-white shadow-2xl shadow-primary/20 md:px-8 md:py-8 lg:px-10 lg:py-10">
        <div className="pointer-events-none absolute inset-0 opacity-10 dashboard-hero-texture" />
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight md:text-2xl lg:text-3xl">
              Gestão de locais de avaliação
            </h1>
            <p className="mt-2 text-sm text-white/85 md:text-base">
              Locais e infraestruturas cadastradas.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate("/app/om/new")}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-primary/30 bg-primary/20 px-5 py-2 text-sm font-semibold text-primary-foreground transition-all hover:bg-bg-card hover:text-primary"
          >
            <Plus size={16} />
            Nova OM
          </button>
        </div>
      </div>
    </section>
  );
}

function BarraFerramentas({
  busca,
  setBusca,
  setFiltroStatus,
  filtroStatus,
}: {
  busca: string;
  setBusca: (v: string) => void;
  filtroStatus: (typeof STATUS_OPTIONS)[number];
  setFiltroStatus: (s: (typeof STATUS_OPTIONS)[number]) => void;
}) {
  return (
    <div className="mb-6 overflow-hidden rounded-2xl border border-border-default bg-bg-card shadow-sm">
      <div className="flex flex-col items-stretch justify-between gap-3 border-b border-border-default p-3 md:flex-row md:items-center md:p-5">
        <div className="relative w-full md:flex-1 md:min-w-0">
          <input
            type="text"
            placeholder="Buscar organização militar ou localidade..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
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
          aria-label="Filtrar por status"
        >
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setFiltroStatus(opt)}
              className={`whitespace-nowrap rounded-lg px-2 md:px-3 py-1.5 text-xs font-semibold transition-colors ${
                filtroStatus === opt
                  ? "bg-primary/10 text-primary shadow-sm"
                  : "text-text-muted hover:text-text-body"
              }`}
            >
              {opt === "all"
                ? "Todos"
                : OM_STATUS[opt as keyof typeof OM_STATUS].label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function CardLocal({
  local,
  onNavigate,
}: {
  local: Location;
  onNavigate: (path: string) => void;
}) {
  const meta =
    OM_STATUS[local.status as keyof typeof OM_STATUS] ?? OM_STATUS.inactive;

  return (
    <article
      className={`${CARD_INTERACTIVE_CLASS} rounded-2xl border-l-4 ${meta.accent} flex flex-col overflow-hidden`}
    >
      <div className="p-5 flex-1 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
            <Building2 size={18} />
          </div>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${meta.badge}`}
          >
            {meta.label}
          </span>
        </div>

        <div className="space-y-1">
          <h3 className="text-sm font-bold text-text-body line-clamp-2">
            {local.name}
          </h3>
          <p className="flex items-center gap-1.5 text-xs text-text-muted">
            <MapPin size={11} />
            {local.address || "Endereço não informado"}
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-text-muted">
          <Users size={12} />
          <span>
            Capacidade:{" "}
            <strong className="text-text-body">{local.max_capacity} vagas</strong>
          </span>
        </div>

        {local.facilities && local.facilities.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {local.facilities.slice(0, 3).map((f) => (
              <span
                key={f}
                className="text-[10px] bg-primary/5 text-primary px-2 py-0.5 rounded-full font-medium border border-primary/10"
              >
                {f}
              </span>
            ))}
            {local.facilities.length > 3 && (
              <span className="text-[10px] text-text-muted px-1">
                +{local.facilities.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex border-t border-border-default divide-x divide-border-default">
        <button
          type="button"
          onClick={() => onNavigate(`/app/om/${local.id}`)}
          className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold text-text-muted hover:text-primary hover:bg-primary/5 transition-colors"
        >
          <Edit size={13} /> Editar
        </button>
        <button
          type="button"
          onClick={() => onNavigate(`/app/om/${local.id}/schedules`)}
          className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold text-text-muted hover:text-primary hover:bg-primary/5 transition-colors"
        >
          <Clock size={13} /> Horários
        </button>
      </div>
    </article>
  );
}

function EstadoVazio({
  busca,
  onNavigate,
}: {
  busca: string;
  onNavigate: (p: string) => void;
}) {
  return (
    <div className="bg-bg-card rounded-2xl p-16 text-center border border-border-default">
      <Building2 size={40} className="mx-auto text-text-muted mb-3" />
      <p className="text-text-muted text-sm">
        Nenhuma OM encontrada{busca ? ` para "${busca}"` : ""}.
      </p>
      <button
        type="button"
        onClick={() => onNavigate("/app/om/new")}
        className="mt-4 text-sm text-primary font-semibold hover:underline"
      >
        Cadastrar primeira OM →
      </button>
    </div>
  );
}

function ControlesPaginacao({
  loading,
  total,
  totalExibido,
  pagina,
  setPagina,
  tamanhoPagina,
}: {
  loading: boolean;
  total: number;
  totalExibido: number;
  pagina: number;
  setPagina: Dispatch<SetStateAction<number>>;
  tamanhoPagina: number;
}) {
  if (loading || total <= tamanhoPagina) return null;
  return (
    <div className="mt-6 flex justify-between items-center">
      <p className="text-xs text-text-muted">
        Exibindo {totalExibido} de {total} OMs
      </p>
      <div className="flex gap-1">
        <button
          type="button"
          disabled={pagina === 1}
          onClick={() => setPagina((paginaAtual) => Math.max(1, paginaAtual - 1))}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-border-default bg-bg-card text-text-muted hover:bg-bg-default disabled:opacity-40 disabled:pointer-events-none"
          aria-label="Página anterior"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary text-primary-foreground text-xs font-bold">
          {pagina}
        </span>
        <button
          type="button"
          disabled={pagina * tamanhoPagina >= total}
          onClick={() => setPagina((paginaAtual) => paginaAtual + 1)}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-border-default bg-bg-card text-text-muted hover:bg-bg-default disabled:opacity-40 disabled:pointer-events-none"
          aria-label="Próxima página"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

export default function OmLocationManager() {
  const navigate = useNavigate();
  const {
    locations,
    total,
    loading: carregando,
    error: erro,
    fetch,
  } = useLocations();

  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] =
    useState<(typeof STATUS_OPTIONS)[number]>("all");
  const [pagina, setPagina] = useState(1);
  const tamanhoPagina = TAMANHO_PAGINA;

  useEffect(() => {
    fetch({
      search: busca,
      status: filtroStatus === "all" ? undefined : filtroStatus,
      page: pagina,
      limit: tamanhoPagina,
    });
  }, [busca, filtroStatus, pagina, fetch, tamanhoPagina]);

  useEffect(() => {
    if (erro) toast.error(erro);
  }, [erro]);

  const carregamentoInicial = carregando && (!locations || locations.length === 0);

  if (carregamentoInicial) return <FullPageLoading />;

  return (
    <Layout>
      <div data-testid="om-location-manager-page">
        <HeroPagina loading={carregando} total={total} onNavigate={navigate} />

        <BarraFerramentas
          busca={busca}
          setBusca={(valor) => {
            setBusca(valor);
            setPagina(1);
          }}
          filtroStatus={filtroStatus}
          setFiltroStatus={(status) => {
            setFiltroStatus(status);
            setPagina(1);
          }}
        />

        {locations.length === 0 ? (
          <EstadoVazio busca={busca} onNavigate={navigate} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {locations.map((local) => (
              <CardLocal key={local.id} local={local} onNavigate={navigate} />
            ))}

            <button
              type="button"
              onClick={() => navigate("/app/om/new")}
              className="group bg-bg-card rounded-2xl border-2 border-dashed border-border-default hover:border-primary/40 hover:bg-primary/5 flex flex-col items-center justify-center gap-2 py-10 transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-bg-default group-hover:bg-primary/10 flex items-center justify-center text-text-muted group-hover:text-primary transition-colors">
                <Plus size={20} />
              </div>
              <span className="text-xs font-semibold text-text-muted group-hover:text-primary transition-colors">
                Cadastrar nova OM
              </span>
            </button>
          </div>
        )}

        <ControlesPaginacao
          loading={carregando}
          total={total}
          totalExibido={locations.length}
          pagina={pagina}
          setPagina={setPagina}
          tamanhoPagina={tamanhoPagina}
        />
      </div>
    </Layout>
  );
}

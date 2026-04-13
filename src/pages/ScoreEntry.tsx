/**
 * @page ScoreEntry
 * @description Registro de notas e avaliações.
 * @path src/pages/ScoreEntry.tsx
 */

import ScoreEntryHero from "@/components/Score/ScoreEntryHero";
import AppIcon from "@/components/atomic/AppIcon";
import FullPageLoading from "@/components/FullPageLoading";
import Layout from "@/components/layout/Layout";
import useAuth from "@/hooks/useAuth";
import {
  CheckCircle2,
  ListChecks,
  Search,
  ShieldAlert,
  User,
  UserCheck,
  XCircle,
} from "@/icons";
import {
  fetchRecentSessions,
  fetchSessionBookings,
  updateBookingResult,
} from "@/services/sessions";
import type { SessionRow as DBSessionRow } from "@/types";
import { formatSessionPeriod } from "@/utils/booking";
import { isAdminLike } from "@/router/routeAccess";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";

type SessaoRow = Pick<DBSessionRow, "id" | "date" | "period">;

type StatusAptidao = "apto" | "inapto";

type LinhaLancamento = {
  bookingId: string;
  userId: string;
  fullName: string;
  warName: string | null;
  saram: string | null;
  rank: string | null;
  statusAptidao: StatusAptidao | null;
};

export default function ScoreEntry() {
  const { profile, loading: autenticacaoCarregando } = useAuth();
  const podeGerenciar = isAdminLike(profile?.role);

  const location = useLocation();
  const stateSessionId = (location.state as { sessionId?: string } | null)
    ?.sessionId;

  const [sessoes, setSessoes] = useState<SessaoRow[]>([]);
  const [sessaoSelecionadaId, setSessaoSelecionadaId] = useState<string>(
    stateSessionId ?? "",
  );
  const [linhas, setLinhas] = useState<LinhaLancamento[]>([]);
  const [usuarioSelecionadoId, setUsuarioSelecionadoId] = useState<string>("");
  const [statusAptidao, setStatusAptidao] = useState<StatusAptidao | "">(
    "apto",
  );
  const [termoBusca, setTermoBusca] = useState<string>("");
  const [carregandoSessoes, setCarregandoSessoes] = useState<boolean>(true);
  const [carregandoLinhas, setCarregandoLinhas] = useState<boolean>(false);
  const [salvando, setSalvando] = useState<boolean>(false);

  useEffect(() => {
    async function carregarSessoes() {
      setCarregandoSessoes(true);
      try {
        const sessoesRecentes = (await fetchRecentSessions(50)) as SessaoRow[];
        setSessoes(sessoesRecentes);

        if (sessoesRecentes.length > 0) {
          if (
            stateSessionId &&
            sessoesRecentes.some((s) => s.id === stateSessionId)
          ) {
            setSessaoSelecionadaId(stateSessionId);
          } else {
            setSessaoSelecionadaId(sessoesRecentes[0].id);
          }
        }
      } catch (error) {
        console.error(error);
        setSessoes([]);
        toast.error("Não foi possível carregar as turmas.");
      } finally {
        setCarregandoSessoes(false);
      }
    }

    if (podeGerenciar) {
      carregarSessoes();
    }
  }, [podeGerenciar, stateSessionId]);

  useEffect(() => {
    async function carregarLinhasSessao() {
      if (!sessaoSelecionadaId) {
        setLinhas([]);
        setUsuarioSelecionadoId("");
        setStatusAptidao("apto");
        return;
      }

      setCarregandoLinhas(true);
      try {
        const { bookings, profilesById } =
          await fetchSessionBookings(sessaoSelecionadaId);

        if (bookings.length === 0) {
          setLinhas([]);
          setUsuarioSelecionadoId("");
          setStatusAptidao("apto");
          return;
        }

        const linhasMapeadas = bookings.map((booking) => {
          const p = profilesById.get(booking.user_id);
          return {
            bookingId: booking.id,
            userId: booking.user_id,
            fullName: p?.full_name ?? "Sem nome",
            warName: p?.war_name ?? null,
            saram: p?.saram ?? null,
            rank: p?.rank ?? null,
            statusAptidao:
              booking.result_details === "apto" ||
              booking.result_details === "inapto"
                ? (booking.result_details as StatusAptidao)
                : null,
          } satisfies LinhaLancamento;
        });

        setLinhas(linhasMapeadas);

        const primeiroPendente = linhasMapeadas.find(
          (item) => item.statusAptidao === null,
        );
        const primeiraLinha = linhasMapeadas[0];
        const linhaSelecionada = primeiroPendente ?? primeiraLinha;

        if (linhaSelecionada) {
          setUsuarioSelecionadoId(linhaSelecionada.userId);
          setStatusAptidao(linhaSelecionada.statusAptidao ?? "apto");
        } else {
          setUsuarioSelecionadoId("");
          setStatusAptidao("apto");
        }
      } catch (error) {
        console.error(error);
        setLinhas([]);
        setUsuarioSelecionadoId("");
        setStatusAptidao("apto");
        toast.error("Não foi possível carregar os militares da turma.");
      } finally {
        setCarregandoLinhas(false);
      }
    }

    if (podeGerenciar) {
      carregarLinhasSessao();
    }
  }, [sessaoSelecionadaId, podeGerenciar]);

  const linhasFiltradas = useMemo(() => {
    const buscaNormalizada = termoBusca.trim().toLowerCase();
    if (!buscaNormalizada) return linhas;

    return linhas.filter((row) => {
      return (
        row.fullName.toLowerCase().includes(buscaNormalizada) ||
        (row.warName ?? "").toLowerCase().includes(buscaNormalizada) ||
        (row.saram ?? "").toLowerCase().includes(buscaNormalizada)
      );
    });
  }, [linhas, termoBusca]);

  const linhaSelecionada = useMemo(
    () => linhas.find((row) => row.userId === usuarioSelecionadoId) ?? null,
    [linhas, usuarioSelecionadoId],
  );

  const sessaoSelecionada = useMemo(
    () => sessoes.find((session) => session.id === sessaoSelecionadaId) ?? null,
    [sessoes, sessaoSelecionadaId],
  );

  const totalLancados = useMemo(
    () => linhas.filter((row) => row.statusAptidao !== null).length,
    [linhas],
  );

  async function salvarStatus() {
    if (!linhaSelecionada) {
      toast.error("Selecione um militar para lançar o resultado.");
      return;
    }
    if (!statusAptidao) {
      toast.error("Selecione Apto ou Inapto.");
      return;
    }

    setSalvando(true);
    try {
      await updateBookingResult(linhaSelecionada.bookingId, statusAptidao);

      const linhasAtualizadas = linhas.map((row) =>
        row.bookingId === linhaSelecionada.bookingId
          ? { ...row, statusAptidao: statusAptidao as StatusAptidao }
          : row,
      );

      setLinhas(linhasAtualizadas);
      toast.success(
        `${statusAptidao === "apto" ? "Apto" : "Inapto"} salvo com sucesso.`,
      );

      // Avança automaticamente para o próximo pendente, se houver
      const indiceAtual = linhasAtualizadas.findIndex(
        (row) => row.bookingId === linhaSelecionada.bookingId,
      );
      const proximoPendente =
        linhasAtualizadas
          .slice(indiceAtual + 1)
          .find((row) => row.statusAptidao === null) ??
        linhasAtualizadas
          .slice(0, indiceAtual)
          .find((row) => row.statusAptidao === null);

      if (proximoPendente) {
        setUsuarioSelecionadoId(proximoPendente.userId);
        setStatusAptidao(proximoPendente.statusAptidao ?? "apto");
      }
    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar resultado.");
    } finally {
      setSalvando(false);
    }
  }

  function cancelarEdicao() {
    if (linhaSelecionada) {
      setStatusAptidao(linhaSelecionada.statusAptidao ?? "apto");
    }
  }

  // Mantém o retorno de carregamento apenas após todas as chamadas de hooks/memos.
  const carregandoPagina =
    autenticacaoCarregando ||
    carregandoSessoes ||
    (podeGerenciar && carregandoLinhas);

  if (carregandoPagina) {
    return <FullPageLoading message="Carregando dados" />;
  }

  if (!podeGerenciar) {
    return (
      <Layout>
        <div className="mx-auto mt-10 max-w-xl rounded-2xl border border-alert/30 bg-alert/10 p-6 text-alert">
          <div className="flex items-start gap-3">
            <AppIcon
              icon={ShieldAlert}
              size="md"
              className="mt-0.5"
              ariaLabel="Acesso restrito"
            />
            <div>
              <h1 className="text-lg font-bold">Acesso restrito</h1>
              <p className="mt-1 text-sm">
                Esta área de lançamento de índices está disponível apenas para
                administradores e coordenadores.
              </p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-0">
        <ScoreEntryHero
          sessaoSelecionada={sessaoSelecionada}
          totalLancados={totalLancados}
          totalMilitares={linhas.length}
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <aside className="lg:col-span-4">
            <div className="overflow-hidden rounded-2xl border border-border-default bg-bg-card shadow-sm">
              <div className="border-b border-border-default bg-primary/5 px-5 py-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-primary">
                    Efetivo da Turma
                  </h2>
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                    {totalLancados}/{linhas.length}
                  </span>
                </div>
              </div>

              <div className="p-5">
                <div className="mb-4 flex items-center justify-between">
                  <label
                    htmlFor="session-select"
                    className="text-xs font-bold uppercase tracking-wider text-text-muted"
                  >
                    Seleção de Turma
                  </label>
                </div>

                <select
                  id="session-select"
                  value={sessaoSelecionadaId}
                  onChange={(event) =>
                    setSessaoSelecionadaId(event.target.value)
                  }
                  className="mb-4 w-full rounded-lg border border-border-default bg-bg-default px-3 py-2 text-sm text-text-body"
                >
                  {carregandoSessoes && <option>Carregando turmas...</option>}
                  {!carregandoSessoes && sessoes.length === 0 && (
                    <option value="">Sem turmas disponíveis</option>
                  )}
                  {sessoes.map((session) => (
                    <option key={session.id} value={session.id}>
                      {session.date} • {formatSessionPeriod(session.period)}
                    </option>
                  ))}
                </select>

                <div className="relative mb-4">
                  <AppIcon
                    icon={Search}
                    size="sm"
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                    decorative
                  />
                  <input
                    value={termoBusca}
                    onChange={(event) => setTermoBusca(event.target.value)}
                    placeholder="Buscar por nome ou SARAM..."
                    className="w-full rounded-lg border border-border-default bg-bg-default py-2 pl-9 pr-3 text-sm text-text-body"
                  />
                </div>

                <div className="max-h-[520px] space-y-2 overflow-y-auto pr-1">
                  {carregandoLinhas && (
                    <p className="text-sm text-text-muted">
                      Carregando efetivo...
                    </p>
                  )}

                  {!carregandoLinhas && linhasFiltradas.length === 0 && (
                    <p className="text-sm text-text-muted">
                      Nenhum militar encontrado para a turma selecionada.
                    </p>
                  )}

                  {linhasFiltradas.map((row) => {
                    const ativo = usuarioSelecionadoId === row.userId;
                    const lancado = row.statusAptidao !== null;

                    return (
                      <button
                        key={row.bookingId}
                        type="button"
                        onClick={() => {
                          setUsuarioSelecionadoId(row.userId);
                          setStatusAptidao(row.statusAptidao ?? "apto");
                        }}
                        className={`w-full rounded-xl border px-3 py-3 text-left transition-colors ${
                          ativo
                            ? "border-primary bg-primary/10"
                            : "border-border-default bg-bg-card hover:bg-bg-default"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-text-body">
                              {row.warName || row.fullName}
                            </p>
                            <p className="truncate text-xs text-text-muted">
                              SARAM: {row.saram ?? "--"}
                            </p>
                          </div>
                          <span
                            className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${
                              launched
                              ? row.statusAptidao === "apto"
                                ? "bg-success/10 text-success"
                                : "bg-error/10 text-error"
                              : "bg-alert/10 text-alert"
                            }`}
                          >
                            {lancado
                              ? row.statusAptidao === "apto"
                                ? "Apto"
                                : "Inapto"
                              : "Pendente"}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </aside>

          <section className="lg:col-span-8">
            <div className="rounded-2xl border border-border-default bg-bg-card p-6 shadow-sm">
              {!linhaSelecionada ? (
                <div className="rounded-xl border border-dashed border-border-default p-8 text-center text-sm text-text-muted">
                  Selecione um militar para iniciar o lançamento.
                </div>
              ) : (
                <>
                  <header className="mb-6 rounded-2xl bg-primary/10 p-6 text-primary">
                    <p className="text-[10px] uppercase tracking-widest text-primary/70">
                      Militar selecionado
                    </p>
                    <h2 className="mt-2 text-3xl font-bold">
                      {linhaSelecionada.warName || linhaSelecionada.fullName}
                    </h2>
                    <div className="mt-2 flex flex-wrap gap-4 text-sm text-text-body">
                      <span>SARAM {linhaSelecionada.saram ?? "--"}</span>
                      <span>
                        Posto/Graduação: {linhaSelecionada.rank ?? "--"}
                      </span>
                    </div>
                  </header>

                  <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
                    <div>
                      <label className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-text-muted">
                        <AppIcon
                          icon={UserCheck}
                          size="xs"
                          className="text-primary"
                          ariaLabel="Resultado"
                        />
                        Resultado
                      </label>
                      <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                        <button
                          type="button"
                          onClick={() => setStatusAptidao("apto")}
                          className={`flex flex-1 items-center justify-center gap-2 rounded-xl border-2 py-5 text-base font-bold transition-all ${
                            statusAptidao === "apto"
                              ? "border-success bg-success/10 text-success"
                              : "border-border-default text-text-muted hover:border-success/30"
                          }`}
                        >
                          <AppIcon
                            icon={CheckCircle2}
                            size="md"
                            ariaLabel="Apto"
                          />
                          Apto
                        </button>
                        <button
                          type="button"
                          onClick={() => setStatusAptidao("inapto")}
                          className={`flex flex-1 items-center justify-center gap-2 rounded-xl border-2 py-5 text-base font-bold transition-all ${
                            statusAptidao === "inapto"
                              ? "border-error bg-error/10 text-error"
                              : "border-border-default text-text-muted hover:border-error/30"
                          }`}
                        >
                          <AppIcon
                            icon={XCircle}
                            size="md"
                            ariaLabel="Inapto"
                          />
                          Inapto
                        </button>
                      </div>
                    </div>

                    <aside
                      className={`rounded-xl border p-5 text-center transition-colors ${
                        statusAptidao === "apto"
                          ? "border-success/20 bg-success/10"
                          : statusAptidao === "inapto"
                            ? "border-error/20 bg-error/10"
                            : "border-primary/15 bg-primary/5"
                      }`}
                    >
                      <p className="text-xs font-bold uppercase tracking-widest text-text-muted">
                        Resultado Atual
                      </p>
                      <div className="mt-4 flex items-center justify-center">
                        {statusAptidao === "apto" ? (
                          <AppIcon
                            icon={CheckCircle2}
                            size={"lg"}
                            className="text-success"
                            ariaLabel="Apto"
                          />
                        ) : statusAptidao === "inapto" ? (
                          <AppIcon
                            icon={XCircle}
                            size={"lg"}
                            className="text-error"
                            ariaLabel="Inapto"
                          />
                        ) : (
                          <span className="text-3xl font-black text-text-muted opacity-60">
                            —
                          </span>
                        )}
                      </div>
                      <p
                        className={`mt-2 text-lg font-black ${
                          statusAptidao === "apto"
                            ? "text-success"
                            : statusAptidao === "inapto"
                              ? "text-error"
                              : "text-text-muted"
                        }`}
                      >
                        {statusAptidao === "apto"
                          ? "APTO"
                          : statusAptidao === "inapto"
                            ? "INAPTO"
                            : "—"}
                      </p>
                      <div className="mt-4 flex items-center justify-center gap-2 text-xs text-text-muted">
                        <AppIcon
                          icon={ListChecks}
                          size="xs"
                          className="text-text-muted"
                          decorative
                        />
                        Lançamento de resultado
                      </div>
                    </aside>
                  </div>

                  <div className="mt-8 flex flex-col-reverse gap-3 border-t border-border-default pt-6 sm:flex-row sm:items-center sm:justify-end">
                    <button
                      type="button"
                      disabled={salvando}
                      onClick={cancelarEdicao}
                      className="rounded-lg border border-border-default px-5 py-2.5 text-sm font-semibold text-text-body transition-colors hover:bg-bg-default disabled:opacity-60"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      disabled={salvando || !statusAptidao}
                      onClick={salvarStatus}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-60"
                    >
                      <AppIcon
                        icon={CheckCircle2}
                        size="sm"
                        ariaLabel="Salvar"
                      />
                      {salvando ? "Salvando..." : "Salvar"}
                    </button>
                  </div>
                </>
              )}
            </div>

            <div className="mt-4 rounded-xl border border-border-default bg-bg-card p-4 text-sm text-text-body">
              <div className="flex items-center gap-2">
                <AppIcon
                  icon={User}
                  size="xs"
                  className="text-primary"
                  ariaLabel="Efetivo"
                />
                {linhas.length} militar(es) na turma selecionada • {totalLancados}{" "}
                com resultado lançado
              </div>
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
}

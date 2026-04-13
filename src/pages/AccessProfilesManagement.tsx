/**
 * @page AccessProfilesManagement
 * @description Gestão de perfis de acesso e suas permissões.
 * @path src/pages/AccessProfilesManagement.tsx
 */

import AccessProfilesHero from "@/components/Admin/AccessProfilesHero";
import FullPageLoading from "@/components/FullPageLoading";
import AppIcon from "@/components/atomic/AppIcon";
import Layout from "@/components/layout/Layout";
import useAuth from "@/hooks/useAuth";
import {
  fetchAllProfilesForAccess,
  updateProfile,
} from "@/services/personnel";
import {
  ArrowLeft,
  ArrowRight,
  Shield,
  ShieldCheck,
  User,
  type LucideIcon,
} from "@/icons";
import type { ProfileRole, Profile as UserProfile } from "@/types";
import { getAuthorizationErrorMessage } from "@/utils/getAuthorizationErrorMessage";
import { getSidebarRoutesForRole } from "@/router/routeRegistry";
import { sidebarIconMap } from "@/router/sidebarIcons";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

const ROLE_ORDER: ProfileRole[] = ["admin", "coordinator", "user"];
const PAGE_SIZE = 10;

const ROLE_META: Record<
  ProfileRole,
  { label: string; description: string; icon: LucideIcon }
> = {
  admin: {
    label: "Administrador",
    description: "Acesso completo aos fluxos administrativos.",
    icon: Shield,
  },
  coordinator: {
    label: "Coordenador",
    description: "Acesso operacional ampliado para execução e lançamento.",
    icon: ShieldCheck,
  },
  user: {
    label: "Militar",
    description: "Acesso aos fluxos pessoais e de agendamento.",
    icon: User,
  },
};

export default function AccessProfilesManagement() {
  const { profile, loading: autenticacaoCarregando } = useAuth();
  const podeVisualizar = profile?.role === "admin";

  const [perfis, setPerfis] = useState<UserProfile[]>([]);
  const [papelSelecionado, setPapelSelecionado] =
    useState<ProfileRole>("admin");
  const [paginaAtual, setPaginaAtual] = useState<number>(1);
  const [carregando, setCarregando] = useState<boolean>(true);
  const [perfilSalvandoId, setPerfilSalvandoId] = useState<string | null>(
    null,
  );
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(null);

  const carregarTodosDados = useCallback(async () => {
    setCarregando(true);
    setErroCarregamento(null);
    try {
      const proximosPerfis =
        (await fetchAllProfilesForAccess()) as UserProfile[];
      setPerfis(proximosPerfis);
      setPapelSelecionado((papelAtual) => {
        if (proximosPerfis.some((item) => item.role === papelAtual)) {
          return papelAtual;
        }

        return (
          ROLE_ORDER.find((roleOption) =>
            proximosPerfis.some((item) => item.role === roleOption),
          ) || "user"
        );
      });
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Erro ao carregar.";
      setErroCarregamento(message);
      const authMessage = getAuthorizationErrorMessage(
        err,
        "visualizar perfis de acesso",
      );
      toast.error(authMessage ?? "Falha ao carregar perfis do banco.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    if (podeVisualizar) carregarTodosDados();
  }, [podeVisualizar, carregarTodosDados]);

  useEffect(() => {
    setPaginaAtual(1);
  }, [papelSelecionado]);

  async function atualizarPapelUsuario(
    profileId: string,
    nextRole: ProfileRole,
  ) {
    setPerfilSalvandoId(profileId);
    try {
      await updateProfile(profileId, { role: nextRole });

      setPerfis((perfisAtuais) =>
        perfisAtuais.map((item) =>
          item.id === profileId
            ? {
                ...item,
                role: nextRole,
              }
            : item,
        ),
      );

      toast.success("Perfil de acesso atualizado.");
    } catch (err) {
      console.error(err);
      const authMessage = getAuthorizationErrorMessage(
        err,
        "atualizar perfis de acesso",
      );
      toast.error(authMessage ?? "Falha ao atualizar o perfil de acesso.");
    } finally {
      setPerfilSalvandoId(null);
    }
  }

  const carregandoPagina = autenticacaoCarregando || (podeVisualizar && carregando);
  const metadadosPapelSelecionado = ROLE_META[papelSelecionado];
  const perfisPapelSelecionado = perfis.filter(
    (item) => item.role === papelSelecionado,
  );
  const totalPaginas = Math.max(
    1,
    Math.ceil(perfisPapelSelecionado.length / PAGE_SIZE),
  );
  const paginaAtualSegura = Math.min(paginaAtual, totalPaginas);
  const perfisPaginados = perfisPapelSelecionado.slice(
    (paginaAtualSegura - 1) * PAGE_SIZE,
    paginaAtualSegura * PAGE_SIZE,
  );
  const intervaloInicial = perfisPapelSelecionado.length
    ? (paginaAtualSegura - 1) * PAGE_SIZE + 1
    : 0;
  const intervaloFinal = Math.min(
    paginaAtualSegura * PAGE_SIZE,
    perfisPapelSelecionado.length,
  );
  const modulosVisiveis = Array.from(
    new Map(
      getSidebarRoutesForRole(papelSelecionado)
        .filter((route) => route.sidebarLabel && route.sidebarIcon)
        .map((route) => [
          route.path,
          {
            label: route.sidebarLabel!,
            icon: sidebarIconMap[route.sidebarIcon!],
          },
        ]),
    ).values(),
  );

  if (carregandoPagina) {
    return <FullPageLoading message="Carregando perfis de acesso" />;
  }

  if (!podeVisualizar) {
    return (
      <Layout>
        <div className="p-6 text-alert">Acesso restrito a administradores.</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div
        className="mx-auto w-full max-w-6xl space-y-6 px-4 pb-8 sm:px-6 lg:px-0"
        data-testid="access-profiles-page"
      >
        <AccessProfilesHero
          roleSelecionado={metadadosPapelSelecionado.label}
          totalPerfis={perfisPapelSelecionado.length}
          totalModulos={modulosVisiveis.length}
        />

        <div className="space-y-6">
          <aside className="rounded-3xl border border-border-default bg-bg-card shadow-sm">
            <div className="space-y-5 p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-text-muted">
                  Perfis do Sistema
                </h2>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                  {perfis.length} usuários
                </span>
              </div>

              <nav className="flex gap-3 overflow-x-auto pb-1 sm:grid sm:grid-cols-2 sm:overflow-visible sm:pb-0 xl:grid-cols-3">
                {ROLE_ORDER.map((roleOption) => {
                  const meta = ROLE_META[roleOption];
                  const count = perfis.filter(
                    (item) => item.role === roleOption,
                  ).length;
                  const active = roleOption === papelSelecionado;

                  return (
                    <button
                      key={roleOption}
                      type="button"
                      onClick={() => setPapelSelecionado(roleOption)}
                      className={`min-w-[240px] flex-1 rounded-2xl border px-4 py-4 text-left transition-all sm:min-w-0 ${
                        active
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border-default bg-bg-card hover:border-primary/30 hover:bg-bg-default/60"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl ${
                            active
                              ? "bg-primary text-primary-foreground"
                              : "bg-bg-default text-text-muted"
                          }`}
                        >
                          <AppIcon icon={meta.icon} size="sm" decorative />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-bold text-text-body">
                              {meta.label}
                            </p>
                            <span className="rounded-full bg-bg-default px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-text-muted">
                              {count}
                            </span>
                          </div>
                          <p className="mt-1 text-xs leading-relaxed text-text-muted">
                            {meta.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </nav>
            </div>
          </aside>

          <div className="min-w-0 space-y-6">
            <section className="overflow-hidden rounded-3xl border border-border-default bg-bg-card shadow-2xl">
              <div className="border-b border-border-default px-4 py-4 sm:px-6 lg:px-8">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="flex items-center gap-2 text-lg font-bold text-text-body sm:text-xl">
                      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <AppIcon
                          icon={metadadosPapelSelecionado.icon}
                          size="sm"
                          decorative
                        />
                      </span>
                      Perfil: {metadadosPapelSelecionado.label}
                    </h2>
                    <p className="mt-1 text-sm text-text-muted">
                      {metadadosPapelSelecionado.description}
                    </p>
                  </div>
                  <div className="rounded-xl bg-primary/5 px-4 py-2">
                    <span className="text-xs font-semibold text-primary">
                      {perfisPapelSelecionado.length} usuários vinculados
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-6 p-4 sm:p-6 lg:p-8">
                <div className="min-w-0 overflow-hidden rounded-2xl border border-border-default bg-bg-card/50">
                  <div className="flex items-center justify-between border-b border-border-default bg-bg-default/40 px-4 py-2.5">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                      Usuários do perfil
                    </span>
                    <span className="text-[11px] font-semibold text-primary">
                      {perfisPapelSelecionado.length} itens
                    </span>
                  </div>

                  {erroCarregamento ? (
                    <div className="space-y-3 px-4 py-6">
                      <p className="text-sm font-semibold text-error">
                        Não foi possível carregar os perfis do banco.
                      </p>
                      <p className="text-sm text-text-muted">
                        {erroCarregamento}
                      </p>
                      <button
                        type="button"
                        onClick={carregarTodosDados}
                        className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
                      >
                        Tentar novamente
                      </button>
                    </div>
                  ) : perfisPapelSelecionado.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                      <p className="text-sm font-semibold text-text-body">
                        Nenhum usuário com este perfil.
                      </p>
                      <p className="mt-2 text-sm text-text-muted">
                        Selecione outro perfil ou altere o papel de um usuário
                        quando houver registros.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2 p-3 lg:hidden">
                        {perfisPaginados.map((item) => {
                          const fullName =
                            item.full_name || item.email || item.id;

                          return (
                            <article
                              key={item.id}
                              className="rounded-xl border border-border-default bg-bg-card p-3"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-bold text-text-body">
                                    {fullName}
                                  </p>
                                  <p className="mt-1 truncate text-xs text-text-muted">
                                    {item.email || "E-mail não informado"}
                                  </p>
                                </div>
                                <span
                                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                                    item.active
                                      ? "bg-success/10 text-success"
                                      : "bg-error/10 text-error"
                                  }`}
                                >
                                  {item.active ? "Ativo" : "Inativo"}
                                </span>
                              </div>

                              <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-text-muted">
                                <div className="rounded-lg border border-border-default px-3 py-2">
                                  Posto/Graduação: {item.rank || "--"}
                                </div>
                                <label className="rounded-lg border border-border-default px-3 py-2">
                                  <span className="mb-1 block">Perfil</span>
                                  <select
                                    value={item.role}
                                    disabled={perfilSalvandoId === item.id}
                                    onChange={(event) =>
                                      atualizarPapelUsuario(
                                        item.id,
                                        event.target.value as ProfileRole,
                                      )
                                    }
                                    className="w-full rounded-lg border border-border-default bg-bg-default px-3 py-2 text-sm text-text-body"
                                  >
                                    {ROLE_ORDER.map((roleOption) => (
                                      <option
                                        key={roleOption}
                                        value={roleOption}
                                      >
                                        {ROLE_META[roleOption].label}
                                      </option>
                                    ))}
                                  </select>
                                </label>
                              </div>
                            </article>
                          );
                        })}
                      </div>

                      <div className="hidden w-full overflow-x-auto lg:block">
                        <table className="w-full min-w-[820px] text-left">
                          <thead className="bg-bg-default/80">
                            <tr>
                              <th className="min-w-[260px] px-4 py-4 text-xs font-bold uppercase tracking-wide text-text-muted lg:px-6">
                                Militar
                              </th>
                              <th className="min-w-[140px] px-4 py-4 text-xs font-bold uppercase tracking-wide text-text-muted lg:px-6">
                                Posto
                              </th>
                              <th className="min-w-[120px] px-4 py-4 text-xs font-bold uppercase tracking-wide text-text-muted lg:px-6">
                                Situação
                              </th>
                              <th className="min-w-[210px] px-4 py-4 text-xs font-bold uppercase tracking-wide text-text-muted lg:px-6">
                                Perfil
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border-default">
                            {perfisPaginados.map((item) => {
                              const fullName =
                                item.full_name || item.email || item.id;

                              return (
                                <tr
                                  key={item.id}
                                  className="align-top transition-colors hover:bg-bg-default/60"
                                >
                                  <td className="px-4 py-4 lg:px-6">
                                    <div className="min-w-0">
                                      <p className="truncate text-sm font-semibold text-text-body">
                                        {fullName}
                                      </p>
                                      <p className="mt-1 truncate text-xs text-text-muted">
                                        {item.email || "E-mail não informado"}
                                      </p>
                                    </div>
                                  </td>
                                  <td className="px-4 py-4 text-sm text-text-body lg:px-6">
                                    {item.rank || "--"}
                                  </td>
                                  <td className="px-4 py-4 lg:px-6">
                                    <span
                                      className={`inline-flex whitespace-nowrap rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${
                                        item.active
                                          ? "bg-success/10 text-success"
                                          : "bg-error/10 text-error"
                                      }`}
                                    >
                                      {item.active ? "Ativo" : "Inativo"}
                                    </span>
                                  </td>
                                  <td className="px-4 py-4 lg:px-6">
                                    <select
                                      value={item.role}
                                      disabled={perfilSalvandoId === item.id}
                                      onChange={(event) =>
                                        atualizarPapelUsuario(
                                          item.id,
                                          event.target.value as ProfileRole,
                                        )
                                      }
                                      className="min-w-[190px] rounded-xl border border-border-default bg-bg-default px-3 py-2 text-sm text-text-body focus-ring"
                                    >
                                      {ROLE_ORDER.map((roleOption) => (
                                        <option
                                          key={roleOption}
                                          value={roleOption}
                                        >
                                          {ROLE_META[roleOption].label}
                                        </option>
                                      ))}
                                    </select>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      <div className="flex flex-col gap-3 border-t border-border-default bg-bg-default/30 px-4 py-4 sm:flex-row sm:items-center sm:justify-between lg:px-6">
                        <p className="text-sm text-text-muted">
                          Mostrando {intervaloInicial}-{intervaloFinal} de{" "}
                          {perfisPapelSelecionado.length} usuários
                        </p>

                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setPaginaAtual((page) => Math.max(1, page - 1))
                            }
                            disabled={paginaAtualSegura === 1}
                            className="inline-flex h-9 items-center gap-2 rounded-xl border border-border-default bg-bg-card px-3 text-sm font-semibold text-text-body transition-colors hover:bg-bg-default disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <AppIcon icon={ArrowLeft} size="xs" decorative />
                            Anterior
                          </button>

                          <div className="flex flex-wrap items-center gap-2">
                            {Array.from(
                              { length: totalPaginas },
                              (_, index) => index + 1,
                            ).map((page) => {
                              const active = page === paginaAtualSegura;

                              return (
                                <button
                                  key={page}
                                  type="button"
                                  onClick={() => setPaginaAtual(page)}
                                  className={`flex h-9 min-w-9 items-center justify-center rounded-xl border px-3 text-sm font-semibold transition-colors ${
                                    active
                                      ? "border-primary bg-primary text-primary-foreground"
                                      : "border-border-default bg-bg-card text-text-body hover:bg-bg-default"
                                  }`}
                                >
                                  {page}
                                </button>
                              );
                            })}
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              setPaginaAtual((page) =>
                                Math.min(totalPaginas, page + 1),
                              )
                            }
                            disabled={paginaAtualSegura === totalPaginas}
                            className="inline-flex h-9 items-center gap-2 rounded-xl border border-border-default bg-bg-card px-3 text-sm font-semibold text-text-body transition-colors hover:bg-bg-default disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Próxima
                            <AppIcon icon={ArrowRight} size="xs" decorative />
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <aside className="overflow-hidden rounded-2xl border border-border-default bg-bg-card">
                  <div className="border-b border-border-default px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-widest text-text-muted">
                      Módulos liberados
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-2 p-4 sm:grid-cols-2 xl:grid-cols-3">
                    {modulosVisiveis.length === 0 ? (
                      <p className="text-sm text-text-muted">
                        Nenhum módulo de navegação disponível para este perfil.
                      </p>
                    ) : (
                      modulosVisiveis.map((moduleItem) => (
                        <div
                          key={moduleItem.label}
                          className="flex items-center gap-3 rounded-xl border border-border-default bg-bg-default px-3 py-2.5"
                        >
                          <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <AppIcon
                              icon={moduleItem.icon}
                              size="xs"
                              decorative
                            />
                          </span>
                          <p className="text-sm font-semibold text-text-body">
                            {moduleItem.label}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </aside>
              </div>
            </section>
          </div>
        </div>
      </div>
    </Layout>
  );
}

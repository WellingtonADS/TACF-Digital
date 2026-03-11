/**
 * @page AccessProfilesManagement
 * @description Gestão de perfis de acesso e suas permissões.
 * @path src/pages/AccessProfilesManagement.tsx
 */

import FullPageLoading from "@/components/FullPageLoading";
import AppIcon from "@/components/atomic/AppIcon";
import Layout from "@/components/layout/Layout";
import useAuth from "@/hooks/useAuth";
import {
  ArrowLeft,
  ArrowRight,
  Shield,
  ShieldCheck,
  User,
  type LucideIcon,
} from "@/icons";
import supabase from "@/services/supabase";
import type { ProfileRole, Profile as UserProfile } from "@/types";
import { getSidebarRoutesForRole } from "@/utils/routeRegistry";
import { sidebarIconMap } from "@/utils/sidebarIcons";
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

function PageHero({
  selectedRole,
  totalProfiles,
  totalModules,
}: {
  selectedRole: string;
  totalProfiles: number;
  totalModules: number;
}) {
  return (
    <section>
      <div className="relative overflow-hidden rounded-3xl bg-primary px-5 py-6 text-white shadow-2xl shadow-primary/20 md:px-8 md:py-8 lg:px-10 lg:py-10">
        <div className="pointer-events-none absolute inset-0 opacity-10 dashboard-hero-texture" />
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight md:text-2xl lg:text-3xl">
              Gestão de Perfis de Acesso
            </h1>
            <p className="mt-2 text-sm text-white/85 md:text-base">
              Perfil selecionado: {selectedRole}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-white/30 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
              {totalProfiles} usuários
            </span>
            <span className="rounded-full border border-white/30 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
              {totalModules} módulos
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function AccessProfilesManagement() {
  const { profile, loading: authLoading } = useAuth();
  const canView = profile?.role === "admin";

  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [selectedRole, setSelectedRole] = useState<ProfileRole>("admin");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [savingProfileId, setSavingProfileId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadAllData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select(
          "id, full_name, email, rank, role, active, updated_at, created_at",
        )
        .order("role")
        .order("full_name");

      if (error) throw error;

      const nextProfiles = (data as UserProfile[]) || [];
      setProfiles(nextProfiles);
      setSelectedRole((currentRole) => {
        if (nextProfiles.some((item) => item.role === currentRole)) {
          return currentRole;
        }

        return (
          ROLE_ORDER.find((roleOption) =>
            nextProfiles.some((item) => item.role === roleOption),
          ) || "user"
        );
      });
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Erro ao carregar.";
      setLoadError(message);
      toast.error("Falha ao carregar perfis do banco.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (canView) loadAllData();
  }, [canView, loadAllData]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedRole]);

  async function updateUserRole(profileId: string, nextRole: ProfileRole) {
    setSavingProfileId(profileId);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .update({ role: nextRole })
        .eq("id", profileId)
        .select("id, role, updated_at")
        .maybeSingle();

      if (error) throw error;

      setProfiles((currentProfiles) =>
        currentProfiles.map((item) =>
          item.id === profileId
            ? {
                ...item,
                role: nextRole,
                updated_at: data?.updated_at ?? item.updated_at,
              }
            : item,
        ),
      );

      toast.success("Perfil de acesso atualizado.");
    } catch (err) {
      console.error(err);
      toast.error("Falha ao atualizar o perfil de acesso.");
    } finally {
      setSavingProfileId(null);
    }
  }

  const isPageLoading = authLoading || (canView && loading);
  const selectedRoleMeta = ROLE_META[selectedRole];
  const selectedRoleProfiles = profiles.filter(
    (item) => item.role === selectedRole,
  );
  const totalPages = Math.max(
    1,
    Math.ceil(selectedRoleProfiles.length / PAGE_SIZE),
  );
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedRoleProfiles = selectedRoleProfiles.slice(
    (safeCurrentPage - 1) * PAGE_SIZE,
    safeCurrentPage * PAGE_SIZE,
  );
  const rangeStart = selectedRoleProfiles.length
    ? (safeCurrentPage - 1) * PAGE_SIZE + 1
    : 0;
  const rangeEnd = Math.min(
    safeCurrentPage * PAGE_SIZE,
    selectedRoleProfiles.length,
  );
  const visibleModules = Array.from(
    new Map(
      getSidebarRoutesForRole(selectedRole)
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

  if (isPageLoading) {
    return <FullPageLoading message="Carregando perfis de acesso" />;
  }

  if (!canView) {
    return (
      <Layout>
        <div className="p-6 text-amber-800">
          Acesso restrito a administradores.
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mx-auto w-full max-w-6xl space-y-6 px-4 pb-8 sm:px-6 lg:px-0">
        <PageHero
          selectedRole={selectedRoleMeta.label}
          totalProfiles={selectedRoleProfiles.length}
          totalModules={visibleModules.length}
        />

        <div className="space-y-6">
          <aside className="rounded-3xl border border-border-default bg-bg-card shadow-sm">
            <div className="space-y-5 p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-text-muted">
                  Perfis do Sistema
                </h2>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                  {profiles.length} usuários
                </span>
              </div>

              <nav className="flex gap-3 overflow-x-auto pb-1 sm:grid sm:grid-cols-2 sm:overflow-visible sm:pb-0 xl:grid-cols-3">
                {ROLE_ORDER.map((roleOption) => {
                  const meta = ROLE_META[roleOption];
                  const count = profiles.filter(
                    (item) => item.role === roleOption,
                  ).length;
                  const active = roleOption === selectedRole;

                  return (
                    <button
                      key={roleOption}
                      type="button"
                      onClick={() => setSelectedRole(roleOption)}
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
                          icon={selectedRoleMeta.icon}
                          size="sm"
                          decorative
                        />
                      </span>
                      Perfil: {selectedRoleMeta.label}
                    </h2>
                    <p className="mt-1 text-sm text-text-muted">
                      {selectedRoleMeta.description}
                    </p>
                  </div>
                  <div className="rounded-xl bg-primary/5 px-4 py-2">
                    <span className="text-xs font-semibold text-primary">
                      {selectedRoleProfiles.length} usuários vinculados
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
                      {selectedRoleProfiles.length} itens
                    </span>
                  </div>

                  {loadError ? (
                    <div className="space-y-3 px-4 py-6">
                      <p className="text-sm font-semibold text-error">
                        Não foi possível carregar os perfis do banco.
                      </p>
                      <p className="text-sm text-text-muted">{loadError}</p>
                      <button
                        type="button"
                        onClick={loadAllData}
                        className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
                      >
                        Tentar novamente
                      </button>
                    </div>
                  ) : selectedRoleProfiles.length === 0 ? (
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
                        {paginatedRoleProfiles.map((item) => {
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
                                    disabled={savingProfileId === item.id}
                                    onChange={(event) =>
                                      updateUserRole(
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
                            {paginatedRoleProfiles.map((item) => {
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
                                      disabled={savingProfileId === item.id}
                                      onChange={(event) =>
                                        updateUserRole(
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
                          Mostrando {rangeStart}-{rangeEnd} de{" "}
                          {selectedRoleProfiles.length} usuários
                        </p>

                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setCurrentPage((page) => Math.max(1, page - 1))
                            }
                            disabled={safeCurrentPage === 1}
                            className="inline-flex h-9 items-center gap-2 rounded-xl border border-border-default bg-bg-card px-3 text-sm font-semibold text-text-body transition-colors hover:bg-bg-default disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <AppIcon icon={ArrowLeft} size="xs" decorative />
                            Anterior
                          </button>

                          <div className="flex flex-wrap items-center gap-2">
                            {Array.from(
                              { length: totalPages },
                              (_, index) => index + 1,
                            ).map((page) => {
                              const active = page === safeCurrentPage;

                              return (
                                <button
                                  key={page}
                                  type="button"
                                  onClick={() => setCurrentPage(page)}
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
                              setCurrentPage((page) =>
                                Math.min(totalPages, page + 1),
                              )
                            }
                            disabled={safeCurrentPage === totalPages}
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
                    {visibleModules.length === 0 ? (
                      <p className="text-sm text-text-muted">
                        Nenhum módulo de navegação disponível para este perfil.
                      </p>
                    ) : (
                      visibleModules.map((moduleItem) => (
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

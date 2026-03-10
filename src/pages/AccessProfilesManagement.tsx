import FullPageLoading from "@/components/FullPageLoading";
import Layout from "@/components/layout/Layout";
import useAuth from "@/hooks/useAuth";
import supabase from "@/services/supabase";
import type { AccessProfile, Permission } from "@/types";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// types imported from src/types

export default function AccessProfilesManagement() {
  const { profile, loading: authLoading } = useAuth();
  const canView = profile?.role === "admin";

  const [profiles, setProfiles] = useState<AccessProfile[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(
    null,
  );
  const [profilePermissions, setProfilePermissions] = useState<Set<string>>(
    new Set(),
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingPerms, setLoadingPerms] = useState<boolean>(false);

  useEffect(() => {
    if (canView) loadAllData();
  }, [canView]);

  useEffect(() => {
    if (selectedProfileId) {
      loadProfilePermissions(selectedProfileId);
    } else {
      setProfilePermissions(new Set());
    }
  }, [selectedProfileId]);

  async function loadAllData() {
    setLoading(true);
    try {
      const [{ data: pData, error: pErr }, { data: permData, error: permErr }] =
        await Promise.all([
          supabase.from("access_profiles").select("*").order("name"),
          supabase.from("permissions").select("*").order("name"),
        ]);

      if (pErr) throw pErr;
      if (permErr) throw permErr;

      setProfiles((pData as AccessProfile[]) || []);
      setPermissions((permData as Permission[]) || []);

      // automatically select first profile if exists
      if (pData && pData.length > 0) {
        setSelectedProfileId(pData[0].id);
      }
    } catch (err: unknown) {
      console.error(err);
      toast.error("Falha ao carregar perfis e permissões.");
    } finally {
      setLoading(false);
    }
  }

  async function loadProfilePermissions(profileId: string) {
    setLoadingPerms(true);
    try {
      const { data, error } = await supabase
        .from("access_profile_permissions")
        .select("permission_id")
        .eq("access_profile_id", profileId);

      if (error) throw error;

      const set = new Set<string>();
      (data as Array<{ permission_id: string }> | null)?.forEach((row) => {
        if (row.permission_id) set.add(row.permission_id);
      });

      setProfilePermissions(set);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao carregar permissões do perfil selecionado.");
      setProfilePermissions(new Set());
    } finally {
      setLoadingPerms(false);
    }
  }

  async function togglePermission(permissionId: string, enable: boolean) {
    if (!selectedProfileId) return;
    try {
      if (enable) {
        const { error } = await supabase
          .from("access_profile_permissions")
          .insert({
            access_profile_id: selectedProfileId,
            permission_id: permissionId,
          });
        if (error) throw error;
        setProfilePermissions((prev) => new Set(prev).add(permissionId));
      } else {
        const { error } = await supabase
          .from("access_profile_permissions")
          .delete()
          .eq("access_profile_id", selectedProfileId)
          .eq("permission_id", permissionId);
        if (error) throw error;
        setProfilePermissions((prev) => {
          const clone = new Set(prev);
          clone.delete(permissionId);
          return clone;
        });
      }
    } catch (err) {
      console.error(err);
      toast.error("Falha ao atualizar permissão.");
    }
  }

  async function createProfile() {
    const name = prompt("Nome do novo perfil");
    if (!name) return;
    try {
      const { data, error } = await supabase
        .from("access_profiles")
        .insert({ name, role: "user", icon: "shield", is_active: true })
        .select()
        .maybeSingle();
      if (error) throw error;
      if (data) {
        setProfiles((prev) => [...prev, data]);
        setSelectedProfileId(data.id);
        toast.success("Perfil criado com sucesso.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro ao criar perfil.");
    }
  }

  const selectedProfile =
    profiles.find((p) => p.id === selectedProfileId) || null;

  function iconForPermission(name: string): string {
    if (name.toLowerCase().includes("agend")) return "event";
    if (name.toLowerCase().includes("nota")) return "grade";
    if (name.toLowerCase().includes("configur")) return "settings";
    if (name.toLowerCase().includes("relat")) return "analytics";
    if (name.toLowerCase().includes("usuario")) return "admin_panel_settings";
    if (name.toLowerCase().includes("troca")) return "swap_horiz";
    if (name.toLowerCase().includes("perfil")) return "verified_user";
    if (name.toLowerCase().includes("lista")) return "list";
    if (name.toLowerCase().includes("fazer")) return "edit_calendar";
    return "shield";
  }

  if (authLoading) {
    return <FullPageLoading message="Validando acesso" />;
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
      {loading ? (
        <FullPageLoading message="Carregando perfis" />
      ) : (
        <div className="max-w-6xl mx-auto flex flex-col gap-6 lg:flex-row lg:gap-8">
          {/* sidebar */}
          <aside className="w-full lg:w-80 lg:flex-shrink-0 flex flex-col gap-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-text-muted">
                Perfis Cadastrados
              </h2>
              <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full">
                {profiles.filter((p) => p.is_active).length} ATIVOS
              </span>
            </div>
            <div className="space-y-3">
              {profiles.map((profile) => (
                <button
                  key={profile.id}
                  onClick={() => setSelectedProfileId(profile.id)}
                  className={`w-full text-left p-4 rounded-xl shadow-sm flex items-center gap-3 transition-all ${
                    profile.id === selectedProfileId
                      ? "bg-bg-card border-2 border-primary"
                      : "bg-bg-card border border-border-default hover:border-primary/50 group"
                  }`}
                >
                  <div
                    className={`${
                      profile.id === selectedProfileId
                        ? "bg-primary text-primary-foreground"
                        : "bg-bg-default text-text-muted group-hover:text-primary"
                    } p-2 rounded-lg`}
                  >
                    <span className="material-icons-outlined text-sm">
                      {profile.icon}
                    </span>
                  </div>
                  <div>
                    <p className="font-bold text-text-body text-sm">
                      {profile.name}
                    </p>
                    <p className="text-xs text-text-muted">
                      {profile.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={createProfile}
              className="mt-4 flex items-center justify-center gap-2 p-3 border-2 border-dashed border-border-default rounded-xl text-text-muted font-medium hover:bg-bg-default transition-all text-sm"
            >
              <span className="material-icons-outlined text-sm">add</span>
              Novo Perfil
            </button>
          </aside>

          {/* main content */}
          <div className="flex-1 flex flex-col gap-6 overflow-y-auto lg:pr-2">
            <div className="bg-bg-card rounded-3xl shadow-2xl p-4 sm:p-6 lg:p-8 border border-border-default">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-text-body flex items-center gap-2">
                    <span className="material-icons-outlined text-primary">
                      settings
                    </span>
                    Permissões do Perfil: {selectedProfile?.name || "--"}
                  </h2>
                  <p className="text-text-muted text-sm">
                    Defina os níveis de acesso para cada módulo do TACF-Digital.
                  </p>
                </div>
                {selectedProfile?.updated_at && (
                  <div className="bg-primary/5 px-4 py-2 rounded-lg">
                    <span className="text-xs font-semibold text-primary">
                      Última alteração:{" "}
                      {new Date(selectedProfile.updated_at).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
              {/* permissions table */}
              <div className="border border-border-default rounded-xl">
                <div className="space-y-2 p-3 md:hidden">
                  {permissions.map((perm) => {
                    const enabled = profilePermissions.has(perm.id);
                    const name = perm.name;

                    return (
                      <article
                        key={perm.id}
                        className="rounded-lg border border-border-default bg-bg-card p-3"
                      >
                        <div className="mb-3 flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-bg-default text-text-muted">
                            <span className="material-icons-outlined text-sm">
                              {iconForPermission(name)}
                            </span>
                          </div>
                          <span className="text-sm font-semibold text-text-body">
                            {name}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          {["Visualizar", "Criar", "Editar", "Excluir"].map(
                            (label, idx) => (
                              <label
                                key={label}
                                className="flex items-center justify-between rounded-md border border-border-default px-2 py-1.5 text-xs"
                              >
                                <span className="text-text-muted">{label}</span>
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 rounded border-border-default text-primary focus:ring-primary"
                                  checked={enabled}
                                  disabled={!selectedProfileId || loadingPerms}
                                  onChange={(e) =>
                                    togglePermission(perm.id, e.target.checked)
                                  }
                                  aria-label={`${label} - ${name}`}
                                  data-col={idx}
                                />
                              </label>
                            ),
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>

                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full min-w-[760px] text-left">
                    <thead className="bg-bg-default/80">
                      <tr>
                        <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase">
                          Módulo
                        </th>
                        <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase text-center">
                          Visualizar
                        </th>
                        <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase text-center">
                          Criar
                        </th>
                        <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase text-center">
                          Editar
                        </th>
                        <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase text-center">
                          Excluir
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-default">
                      {permissions.map((perm) => {
                        const enabled = profilePermissions.has(perm.id);
                        const name = perm.name;
                        return (
                          <tr
                            key={perm.id}
                            className="hover:bg-bg-default/70 transition-colors"
                          >
                            <td className="px-6 py-5 font-semibold text-text-body">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-bg-default flex items-center justify-center text-text-muted">
                                  <span className="material-icons-outlined text-sm">
                                    {iconForPermission(name)}
                                  </span>
                                </div>
                                <span className="font-semibold text-sm">
                                  {name}
                                </span>
                              </div>
                            </td>
                            {[1, 2, 3, 4].map((col) => (
                              <td key={col} className="px-6 py-5 text-center">
                                <input
                                  type="checkbox"
                                  className="w-5 h-5 rounded border-border-default text-primary focus:ring-primary"
                                  checked={enabled}
                                  disabled={!selectedProfileId || loadingPerms}
                                  onChange={(e) =>
                                    togglePermission(perm.id, e.target.checked)
                                  }
                                />
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

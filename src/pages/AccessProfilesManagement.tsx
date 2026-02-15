import { Body, H1, H2 } from "@/components/ui/Typography";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchAccessProfiles,
  toggleAccessProfilePermission,
  type AccessProfileWithPermissions,
  type PermissionOption,
} from "@/services/admin";
import {
  AdminPanelSettings,
  AssignmentInd,
  Person,
  Shield,
} from "@mui/icons-material";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function AccessProfilesManagement() {
  const { profile } = useAuth();
  const [selectedProfileId, setSelectedProfileId] = useState<string>("");
  const [profiles, setProfiles] = useState<AccessProfileWithPermissions[]>([]);
  const [permissions, setPermissions] = useState<PermissionOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingPermission, setSavingPermission] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const res = await fetchAccessProfiles();
      if (!mounted) return;
      if (res.error) {
        toast.error("Erro ao carregar perfis de acesso");
      } else {
        setProfiles(res.data);
        setPermissions(res.permissions);
        if (res.data.length > 0) {
          setSelectedProfileId((prev) => prev || res.data[0].id);
        }
      }
      setLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // Apenas admins root podem acessar
  if (profile?.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <H1 className="text-2xl font-bold text-slate-900">Acesso Negado</H1>
          <Body className="text-slate-500 mt-2">
            Apenas administradores têm acesso a esta página.
          </Body>
        </div>
      </div>
    );
  }

  const selectedProfile = profiles.find((p) => p.id === selectedProfileId);
  const activeProfilesCount = profiles.filter((p) => p.isActive).length;

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case "admin_panel_settings":
        return <AdminPanelSettings />;
      case "assignment_ind":
        return <AssignmentInd />;
      case "person":
        return <Person />;
      default:
        return <Shield />;
    }
  };

  const handleTogglePermission = async (
    permissionId: string,
    enabled: boolean,
  ) => {
    if (!selectedProfile) return;
    setSavingPermission(permissionId);
    const res = await toggleAccessProfilePermission(
      selectedProfile.id,
      permissionId,
      enabled,
    );

    if (res.error) {
      toast.error("Erro ao atualizar permissao");
    } else {
      setProfiles((prev) =>
        prev.map((profileItem) => {
          if (profileItem.id !== selectedProfile.id) return profileItem;
          const permissionIds = enabled
            ? Array.from(new Set([...profileItem.permissionIds, permissionId]))
            : profileItem.permissionIds.filter((id) => id !== permissionId);
          const permissionNames = permissionIds
            .map((id) => permissions.find((p) => p.id === id)?.name)
            .filter((name): name is string => Boolean(name));
          return {
            ...profileItem,
            permissionIds,
            permissions: permissionNames,
          };
        }),
      );
    }

    setSavingPermission(null);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-8 py-6 sticky top-0 z-30">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Shield className="text-primary" />
            </div>
            <H1 className="text-2xl font-bold text-slate-900">
              Gestão de Perfis de Acesso
            </H1>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <Body className="text-sm font-semibold">TACF-Digital (FAB)</Body>
              <Body className="text-xs text-slate-500">
                Sistema Administrativo
              </Body>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex max-w-[1600px] mx-auto w-full p-8 gap-8">
        {/* Left Sidebar: Profile Selection */}
        <aside className="w-80 flex-shrink-0 flex flex-col gap-4">
          <div className="flex items-center justify-between mb-2">
            <H2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Perfis Cadastrados
            </H2>
            <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full">
              {activeProfilesCount} ATIVOS
            </span>
          </div>

          <div className="space-y-3">
            {loading && (
              <div className="text-sm text-slate-400">Carregando perfis...</div>
            )}
            {!loading && profiles.length === 0 && (
              <div className="text-sm text-slate-400">
                Nenhum perfil encontrado
              </div>
            )}
            {!loading &&
              profiles.map((profile) => (
                <button
                  key={profile.id}
                  onClick={() => setSelectedProfileId(profile.id)}
                  className={`w-full text-left p-4 bg-white rounded-xl shadow-sm transition-all ${
                    selectedProfileId === profile.id
                      ? "border-2 border-primary"
                      : "border border-slate-200 hover:border-primary/50"
                  }`}
                  type="button"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${
                        selectedProfileId === profile.id
                          ? "bg-primary text-white"
                          : "bg-slate-100 text-slate-400 group-hover:text-primary"
                      }`}
                    >
                      {getIconComponent(profile.icon)}
                    </div>
                    <div>
                      <Body
                        className={`font-bold text-sm ${
                          selectedProfileId === profile.id
                            ? "text-slate-900"
                            : "text-slate-700"
                        }`}
                      >
                        {profile.name}
                      </Body>
                      <Body className="text-xs text-slate-500">
                        {profile.description}
                      </Body>
                    </div>
                  </div>
                </button>
              ))}
          </div>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <Body className="text-sm text-blue-800">
              💡 Os perfis de acesso são baseados nos roles do sistema (admin,
              coordinator, user)
            </Body>
          </div>
        </aside>

        {/* Right Content: Profile Details */}
        <section className="flex-1 bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
          {selectedProfile ? (
            <div className="space-y-8">
              {/* Profile Header */}
              <div className="flex items-start justify-between pb-6 border-b border-slate-200">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-primary/10 rounded-xl">
                    <div className="text-primary text-3xl">
                      {getIconComponent(selectedProfile.icon)}
                    </div>
                  </div>
                  <div>
                    <H1 className="text-2xl font-bold text-slate-900">
                      {selectedProfile.name}
                    </H1>
                    <Body className="text-slate-500 mt-1">
                      {selectedProfile.description}
                    </Body>
                    <Body className="text-xs text-slate-400 mt-2">
                      Role:{" "}
                      <code className="px-2 py-0.5 bg-slate-100 rounded text-xs">
                        {selectedProfile.role}
                      </code>
                    </Body>
                  </div>
                </div>

                <div
                  className={`px-4 py-2 rounded-lg font-bold text-sm ${
                    selectedProfile.isActive
                      ? "bg-green-100 text-green-700"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {selectedProfile.isActive ? "Ativo" : "Inativo"}
                </div>
              </div>

              {/* Permissions Section */}
              <div>
                <H2 className="text-xl font-bold text-slate-900 mb-4">
                  Permissões do Perfil
                </H2>
                <Body className="text-sm text-slate-500 mb-6">
                  Recursos e funcionalidades disponíveis para este perfil de
                  acesso
                </Body>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {permissions.map((permission) => {
                    const checked = selectedProfile.permissionIds.includes(
                      permission.id,
                    );
                    return (
                      <label
                        key={permission.id}
                        className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) =>
                            handleTogglePermission(
                              permission.id,
                              e.target.checked,
                            )
                          }
                          disabled={savingPermission === permission.id}
                          className="w-5 h-5 text-primary rounded focus:ring-2 focus:ring-primary"
                        />
                        <div>
                          <Body className="font-medium text-slate-700">
                            {permission.name}
                          </Body>
                          {permission.description && (
                            <Body className="text-xs text-slate-500">
                              {permission.description}
                            </Body>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Info Card */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mt-8">
                <H2 className="text-lg font-bold text-amber-900 mb-2">
                  ⚠️ Funcionalidade em Desenvolvimento
                </H2>
                <Body className="text-sm text-amber-800 mb-3">
                  A gestão completa de perfis de acesso requer:
                </Body>
                <ul className="list-disc list-inside space-y-1 text-sm text-amber-700">
                  <li>
                    Criação de tabela{" "}
                    <code className="px-2 py-0.5 bg-amber-100 rounded text-xs">
                      access_profiles
                    </code>{" "}
                    no Supabase
                  </li>
                  <li>
                    Criação de tabela{" "}
                    <code className="px-2 py-0.5 bg-amber-100 rounded text-xs">
                      permissions
                    </code>{" "}
                    para controle granular
                  </li>
                  <li>Implementação de RPCs para gestão de permissões</li>
                  <li>
                    Atualização das políticas RLS para verificar permissões
                  </li>
                </ul>
                <Body className="text-sm text-amber-700 mt-3">
                  Solicite ao coordenador técnico (HACO) a criação das
                  migrations correspondentes.
                </Body>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-4 pt-6 border-t border-slate-200">
                <button
                  onClick={() =>
                    toast.info("Funcionalidade disponível em versão futura")
                  }
                  className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition-colors"
                  type="button"
                >
                  Editar Perfil
                </button>
                <button
                  onClick={() =>
                    toast.info("Funcionalidade disponível em versão futura")
                  }
                  className="px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors"
                  type="button"
                >
                  Salvar Alterações
                </button>
              </div>
            </div>
          ) : (
            <Body className="text-center text-slate-500 py-12">
              Selecione um perfil para visualizar detalhes
            </Body>
          )}
        </section>
      </main>
    </div>
  );
}

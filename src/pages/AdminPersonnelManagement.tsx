import Button from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Search_Icon as Search, UserCog, Users } from "@/components/ui/icons";
import { fetchProfiles, updateProfile } from "@/services/admin";
import type { Profile, SemesterType, UserRole } from "@/types/database.types";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type EditableProfile = Pick<
  Profile,
  "rank" | "sector" | "role" | "semester" | "active"
>;

const roleOptions: Array<{ value: UserRole; label: string }> = [
  { value: "admin", label: "Administrador" },
  { value: "coordinator", label: "Coordenador" },
  { value: "user", label: "Usuário" },
];

const semesterOptions: SemesterType[] = ["1", "2"];

export default function AdminPersonnelManagement() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selectedSector, setSelectedSector] = useState("all");
  const [selectedRole, setSelectedRole] = useState("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<EditableProfile | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await fetchProfiles(true);
        if (mounted) {
          setProfiles((res ?? []) as Profile[]);
        }
      } catch {
        toast.error("Erro ao carregar efetivo");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const sectors = useMemo(() => {
    const unique = new Set(
      profiles
        .map((p) => p.sector)
        .filter((s): s is string => Boolean(s && s.trim())),
    );
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [profiles]);

  const filteredProfiles = useMemo(() => {
    const q = query.trim().toLowerCase();
    return profiles.filter((profile) => {
      const matchesQuery =
        !q ||
        profile.full_name.toLowerCase().includes(q) ||
        (profile.war_name ?? "").toLowerCase().includes(q) ||
        (profile.saram ?? "").toLowerCase().includes(q) ||
        (profile.rank ?? "").toLowerCase().includes(q);

      const matchesSector =
        selectedSector === "all" ||
        (profile.sector ?? "").toLowerCase() === selectedSector.toLowerCase();

      const matchesRole =
        selectedRole === "all" || profile.role === selectedRole;

      return matchesQuery && matchesSector && matchesRole;
    });
  }, [profiles, query, selectedSector, selectedRole]);

  const stats = useMemo(() => {
    const total = profiles.length;
    const active = profiles.filter((p) => p.active).length;
    const inactive = total - active;
    return { total, active, inactive };
  }, [profiles]);

  const startEditing = (profile: Profile) => {
    setEditingId(profile.id);
    setDraft({
      rank: profile.rank,
      sector: profile.sector,
      role: profile.role,
      semester: profile.semester,
      active: profile.active,
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setDraft(null);
  };

  const updateDraft = <K extends keyof EditableProfile>(
    key: K,
    value: EditableProfile[K],
  ) => {
    setDraft((prev) => ({
      ...(prev ?? {
        rank: "",
        sector: "",
        role: "user",
        semester: "1",
        active: true,
      }),
      [key]: value,
    }));
  };

  const handleSave = async (profile: Profile) => {
    if (!draft) return;
    setSavingId(profile.id);
    try {
      const res = await updateProfile(profile.id, draft);
      if (res.error) {
        toast.error(res.error);
        return;
      }

      if (res.data) {
        setProfiles((prev) =>
          prev.map((p) => (p.id === profile.id ? res.data! : p)),
        );
        toast.success("Registro atualizado");
        cancelEditing();
      }
    } catch {
      toast.error("Erro ao salvar alterações");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        title="Gestão de Efetivo"
        description="Organize o efetivo militar com filtros rápidos e edição inline."
        icon={<Users />}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              toast.info("Importação CSV estará disponível em breve")
            }
          >
            Importar CSV
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total de Militares"
          value={stats.total}
          icon={<Users />}
        />
        <StatCard
          title="Ativos"
          value={stats.active}
          icon={<UserCog />}
          variant="success"
        />
        <StatCard
          title="Inativos"
          value={stats.inactive}
          icon={<UserCog />}
          variant="alert"
        />
      </div>

      <Card className="border border-slate-200 shadow-sm" padding="md">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex-1">
            <Input
              placeholder="Buscar por nome, SARAM ou posto"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              icon={<Search size={16} />}
              className="bg-white"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              aria-label="Filtrar por OM"
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700"
            >
              <option value="all">Todas as OMs</option>
              {sectors.map((sector) => (
                <option key={sector} value={sector}>
                  {sector}
                </option>
              ))}
            </select>
            <select
              aria-label="Filtrar por função"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700"
            >
              <option value="all">Todas as Funcoes</option>
              {roleOptions.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      <Card className="border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 font-semibold text-slate-700">
                  Militar
                </th>
                <th className="py-3 px-4 font-semibold text-slate-700">
                  SARAM
                </th>
                <th className="py-3 px-4 font-semibold text-slate-700">
                  OM/Setor
                </th>
                <th className="py-3 px-4 font-semibold text-slate-700">
                  Funcao
                </th>
                <th className="py-3 px-4 font-semibold text-slate-700">
                  Semestre
                </th>
                <th className="py-3 px-4 font-semibold text-slate-700">
                  Status
                </th>
                <th className="py-3 px-4 font-semibold text-slate-700 text-right">
                  Acoes
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr>
                  <td
                    colSpan={7}
                    className="p-8 text-center text-slate-500 animate-pulse"
                  >
                    Carregando efetivo...
                  </td>
                </tr>
              )}

              {!loading && filteredProfiles.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    Nenhum militar encontrado.
                  </td>
                </tr>
              )}

              {filteredProfiles.map((profile) => {
                const isEditing = editingId === profile.id;
                return (
                  <tr
                    key={profile.id}
                    className="group hover:bg-slate-50 transition-colors"
                  >
                    <td className="py-3 px-4 font-medium text-slate-900">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                          {profile.full_name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold">
                            {profile.rank}{" "}
                            {profile.war_name ?? profile.full_name}
                          </div>
                          <div className="text-xs text-slate-500">
                            {profile.full_name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {profile.saram ?? "—"}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {isEditing ? (
                        <input
                          aria-label="Editar setor"
                          value={draft?.sector ?? ""}
                          onChange={(e) =>
                            updateDraft("sector", e.target.value)
                          }
                          className="w-full rounded border border-slate-200 px-2 py-1"
                        />
                      ) : (
                        (profile.sector ?? "—")
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {isEditing ? (
                        <select
                          aria-label="Editar função"
                          value={draft?.role ?? "user"}
                          onChange={(e) =>
                            updateDraft("role", e.target.value as UserRole)
                          }
                          className="rounded border border-slate-200 px-2 py-1"
                        >
                          {roleOptions.map((role) => (
                            <option key={role.value} value={role.value}>
                              {role.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded bg-slate-100 text-xs font-medium">
                          {
                            roleOptions.find((r) => r.value === profile.role)
                              ?.label
                          }
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {isEditing ? (
                        <select
                          aria-label="Editar semestre"
                          value={draft?.semester ?? "1"}
                          onChange={(e) =>
                            updateDraft(
                              "semester",
                              e.target.value as SemesterType,
                            )
                          }
                          className="rounded border border-slate-200 px-2 py-1"
                        >
                          {semesterOptions.map((semester) => (
                            <option key={semester} value={semester}>
                              {semester}o semestre
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded bg-slate-100 text-xs font-medium">
                          {profile.semester}o semestre
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {isEditing ? (
                        <label className="inline-flex items-center gap-2 text-xs">
                          <input
                            type="checkbox"
                            checked={draft?.active ?? true}
                            onChange={(e) =>
                              updateDraft("active", e.target.checked)
                            }
                          />
                          {draft?.active ? "Ativo" : "Inativo"}
                        </label>
                      ) : profile.active ? (
                        <span className="inline-flex items-center px-2 py-1 rounded bg-green-100 text-xs font-medium text-green-700">
                          Ativo
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded bg-yellow-50 text-xs font-medium text-yellow-700">
                          Inativo
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {isEditing ? (
                          <>
                            <Button
                              variant="success"
                              size="sm"
                              isLoading={savingId === profile.id}
                              onClick={() => handleSave(profile)}
                            >
                              Salvar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={cancelEditing}
                            >
                              Cancelar
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => startEditing(profile)}
                          >
                            Editar
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="bg-slate-50 p-3 border-t border-slate-200 text-xs text-slate-500 text-center">
          Mostrando {filteredProfiles.length} registro(s)
        </div>
      </Card>
    </div>
  );
}

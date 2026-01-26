import AdminRoute from "@/components/Admin/AdminRoute";
import UserEditModal from "@/components/Admin/UserEditModal";
import Button from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import { Body, H1 } from "@/components/ui/Typography";
import { fetchProfiles, updateProfile } from "@/services/admin";
import type { Profile } from "@/types/database.types";
import { Edit2, Search } from "lucide-react"; // REMOVIDO: UserCog
import { useEffect, useMemo, useState } from "react";

export default function AdminUsers() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Profile | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showInactive, setShowInactive] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetchProfiles(showInactive);
        setProfiles((res ?? []) as Profile[]);
      } catch {
        // Silent error
      } finally {
        setLoading(false);
      }
    })();
  }, [showInactive]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return profiles;
    return profiles.filter((p) => {
      return (
        (p.saram ?? "").toLowerCase().includes(q) ||
        (p.full_name ?? "").toLowerCase().includes(q) ||
        (p.email ?? "").toLowerCase().includes(q) ||
        (p.role ?? "").toLowerCase().includes(q)
      );
    });
  }, [profiles, query]);

  function openEdit(p: Profile) {
    setSelected(p);
    setIsOpen(true);
  }

  function onSaved(updated: Profile) {
    setProfiles((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    setIsOpen(false);
  }

  return (
    <AdminRoute>
      <div className="space-y-6 animate-in fade-in duration-500">
        {/* Header e Busca */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <H1>Gestão de Usuários</H1>
            <Body className="text-slate-500 text-sm">
              Gerencie o efetivo, edite dados e ajuste semestres de referência.
            </Body>
          </div>
          <div className="w-full md:w-72 flex items-center gap-3">
            <Input
              placeholder="Buscar por SARAM, Nome ou Email..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              icon={<Search size={16} />}
              className="bg-white"
            />
            <label className="text-sm text-slate-600 flex items-center gap-2">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
              />
              Mostrar inativos
            </label>
          </div>
        </div>

        {/* Tabela em Card */}
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
                    Email
                  </th>
                  <th className="py-3 px-4 font-semibold text-slate-700">
                    Papel
                  </th>
                  <th className="py-3 px-4 font-semibold text-slate-700">
                    Posto/Grad
                  </th>
                  <th className="py-3 px-4 font-semibold text-slate-700">
                    Semestre
                  </th>
                  <th className="py-3 px-4 font-semibold text-slate-700">
                    Status
                  </th>
                  <th className="py-3 px-4 font-semibold text-slate-700 text-right">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading && (
                  <tr>
                    <td
                      colSpan={6}
                      className="p-8 text-center text-slate-500 animate-pulse"
                    >
                      Carregando base de dados...
                    </td>
                  </tr>
                )}

                {!loading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      Nenhum usuário encontrado com os filtros atuais.
                    </td>
                  </tr>
                )}

                {filtered.map((p) => (
                  <tr
                    key={p.id}
                    className="group hover:bg-slate-50 transition-colors"
                  >
                    <td className="py-3 px-4 font-medium text-slate-900">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                          {p.full_name.charAt(0)}
                        </div>
                        {p.full_name}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-mono">
                      {p.saram}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {p.email ?? "—"}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {p.role === "admin" ? (
                        <span className="inline-flex items-center px-2 py-1 rounded bg-red-100 text-xs font-medium text-red-700">
                          Administrador
                        </span>
                      ) : p.role === "coordinator" ? (
                        <span className="inline-flex items-center px-2 py-1 rounded bg-slate-100 text-xs font-medium">
                          Coordenador
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded bg-slate-50 text-xs font-medium">
                          Usuário
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <span className="inline-flex items-center px-2 py-1 rounded bg-slate-100 text-xs font-medium">
                        {p.rank}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {p.active ? (
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
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(p)}
                          className="h-8 w-8 p-0 rounded-full hover:bg-white hover:shadow-sm hover:text-primary"
                          title="Editar Usuário"
                        >
                          <Edit2 size={16} />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            // quick toggle active
                            const res = await updateProfile(p.id, {
                              active: !p.active,
                            });
                            if (res.error) return;
                            setProfiles((prev) =>
                              prev.map((x) =>
                                x.id === p.id ? { ...x, active: !x.active } : x,
                              ),
                            );
                          }}
                          className="h-8 px-3 py-1 rounded"
                        >
                          {p.active ? "Inativar" : "Ativar"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-slate-50 p-3 border-t border-slate-200 text-xs text-slate-500 text-center">
            Mostrando {filtered.length} registro(s)
          </div>
        </Card>

        <UserEditModal
          isOpen={isOpen}
          profile={selected}
          onClose={() => setIsOpen(false)}
          onSaved={onSaved}
        />
      </div>
    </AdminRoute>
  );
}

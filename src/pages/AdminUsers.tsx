import AdminRoute from "@/components/Admin/AdminRoute";
import UserEditModal from "@/components/Admin/UserEditModal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { fetchProfiles } from "@/services/admin";
import type { Profile } from "@/types/database.types";
import { useEffect, useMemo, useState } from "react";

export default function AdminUsers() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Profile | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetchProfiles();
        setProfiles((res ?? []) as Profile[]);
      } catch {
        // ignore for now
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return profiles;
    return profiles.filter((p) => {
      return (
        p.saram.toLowerCase().includes(q) ||
        p.full_name.toLowerCase().includes(q)
      );
    });
  }, [profiles, query]);

  function openEdit(p: Profile) {
    setSelected(p);
    setIsOpen(true);
  }

  function onSaved(updated: Profile) {
    setProfiles((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  }

  return (
    <AdminRoute>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Gestão de Usuários</h2>
          <div className="w-64">
            <Input
              label="Buscar"
              placeholder="Buscar por SARAM ou Nome"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="bg-white rounded shadow-sm p-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-600">
                  <th className="p-2">SARAM</th>
                  <th className="p-2">Posto/Grad</th>
                  <th className="p-2">Nome Completo</th>
                  <th className="p-2">Semestre</th>
                  <th className="p-2">Ações</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-slate-500">
                      Carregando...
                    </td>
                  </tr>
                )}

                {!loading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-slate-500">
                      Nenhum usuário encontrado
                    </td>
                  </tr>
                )}

                {filtered.map((p) => (
                  <tr key={p.id} className="border-t bg-white even:bg-slate-50">
                    <td className="p-2">{p.saram}</td>
                    <td className="p-2">{p.rank}</td>
                    <td className="p-2">{p.full_name}</td>
                    <td className="p-2">{p.semester}</td>
                    <td className="p-2">
                      <Button variant="outline" onClick={() => openEdit(p)}>
                        ✏️ Editar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <UserEditModal
          isOpen={isOpen}
          profile={selected}
          onClose={() => setIsOpen(false)}
          onSaved={(u) => {
            onSaved(u);
            setIsOpen(false);
          }}
        />
      </div>
    </AdminRoute>
  );
}

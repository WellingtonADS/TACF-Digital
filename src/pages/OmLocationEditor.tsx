import Button from "@/components/atomic/Button";
import Input from "@/components/atomic/Input";
import useLocations from "@/hooks/useLocations";
import Layout from "@/layout/Layout";
import { Location } from "@/types/database.types";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

export default function OmLocationEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { locations, create, update, loading, error } = useLocations();

  const isNew = id === "new";
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

  // memoize existing location when navigating to edit page
  const existing = useMemo(() => {
    if (isNew || !id) return null;
    return locations.find((l) => l.id === id) || null;
  }, [isNew, id, locations]);

  useEffect(() => {
    if (existing) {
      // we intentionally sync local state when the existing record is loaded
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

  async function handleSubmit(e: React.FormEvent) {
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

  return (
    <Layout>
      <div className="p-6 max-w-lg mx-auto">
        <h1 className="text-2xl font-semibold mb-4">
          {isNew ? "Nova Organização Militar" : "Editar Unidade"}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Nome</label>
            <Input
              value={data.name}
              onChange={(e) => handleChange("name", e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Endereço</label>
            <Input
              value={data.address}
              onChange={(e) => handleChange("address", e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium">
              Capacidade total simultânea
            </label>
            <Input
              type="number"
              value={data.max_capacity}
              onChange={(e) =>
                handleChange("max_capacity", Number(e.target.value))
              }
              min={0}
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Status</label>
            <select
              className="border rounded px-2 py-1 w-full"
              value={data.status}
              onChange={(e) =>
                handleChange(
                  "status",
                  e.target.value as (typeof data)["status"],
                )
              }
            >
              <option value="active">Ativo</option>
              <option value="maintenance">Manutenção</option>
              <option value="inactive">Inativo</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium">
              Instalações disponíveis (separe por vírgula)
            </label>
            <Input
              value={data.facilities?.join(", ") || ""}
              onChange={(e) =>
                handleChange(
                  "facilities",
                  e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                )
              }
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" variant="primary" disabled={loading}>
              Salvar
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate("/app/om-locations")}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}

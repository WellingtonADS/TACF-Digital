import Button from "@/components/atomic/Button";
import Card from "@/components/atomic/Card";
import Input from "@/components/atomic/Input";
import PageSkeleton from "@/components/PageSkeleton";
import useLocations from "@/hooks/useLocations";
import Layout from "@/layout/Layout";
import { Clock, Edit, MapPin, Plus, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const STATUS_OPTIONS = ["all", "active", "maintenance", "inactive"] as const;

export default function OmLocationManager() {
  const navigate = useNavigate();
  const { locations, total, loading, error, fetch } = useLocations();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<(typeof STATUS_OPTIONS)[number]>("all");
  const [page, setPage] = useState(1);
  const pageSize = 12;

  useEffect(() => {
    fetch({
      search,
      status: statusFilter === "all" ? undefined : statusFilter,
      page,
      limit: pageSize,
    });
  }, [search, statusFilter, page, fetch]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  if (loading) return <PageSkeleton />;

  return (
    <Layout>
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-4">Gestão de Locais e OMs</h1>

        {/* action bar */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Search className="w-5 h-5 text-gray-500" />
            <Input
              placeholder="Buscar organização militar ou localidade..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              className="border rounded px-2 py-1"
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(
                  e.target.value as (typeof STATUS_OPTIONS)[number],
                )
              }
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt === "all"
                    ? "Todos"
                    : opt[0].toUpperCase() + opt.slice(1)}
                </option>
              ))}
            </select>
            <Button onClick={() => navigate("/app/om/new")} variant="primary">
              <Plus className="w-4 h-4 mr-1" />
              Adicionar Nova OM
            </Button>
          </div>
        </div>

        {/* cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {locations.map((loc) => (
            <Card key={loc.id} className="relative">
              <div className="flex justify-between items-start">
                <MapPin className="w-6 h-6 text-gray-700" />
                <span
                  className={`px-2 py-0.5 text-xs rounded-full uppercase font-semibold ${
                    loc.status === "active"
                      ? "bg-green-100 text-green-800"
                      : loc.status === "maintenance"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {loc.status}
                </span>
              </div>

              <h2 className="mt-2 font-semibold text-lg">{loc.name}</h2>
              <p className="text-sm text-gray-600 flex items-center">
                <MapPin className="w-4 h-4 mr-1" /> {loc.address}
              </p>

              <div className="mt-2 text-sm">
                Capacidade total simultânea: <strong>{loc.max_capacity}</strong>
              </div>

              {loc.facilities && loc.facilities.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {loc.facilities.map((f) => (
                    <span
                      key={f}
                      className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-4 flex gap-2">
                <Button
                  onClick={() => navigate(`/app/om/${loc.id}`)}
                  variant="secondary"
                  size="sm"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Editar Unidade
                </Button>
                <Button
                  onClick={() => navigate(`/app/om/${loc.id}/schedules`)}
                  variant="primary"
                  size="sm"
                >
                  <Clock className="w-4 h-4 mr-1" />
                  Gerenciar Horários
                </Button>
              </div>
            </Card>
          ))}

          {/* empty card for create new */}
          <Card
            className="flex items-center justify-center cursor-pointer hover:bg-gray-50"
            onClick={() => navigate("/app/om/new")}
          >
            <div className="text-center text-gray-500">
              <Plus className="w-6 h-6 mx-auto" />
              <span className="block mt-1 text-sm">
                Cadastrar nova Organização Militar
              </span>
            </div>
          </Card>
        </div>

        {/* pagination footer */}
        <div className="mt-6 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Exibindo {locations.length} de {total} Organizações Militares
          </div>
          <div className="flex gap-1">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-2 py-1 border rounded disabled:opacity-50"
            >
              &lt;
            </button>
            <span className="px-2 py-1">{page}</span>
            <button
              disabled={page * pageSize >= total}
              onClick={() => setPage((p) => p + 1)}
              className="px-2 py-1 border rounded disabled:opacity-50"
            >
              &gt;
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}

import StatsCard from "@/components/Admin/StatsCard";
import Button from "@/components/ui/Button";
import { fetchDashboardStats } from "@/services/admin";
import { useEffect, useState } from "react";

export default function AdminDashboard() {
  const [stats, setStats] = useState<{
    totalUsers: number;
    totalScheduled: number;
    pendingSwaps: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetchDashboardStats();
        if (mounted) setStats(res);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return <div>Loading dashboard...</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard title="Usuários" value={stats?.totalUsers ?? 0} />
        <StatsCard title="Agendamentos" value={stats?.totalScheduled ?? 0} />
        <StatsCard title="Trocas pendentes" value={stats?.pendingSwaps ?? 0} />
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-2">Ações rápidas</h2>
        <div className="flex gap-2">
          <a href="/admin/sessions">
            <Button variant="ghost">Gerenciar sessões</Button>
          </a>
          <a href="/admin/swaps">
            <Button variant="ghost">Aprovar trocas</Button>
          </a>
          <a href="/admin/users">
            <Button variant="ghost">Usuários</Button>
          </a>
        </div>
      </div>
    </div>
  );
}

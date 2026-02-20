import useSessions, { type SessionAvailability } from "@/hooks/useSessions";
import { format, parseISO } from "date-fns";
import {
  AlertTriangle,
  BarChart2,
  Calendar,
  CheckCircle,
  Edit2,
  Settings,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../layout/Layout";
import { supabase } from "../services/supabase";

export const AdminDashboard = () => {
  const navigate = useNavigate();

  // metrics
  const [totalInscritos, setTotalInscritos] = useState<number>(0);
  const [aptosMonth, setAptosMonth] = useState<number>(0);
  const [pendencias, setPendencias] = useState<number>(0);

  // sessions table
  const { sessions } = useSessions();

  useEffect(() => {
    async function loadMetrics() {
      // total inscritos (all bookings)
      const { count: totalCount } = await supabase
        .from("bookings")
        .select("id", { count: "exact", head: true });
      setTotalInscritos(totalCount ?? 0);

      // aptos no mês (bookings com score não nulo criados neste mês)
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const { count: aptosCount } = await supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .not("score", "is", null)
        .gte("created_at", firstDay.toISOString())
        .lt("created_at", nextMonth.toISOString());
      setAptosMonth(aptosCount ?? 0);

      // pendências: qualquer booking que não esteja confirmado
      const { count: pendCount } = await supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .neq("status", "confirmed");
      setPendencias(pendCount ?? 0);
    }

    loadMetrics();
  }, []);

  const capacidadeRestante = useMemo(() => {
    if (!sessions) return 0;
    return sessions.reduce((sum, s) => sum + (s.available_count ?? 0), 0);
  }, [sessions]);

  // helper to format percentage bars
  const renderOccupancyBar = (session: SessionAvailability) => {
    const occupied = session.occupied_count;
    const max = session.max_capacity;
    const percent = max ? Math.round((occupied / max) * 100) : 0;
    return (
      <div className="w-48">
        <div className="flex justify-between text-[10px] mb-1 font-bold text-primary">
          <span>
            {occupied}/{max}
          </span>
          <span>{percent}%</span>
        </div>
        <div className="w-full bg-slate-100 dark:bg-slate-900 rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <Layout>
      {/* header */}
      <header className="flex justify-between items-center mb-10">
        <div>
          <h2 className="text-3xl font-bold text-primary dark:text-white">
            Dashboard Administrativo
          </h2>
          <p className="text-slate-500 mt-1">
            Bem-vindo ao centro de controle TACF‑Digital.
          </p>
        </div>
        <button
          onClick={() => navigate("/app/usuario")}
          className="p-2 bg-white dark:bg-slate-800 rounded-full shadow-sm text-slate-400 hover:text-primary transition-colors"
        >
          <BarChart2 size={20} />
        </button>
      </header>

      {/* stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {/* Total inscritos */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-xl flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-sm font-medium mb-1">
              Total Inscritos
            </p>
            <h3 className="text-3xl font-bold text-slate-800 dark:text-white">
              {totalInscritos}
            </h3>
          </div>
          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
            <Users className="text-3xl" />
          </div>
        </div>

        {/* Aptos mês */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-xl flex items-center justify-between border-b-4 border-military-green/30">
          <div>
            <p className="text-slate-400 text-sm font-medium mb-1">
              Aptos (Mês)
            </p>
            <h3 className="text-3xl font-bold text-slate-800 dark:text-white">
              {aptosMonth}
            </h3>
          </div>
          <div className="w-14 h-14 bg-military-green/10 rounded-2xl flex items-center justify-center text-military-green">
            <CheckCircle className="text-3xl" />
          </div>
        </div>

        {/* Pendências */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-xl flex items-center justify-between border-b-4 border-military-gold/30">
          <div>
            <p className="text-slate-400 text-sm font-medium mb-1">
              Pendências
            </p>
            <h3 className="text-3xl font-bold text-slate-800 dark:text-white">
              {pendencias}
            </h3>
          </div>
          <div className="w-14 h-14 bg-military-gold/10 rounded-2xl flex items-center justify-center text-military-gold">
            <AlertTriangle className="text-3xl" />
          </div>
        </div>

        {/* Capacidade restante */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-xl flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-sm font-medium mb-1">
              Capacidade Restante
            </p>
            <h3 className="text-3xl font-bold text-slate-800 dark:text-white">
              {capacidadeRestante}
            </h3>
          </div>
          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
            <BarChart2 className="text-3xl" />
          </div>
        </div>
      </div>

      {/* sessions table */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl overflow-hidden border border-slate-100 dark:border-slate-700">
        <div className="p-8 border-b border-slate-50 dark:border-slate-700 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-primary dark:text-white">
              Gerenciamento de Turmas
            </h3>
            <p className="text-slate-400 text-sm mt-1">
              Próximas sessões de avaliação física agendadas.
            </p>
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <input
                className="pl-10 pr-4 py-2 bg-background-light dark:bg-slate-900 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 w-64"
                placeholder="Buscar turma..."
                type="text"
              />
              <span className="material-icons-round absolute left-3 top-2 text-slate-400 text-xl">
                search
              </span>
            </div>
            <button className="p-2 bg-background-light dark:bg-slate-900 rounded-xl text-slate-500 hover:bg-slate-200 transition-colors">
              <span className="material-icons-round">filter_list</span>
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-900/50">
              <tr>
                <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Turma
                </th>
                <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Local
                </th>
                <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Ocupação
                </th>
                <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {sessions &&
                sessions.map((s) => {
                  const statusLabel =
                    (s.available_count ?? 0) > 0 ? "ABERTA" : "FECHADA";
                  const statusColor =
                    (s.available_count ?? 0) > 0
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800"
                      : "bg-slate-100 text-slate-500 dark:bg-slate-900 dark:text-slate-400 border-slate-200 dark:border-slate-700";
                  return (
                    <tr
                      key={s.session_id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors"
                    >
                      <td className="px-8 py-6">
                        <div className="font-bold text-slate-700 dark:text-slate-200">
                          {s.session_id.slice(0, 8).toUpperCase()}
                        </div>
                        <div className="text-xs text-slate-400">--</div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                          <Calendar className="text-lg" />
                          <span className="text-sm font-medium">
                            {format(parseISO(s.date), "dd MMM yyyy")}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="text-sm font-medium text-slate-600 dark:text-slate-400">
                          --
                        </div>
                      </td>
                      <td className="px-8 py-6">{renderOccupancyBar(s)}</td>
                      <td className="px-8 py-6">
                        <span
                          className={`px-3 py-1 text-xs font-bold rounded-full border ${statusColor}`}
                        >
                          {statusLabel}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => navigate("/app/agendamentos")}
                            className="p-2 text-slate-400 hover:text-primary transition-colors"
                          >
                            <Edit2 />
                          </button>
                          <button
                            onClick={() => navigate("/app/agendamentos")}
                            className="p-2 text-slate-400 hover:text-primary transition-colors"
                          >
                            <Settings />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
        <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center text-sm">
          <p className="text-slate-500">
            Mostrando {sessions?.length ?? 0} de {sessions?.length ?? 0} turmas
          </p>
          <div className="flex gap-1">
            <button className="w-8 h-8 rounded flex items-center justify-center bg-white dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50">
              <span className="material-icons-round text-sm">chevron_left</span>
            </button>
            <button className="w-8 h-8 rounded flex items-center justify-center bg-primary text-white border border-primary">
              1
            </button>
            <button className="w-8 h-8 rounded flex items-center justify-center bg-white dark:bg-slate-800 text-slate-600 border border-slate-200 dark:border-slate-700 hover:bg-slate-50">
              2
            </button>
            <button className="w-8 h-8 rounded flex items-center justify-center bg-white dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50">
              <span className="material-icons-round text-sm">
                chevron_right
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* floating action button */}
      <div className="fixed bottom-10 right-10">
        <button
          onClick={() => navigate("/app/turmas/nova")}
          className="group flex items-center gap-3 bg-primary hover:bg-slate-800 text-white px-6 py-4 rounded-full shadow-2xl transition-all hover:scale-105 active:scale-95"
        >
          <span className="material-icons-round">add</span>
          <span className="font-bold text-sm tracking-wide">
            CRIAR NOVA TURMA
          </span>
        </button>
      </div>
    </Layout>
  );
};

export default AdminDashboard;

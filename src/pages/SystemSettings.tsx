import Button from "@/components/atomic/Button";
import useAuth from "@/hooks/useAuth";
import Layout from "@/layout/Layout";
import supabase from "@/services/supabase";
import type { Database } from "@/types/database.types";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type SystemSettingsRow = Database["public"]["Tables"]["system_settings"]["Row"];
type AuditLogRow = Database["public"]["Tables"]["audit_logs"]["Row"];

const TABS = [
  { key: "general", label: "Geral", icon: "settings" },
  { key: "evaluation", label: "Tabelas de Avaliação", icon: "analytics" },
  { key: "locations", label: "Locais / OM", icon: "location_on" },
  { key: "profiles", label: "Perfis de Acesso", icon: "verified_user" },
  { key: "audit", label: "Logs de Auditoria", icon: "history" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function SystemSettings() {
  const { profile, loading: authLoading } = useAuth();
  const canView = profile?.role === "admin";
  const [activeTab, setActiveTab] = useState<TabKey>("evaluation");
  const [settings, setSettings] = useState<SystemSettingsRow | null>(null);
  const [loading, setLoading] = useState(false);

  const [auditLogs, setAuditLogs] = useState<AuditLogRow[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);

  // local form state for "general" tab
  const [formState, setFormState] = useState<Partial<SystemSettingsRow>>({});

  useEffect(() => {
    if (!canView) return;
    async function load() {
      setLoading(true);
      const { data, error } = await supabase
        .from("system_settings")
        .select("*")
        .limit(1)
        .single();
      if (error) {
        console.error(error);
        toast.error("Falha ao carregar configurações");
      } else {
        setSettings(data);
        setFormState(data ?? {});
      }
      setLoading(false);
    }
    load();
  }, [canView]);

  useEffect(() => {
    if (activeTab === "audit" && canView) {
      const loadLogs = async () => {
        setAuditLoading(true);
        const { data, error } =
          await supabase.rpc<AuditLogRow[]>("get_audit_logs");
        if (error) {
          console.error(error);
          toast.error("Erro ao carregar logs de auditoria");
        } else {
          setAuditLogs(data ?? []);
        }
        setAuditLoading(false);
      };

      loadLogs();
    }
  }, [activeTab, canView]);

  async function saveGeneral() {
    if (!settings) return;
    setLoading(true);
    const { error } = await supabase
      .from("system_settings")
      .update(formState)
      .eq("id", settings.id);
    if (error) {
      console.error(error);
      toast.error("Falha ao salvar configurações");
    } else {
      toast.success("Configurações salvas");
      // reload
      const { data } = await supabase
        .from("system_settings")
        .select("*")
        .limit(1)
        .single();
      setSettings(data);
      setFormState(data ?? {});
    }
    setLoading(false);
  }

  function renderContent() {
    if (loading && activeTab === "general") {
      return <p>Carregando...</p>;
    }

    switch (activeTab) {
      case "general":
        return (
          <div>
            <h2 className="text-lg font-bold mb-4">Parâmetros Globais</h2>
            <div className="space-y-4 max-w-xl">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Nome do Sistema
                </label>
                <input
                  type="text"
                  className="w-full border rounded px-3 py-2"
                  value={formState.system_name ?? ""}
                  onChange={(e) =>
                    setFormState((s) => ({ ...s, system_name: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Organização
                </label>
                <input
                  type="text"
                  className="w-full border rounded px-3 py-2"
                  value={formState.organization_name ?? ""}
                  onChange={(e) =>
                    setFormState((s) => ({
                      ...s,
                      organization_name: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Capacidade mínima
                  </label>
                  <input
                    type="number"
                    className="w-full border rounded px-3 py-2"
                    value={formState.min_capacity ?? 0}
                    onChange={(e) =>
                      setFormState((s) => ({
                        ...s,
                        min_capacity: Number(e.target.value),
                      }))
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Capacidade máxima
                  </label>
                  <input
                    type="number"
                    className="w-full border rounded px-3 py-2"
                    value={formState.max_capacity ?? 0}
                    onChange={(e) =>
                      setFormState((s) => ({
                        ...s,
                        max_capacity: Number(e.target.value),
                      }))
                    }
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="allow_swaps"
                  type="checkbox"
                  checked={Boolean(formState.allow_swaps)}
                  onChange={(e) =>
                    setFormState((s) => ({
                      ...s,
                      allow_swaps: e.target.checked,
                    }))
                  }
                />
                <label htmlFor="allow_swaps" className="text-sm">
                  Permitir trocas
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="require_quorum"
                  type="checkbox"
                  checked={Boolean(formState.require_quorum)}
                  onChange={(e) =>
                    setFormState((s) => ({
                      ...s,
                      require_quorum: e.target.checked,
                    }))
                  }
                />
                <label htmlFor="require_quorum" className="text-sm">
                  Exigir quórum
                </label>
              </div>
              <div>
                <button
                  onClick={saveGeneral}
                  className="px-4 py-2 bg-primary text-white rounded"
                  disabled={loading}
                  type="button"
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        );
      case "evaluation":
        return (
          <div>
            <div className="flex justify-between items-end mb-6 border-b border-slate-100 dark:border-slate-800">
              <div className="flex gap-8">
                <button className="pb-4 text-sm font-bold tab-active">
                  Masculino
                </button>
                <button className="pb-4 text-sm font-medium text-slate-400 hover:text-primary transition-colors">
                  Feminino
                </button>
              </div>
              <div className="pb-4">
                <button className="flex items-center text-primary text-sm font-semibold hover:underline">
                  <span className="material-icons text-base mr-1">
                    file_download
                  </span>
                  Exportar PDF
                </button>
              </div>
            </div>
            <p className="text-slate-500 text-sm mb-6">
              Defina os requisitos mínimos de desempenho para cada categoria
              etária.
            </p>
            <div className="overflow-hidden border border-slate-200 dark:border-slate-700 rounded-xl mb-10">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-primary text-white">
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">
                      Idade
                    </th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-center">
                      Corrida (Min)
                    </th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-center">
                      Flexão (Rep)
                    </th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-center">
                      Abdominal (Rep)
                    </th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">
                      Conceito
                    </th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-right">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {/* sample rows, real data would come from API */}
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">
                      Até 24 anos
                    </td>
                    <td className="px-6 py-4 text-center">12:00</td>
                    <td className="px-6 py-4 text-center">30</td>
                    <td className="px-6 py-4 text-center">35</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold rounded">
                        EXCELENTE
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 text-slate-400 hover:text-primary transition-colors">
                        <span className="material-icons text-xl">edit</span>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        );
      case "locations":
        return (
          <div className="py-6">
            <p className="mb-4">
              A gestão de Locais / Organizações Militares foi movida para uma
              página dedicada. Utilize o botão abaixo para acessar a ferramenta
              completa.
            </p>
            <Button
              variant="primary"
              onClick={() => window.location.assign("/app/om-locations")}
            >
              Ir para Gestão de Locais e OMs
            </Button>
          </div>
        );
      case "profiles":
        return <p>Perfis de Acesso (em breve)</p>;
      case "audit":
        return (
          <div>
            <h2 className="text-lg font-bold mb-4">Logs de Auditoria</h2>
            {auditLoading ? (
              <p>Carregando...</p>
            ) : (
              <div className="overflow-auto max-h-[400px]">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-primary text-white">
                      <th className="px-4 py-2 text-xs font-bold uppercase">
                        Ação
                      </th>
                      <th className="px-4 py-2 text-xs font-bold uppercase">
                        Entidade
                      </th>
                      <th className="px-4 py-2 text-xs font-bold uppercase">
                        Usuário
                      </th>
                      <th className="px-4 py-2 text-xs font-bold uppercase">
                        Horário
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {auditLogs.map((log) => (
                      <tr
                        key={log.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <td className="px-4 py-2 text-sm">{log.action}</td>
                        <td className="px-4 py-2 text-sm">{log.entity}</td>
                        <td className="px-4 py-2 text-sm">{log.user_name}</td>
                        <td className="px-4 py-2 text-sm">
                          {new Date(log.created_at ?? "").toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  }

  if (authLoading) {
    return <div className="p-6">Carregando...</div>;
  }

  if (!canView) {
    return (
      <Layout>
        <p className="p-6 text-red-500">Acesso não autorizado.</p>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-[1440px] mx-auto p-4 lg:p-10">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Configurações do Sistema
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Gerenciamento de parâmetros globais do TACF-Digital (FAB)
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-icons">account_circle</span>
            </div>
          </div>
        </header>

        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden flex min-h-[800px]">
          <aside className="w-72 border-r border-slate-100 dark:border-slate-800 flex flex-col py-8">
            <nav className="flex-1 space-y-1">
              {TABS.map((tab) => {
                const active = tab.key === activeTab;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center w-full px-8 py-4 transition-colors text-left ${
                      active
                        ? "sidebar-active bg-primary/5"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    <span className="material-icons mr-3 text-sm">
                      {tab.icon}
                    </span>
                    <span className={active ? "font-bold" : "font-medium"}>
                      {tab.label}
                    </span>
                  </button>
                );
              })}
            </nav>
            <div className="px-8 mt-auto pt-8 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                Sistema Operacional
              </div>
            </div>
          </aside>

          <main className="flex-1 flex flex-col bg-white dark:bg-slate-900">
            <div className="p-8 flex-1">{renderContent()}</div>
          </main>
        </div>
      </div>
    </Layout>
  );
}

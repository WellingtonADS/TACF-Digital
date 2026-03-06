import Button from "@/components/atomic/Button";
import useAuth from "@/hooks/useAuth";
import Layout from "@/layout/Layout";
import supabase from "@/services/supabase";
import type {
  AuditLogRow as DBAuditLogRow,
  SystemSettingsRow as DBSystemSettingsRow,
} from "@/types";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

type SystemSettingsRow = DBSystemSettingsRow;
type AuditLogRow = DBAuditLogRow;

const TABS = [
  { key: "general", label: "Geral", icon: "settings" },
  { key: "evaluation", label: "Tabelas de Avaliação", icon: "analytics" },
  { key: "locations", label: "Locais / OM", icon: "location_on" },
  { key: "profiles", label: "Perfis de Acesso", icon: "verified_user" },
  { key: "audit", label: "Logs de Auditoria", icon: "history" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function SystemSettings() {
  const navigate = useNavigate();
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
        const { data, error } = await supabase.rpc("get_audit_logs");
        if (error) {
          console.error(error);
          toast.error("Erro ao carregar logs de auditoria");
        } else {
          setAuditLogs((data as AuditLogRow[] | null) ?? []);
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-end mb-6 border-b border-slate-100 dark:border-slate-800">
              <div className="flex flex-wrap gap-4 sm:gap-8">
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
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl mb-10">
              <div className="space-y-2 p-3 md:hidden">
                <article className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
                  <p className="text-sm font-semibold text-slate-800 dark:text-white">
                    Até 24 anos
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-500">
                    <p>Corrida: 12:00</p>
                    <p>Flexão: 30</p>
                    <p>Abdominal: 35</p>
                    <p>Conceito: EXCELENTE</p>
                  </div>
                </article>
              </div>

              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[480px] text-left border-collapse">
                  <thead>
                    <tr className="bg-primary text-white">
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-xs font-bold uppercase tracking-wider">
                        Idade
                      </th>
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-xs font-bold uppercase tracking-wider text-center">
                        Corrida (Min)
                      </th>
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-xs font-bold uppercase tracking-wider text-center">
                        Flexão (Rep)
                      </th>
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-xs font-bold uppercase tracking-wider text-center">
                        Abdominal (Rep)
                      </th>
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-xs font-bold uppercase tracking-wider">
                        Conceito
                      </th>
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-xs font-bold uppercase tracking-wider text-right">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {/* sample rows, real data would come from API */}
                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-3 sm:px-6 py-3 sm:py-4 font-semibold text-slate-700 dark:text-slate-300">
                        Até 24 anos
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-center">
                        12:00
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-center">
                        30
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-center">
                        35
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4">
                        <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold rounded">
                          EXCELENTE
                        </span>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-right">
                        <button className="p-2 text-slate-400 hover:text-primary transition-colors">
                          <span className="material-icons text-xl">edit</span>
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
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
        return (
          <div className="py-6">
            <p className="mb-4">
              A gestão de Perfis de Acesso agora possui tela dedicada.
            </p>
            <Button
              variant="primary"
              onClick={() => navigate("/app/configuracoes/perfis")}
            >
              Ir para Gestão de Perfis de Acesso
            </Button>
          </div>
        );
      case "audit":
        return (
          <div>
            <h2 className="text-lg font-bold mb-4">Logs de Auditoria</h2>
            {auditLoading ? (
              <p>Carregando...</p>
            ) : (
              <div className="max-h-[400px] overflow-auto">
                <div className="space-y-2 p-3 md:hidden">
                  {auditLogs.map((log) => (
                    <article
                      key={log.id}
                      className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900"
                    >
                      <p className="text-xs font-bold uppercase text-slate-400">
                        {log.action}
                      </p>
                      <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                        Entidade: {log.entity}
                      </p>
                      <p className="text-sm text-slate-700 dark:text-slate-300">
                        Usuário: {log.user_name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {new Date(log.created_at ?? "").toLocaleString()}
                      </p>
                    </article>
                  ))}
                </div>

                <div className="hidden md:block">
                  <table className="w-full min-w-[640px] text-left border-collapse">
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
      <div className="w-full max-w-[1440px] mx-auto space-y-6">
        <header className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-sm p-4 sm:p-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold tracking-widest text-primary uppercase">
              Governança e Segurança
            </p>
            <h1 className="mt-1 text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white leading-tight">
              Configurações do Sistema
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">
              Ajuste parâmetros globais, perfis e auditoria de forma
              centralizada.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                Perfil Atual
              </span>
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                {profile?.full_name ?? "Administrador"}
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-icons text-2xl">account_circle</span>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-[280px_minmax(0,1fr)] gap-6">
          <aside className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-lg shadow-slate-200/40 dark:shadow-none">
            <div className="p-4 sm:p-6 space-y-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                  Seções
                </p>
                <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  ADMIN
                </span>
              </div>
              <nav className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-1">
                {TABS.map((tab) => {
                  const active = tab.key === activeTab;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setActiveTab(tab.key)}
                      aria-current={active ? "page" : undefined}
                      className={`w-full flex items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-semibold focus-ring ${
                        active
                          ? "bg-primary text-white border-primary shadow-lg shadow-primary/25"
                          : "bg-slate-50 dark:bg-slate-800 border-transparent text-slate-600 dark:text-slate-300 hover:bg-primary/5"
                      }`}
                    >
                      <span className="material-icons text-base">
                        {tab.icon}
                      </span>
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
              <div className="hidden md:flex items-center gap-3 text-xs text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-4">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                Sistema Operacional
              </div>
            </div>
          </aside>

          <section className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 min-h-[480px]">
            <div className="p-4 sm:p-6 lg:p-8">{renderContent()}</div>
          </section>
        </div>
      </div>
    </Layout>
  );
}

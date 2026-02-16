import { Body, H1, H2 } from "@/components/ui/Typography";
import { useAuth } from "@/contexts/AuthContext";
import {
  Analytics,
  History,
  LocationOn,
  Settings,
  VerifiedUser,
} from "@mui/icons-material";
import { useState } from "react";
import { toast } from "sonner";

type SettingsTab = "general" | "taf_tables" | "locations" | "access" | "audit";

export default function SystemSettings() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Configurações simuladas (em produção viriam do Supabase)
  const [settings, setSettings] = useState({
    minCapacity: 8,
    maxCapacity: 21,
    defaultPeriods: ["morning", "afternoon"],
    allowSwaps: true,
    requireQuorum: true,
    systemName: "TACF Digital",
    organizationName: "Força Aérea Brasileira",
  });

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const res = await fetchSystemSettings();
      if (!mounted) return;
      if (res.error) {
        toast.error("Falha ao carregar configuracoes");
      } else if (res.data) {
        setSettings({
          minCapacity: res.data.min_capacity,
          maxCapacity: res.data.max_capacity,
          defaultPeriods: res.data.default_periods,
          allowSwaps: res.data.allow_swaps,
          requireQuorum: res.data.require_quorum,
          systemName: res.data.system_name,
          organizationName: res.data.organization_name,
        });
      }
      setLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const handleSaveSettings = async () => {
    setSaving(true);
    const res = await saveSystemSettings({
      is_global: true,
      system_name: settings.systemName,
      organization_name: settings.organizationName,
      min_capacity: settings.minCapacity,
      max_capacity: settings.maxCapacity,
      default_periods: settings.defaultPeriods,
      allow_swaps: settings.allowSwaps,
      require_quorum: settings.requireQuorum,
    });

    if (res.error) {
      toast.error("Erro ao salvar configuracoes");
    } else {
      toast.success("Configuracoes salvas com sucesso");
    }
    setSaving(false);
  };

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

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-[1440px] mx-auto p-4 lg:p-10">
        {/* Header */}
        <header className="mb-8 flex justify-between items-center">
          <div>
            <H1 className="text-3xl font-bold text-slate-900">
              Configurações do Sistema
            </H1>
            <Body className="text-slate-500 mt-1">
              Gerenciamento de parâmetros globais do TACF-Digital (FAB)
            </Body>
          </div>
        </header>

        {/* Main Card Container */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden flex min-h-[800px]">
          {/* Sidebar Navigation */}
          <aside className="w-72 border-r border-slate-100 flex flex-col py-8">
            <nav className="flex-1 space-y-1">
              <button
                onClick={() => setActiveTab("general")}
                className={`flex items-center px-8 py-4 w-full text-left transition-colors ${
                  activeTab === "general"
                    ? "bg-primary/5 border-r-4 border-primary text-primary font-bold"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
                type="button"
              >
                <Settings className="mr-3 text-sm" />
                <span>Geral</span>
              </button>

              <button
                onClick={() => setActiveTab("taf_tables")}
                className={`flex items-center px-8 py-4 w-full text-left transition-colors ${
                  activeTab === "taf_tables"
                    ? "bg-primary/5 border-r-4 border-primary text-primary font-bold"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
                type="button"
              >
                <Analytics className="mr-3 text-sm" />
                <span>Parâmetros TAF</span>
              </button>

              <button
                onClick={() => setActiveTab("locations")}
                className={`flex items-center px-8 py-4 w-full text-left transition-colors ${
                  activeTab === "locations"
                    ? "bg-primary/5 border-r-4 border-primary text-primary font-bold"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
                type="button"
              >
                <LocationOn className="mr-3 text-sm" />
                <span>Locais / OM</span>
              </button>

              <button
                onClick={() => setActiveTab("access")}
                className={`flex items-center px-8 py-4 w-full text-left transition-colors ${
                  activeTab === "access"
                    ? "bg-primary/5 border-r-4 border-primary text-primary font-bold"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
                type="button"
              >
                <VerifiedUser className="mr-3 text-sm" />
                <span>Perfis de Acesso</span>
              </button>

              <button
                onClick={() => setActiveTab("audit")}
                className={`flex items-center px-8 py-4 w-full text-left transition-colors ${
                  activeTab === "audit"
                    ? "bg-primary/5 border-r-4 border-primary text-primary font-bold"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
                type="button"
              >
                <History className="mr-3 text-sm" />
                <span>Logs de Auditoria</span>
              </button>
            </nav>

            <div className="px-8 mt-auto pt-8 border-t border-slate-100">
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                Sistema Operacional
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 flex flex-col bg-white">
            <div className="p-8 flex-1">
              {loading && (
                <div className="text-center text-slate-500 animate-pulse">
                  Carregando configuracoes...
                </div>
              )}

              {!loading && (
                <>
                  {activeTab === "general" && (
                    <div className="space-y-6">
                      <div>
                        <H2 className="text-2xl font-bold text-slate-900">
                          Configurações Gerais
                        </H2>
                        <Body className="text-slate-500 mt-1">
                          Informações básicas do sistema
                        </Body>
                      </div>

                      <div className="bg-slate-50 rounded-xl p-6 space-y-4">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Nome do Sistema
                          </label>
                          <input
                            type="text"
                            value={settings.systemName}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                systemName: e.target.value,
                              })
                            }
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Organização
                          </label>
                          <input
                            type="text"
                            value={settings.organizationName}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                organizationName: e.target.value,
                              })
                            }
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "taf_tables" && (
                    <div className="space-y-6">
                      <div>
                        <H2 className="text-2xl font-bold text-slate-900">
                          Parâmetros do TAF
                        </H2>
                        <Body className="text-slate-500 mt-1">
                          Configurações de capacidade e regras de agendamento
                        </Body>
                      </div>

                      <div className="bg-slate-50 rounded-xl p-6 space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                              Capacidade Mínima
                            </label>
                            <input
                              type="number"
                              min="1"
                              max="21"
                              value={settings.minCapacity}
                              onChange={(e) =>
                                setSettings({
                                  ...settings,
                                  minCapacity: parseInt(e.target.value),
                                })
                              }
                              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                            />
                            <Body className="text-xs text-slate-500 mt-1">
                              Mínimo de participantes por sessão
                            </Body>
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                              Capacidade Máxima
                            </label>
                            <input
                              type="number"
                              min="8"
                              max="21"
                              value={settings.maxCapacity}
                              onChange={(e) =>
                                setSettings({
                                  ...settings,
                                  maxCapacity: parseInt(e.target.value),
                                })
                              }
                              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                            />
                            <Body className="text-xs text-slate-500 mt-1">
                              Máximo de participantes por sessão
                            </Body>
                          </div>
                        </div>

                        <div className="border-t border-slate-200 pt-6">
                          <H2 className="text-lg font-semibold mb-4">
                            Regras de Agendamento
                          </H2>

                          <div className="space-y-3">
                            <label className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={settings.allowSwaps}
                                onChange={(e) =>
                                  setSettings({
                                    ...settings,
                                    allowSwaps: e.target.checked,
                                  })
                                }
                                className="w-5 h-5 text-primary rounded focus:ring-2 focus:ring-primary"
                              />
                              <div>
                                <Body className="font-medium">
                                  Permitir solicitações de troca
                                </Body>
                                <Body className="text-xs text-slate-500">
                                  Usuários podem solicitar mudança de data/turno
                                </Body>
                              </div>
                            </label>

                            <label className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={settings.requireQuorum}
                                onChange={(e) =>
                                  setSettings({
                                    ...settings,
                                    requireQuorum: e.target.checked,
                                  })
                                }
                                className="w-5 h-5 text-primary rounded focus:ring-2 focus:ring-primary"
                              />
                              <div>
                                <Body className="font-medium">
                                  Exigir quórum mínimo
                                </Body>
                                <Body className="text-xs text-slate-500">
                                  Sessões só ocorrem se atingir capacidade
                                  mínima
                                </Body>
                              </div>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "locations" && (
                    <div className="space-y-6">
                      <div>
                        <H2 className="text-2xl font-bold text-slate-900">
                          Locais e Organizações Militares
                        </H2>
                        <Body className="text-slate-500 mt-1">
                          Cadastro e gerenciamento de locais de aplicação
                        </Body>
                      </div>

                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                        <Body className="text-amber-800 font-medium">
                          ⚠️ Esta funcionalidade requer criação de tabela
                          <code className="ml-1 px-2 py-0.5 bg-amber-100 rounded text-xs">
                            locations
                          </code>{" "}
                          no banco de dados.
                        </Body>
                        <Body className="text-sm text-amber-700 mt-2">
                          Solicite ao coordenador técnico a criação da migration
                          correspondente.
                        </Body>
                      </div>
                    </div>
                  )}

                  {activeTab === "access" && (
                    <div className="space-y-6">
                      <div>
                        <H2 className="text-2xl font-bold text-slate-900">
                          Perfis de Acesso
                        </H2>
                        <Body className="text-slate-500 mt-1">
                          Gestão de permissões por perfil de usuário
                        </Body>
                      </div>

                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                        <Body className="text-blue-800 font-medium">
                          💡 Para gerenciamento completo de perfis de acesso,
                          utilize a página dedicada:{" "}
                          <a
                            href="/admin/access-profiles"
                            className="underline font-bold"
                          >
                            Gestão de Perfis de Acesso
                          </a>
                        </Body>
                      </div>

                      <div className="bg-slate-50 rounded-xl p-6">
                        <H2 className="text-lg font-semibold mb-4">
                          Perfis Existentes
                        </H2>
                        <dl className="space-y-3">
                          <div className="flex items-center justify-between py-2 border-b border-slate-200">
                            <div>
                              <dt className="font-semibold text-slate-900">
                                Admin
                              </dt>
                              <dd className="text-sm text-slate-500">
                                Acesso total ao sistema
                              </dd>
                            </div>
                            <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full">
                              Ativo
                            </span>
                          </div>
                          <div className="flex items-center justify-between py-2 border-b border-slate-200">
                            <div>
                              <dt className="font-semibold text-slate-900">
                                Coordinator
                              </dt>
                              <dd className="text-sm text-slate-500">
                                Gestão de sessões e usuários
                              </dd>
                            </div>
                            <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full">
                              Ativo
                            </span>
                          </div>
                          <div className="flex items-center justify-between py-2">
                            <div>
                              <dt className="font-semibold text-slate-900">
                                User
                              </dt>
                              <dd className="text-sm text-slate-500">
                                Acesso básico para agendamentos
                              </dd>
                            </div>
                            <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full">
                              Ativo
                            </span>
                          </div>
                        </dl>
                      </div>
                    </div>
                  )}

                  {activeTab === "audit" && (
                    <div className="space-y-6">
                      <div>
                        <H2 className="text-2xl font-bold text-slate-900">
                          Logs de Auditoria
                        </H2>
                        <Body className="text-slate-500 mt-1">
                          Histórico de ações administrativas
                        </Body>
                      </div>

                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                        <Body className="text-blue-800 font-medium">
                          Para visualizar o histórico completo, acesse a página
                          dedicada:{" "}
                          <a
                            href="/admin/audit-logs"
                            className="underline font-bold"
                          >
                            Logs de Auditoria
                          </a>
                        </Body>
                      </div>
                    </div>
                  )}

                  {/* Save Button */}
                  {(activeTab === "general" || activeTab === "taf_tables") && (
                    <div className="border-t border-slate-200 pt-6 mt-8 flex justify-end">
                      <button
                        onClick={handleSaveSettings}
                        disabled={saving}
                        className="px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors"
                        type="button"
                      >
                        {saving ? "Salvando..." : "Salvar Configuracoes"}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

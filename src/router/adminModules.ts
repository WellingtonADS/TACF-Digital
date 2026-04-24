import type { SidebarIconKey } from "@/types";

export type AdminModuleDefinition = {
  path: string;
  label: string;
  description: string;
  sidebarIcon: SidebarIconKey;
};

export const ADMIN_MODULE_DEFINITIONS: AdminModuleDefinition[] = [
  {
    path: "/app/admin",
    label: "Visao Geral",
    description:
      "Dashboard executivo com indicadores e pendencias operacionais.",
    sidebarIcon: "layout-dashboard",
  },
  {
    path: "/app/turmas",
    label: "Hub de Sessoes",
    description: "Gestao de sessoes, lancamentos e operacao do ciclo TACF.",
    sidebarIcon: "users",
  },
  {
    path: "/app/efetivo",
    label: "Gerenciar Efetivo",
    description: "Consulta e manutencao do cadastro operacional do efetivo.",
    sidebarIcon: "users",
  },
  {
    path: "/app/analytics",
    label: "Relatorios",
    description: "Acesso aos paineis consolidados de analise e acompanhamento.",
    sidebarIcon: "bar-chart-2",
  },
  {
    path: "/app/configuracoes",
    label: "Configuracoes",
    description:
      "Parametros globais, perfis administrativos e cadastros mestres.",
    sidebarIcon: "settings",
  },
  {
    path: "/app/auditoria",
    label: "Auditoria de acesso",
    description: "Consulta de logs sensiveis e rastreabilidade administrativa.",
    sidebarIcon: "shield",
  },
];

export const ADMIN_MODULE_PATHS = ADMIN_MODULE_DEFINITIONS.map(
  (module) => module.path,
);

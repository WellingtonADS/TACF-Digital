export type AdminMenuCase = {
  menuLabel: string;
  path: string;
  pageMarker: string;
};

export const ADMIN_MENU_CASES: AdminMenuCase[] = [
  {
    menuLabel: "Visão Geral",
    path: "/app/admin",
    pageMarker: "Dashboard Administrativo",
  },
  {
    menuLabel: "Gerenciar Turmas",
    path: "/app/turmas",
    pageMarker: "Gerenciar Turmas",
  },
  {
    menuLabel: "Efetivo",
    path: "/app/efetivo",
    pageMarker: "Gestão de Efetivo",
  },
  {
    menuLabel: "OMs / Locais",
    path: "/app/om-locations",
    pageMarker: "Gestão de OMs e Locais",
  },
  {
    menuLabel: "Reagendamentos",
    path: "/app/reagendamentos",
    pageMarker: "Gestão de Solicitações de Reagendamento",
  },
  {
    menuLabel: "Lançar Índices",
    path: "/app/lancamento-indices",
    pageMarker: "Lançamento de Índices",
  },
  {
    menuLabel: "Relatórios",
    path: "/app/analytics",
    pageMarker: "Relatorios Consolidados",
  },
  {
    menuLabel: "Configurações",
    path: "/app/configuracoes",
    pageMarker: "Configurações do Sistema",
  },
  {
    menuLabel: "Logs de Auditoria",
    path: "/app/auditoria",
    pageMarker: "Log de Auditoria",
  },
];

export const ADMIN_DIRECT_ROUTE_SMOKE = [
  "/app/turmas/nova",
  "/app/turmas/00000000-0000-0000-0000-000000000001/editar",
  "/app/turmas/00000000-0000-0000-0000-000000000001/agendamentos",
  "/app/reagendamentos/notificacao",
  "/app/configuracoes/perfis",
  "/app/efetivo/00000000-0000-0000-0000-000000000002/editar",
  "/app/om/00000000-0000-0000-0000-000000000003",
  "/app/om/00000000-0000-0000-0000-000000000003/schedules",
] as const;

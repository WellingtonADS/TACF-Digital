import type { AppRouteMeta, ProfileRole } from "@/types";
import { isAdminLike } from "./routeAccess";

// Initial route metadata registry to progressively replace hardcoded route lists.
export const appRouteRegistry: AppRouteMeta[] = [
  {
    path: "/app",
    access: "user",
    section: "dashboard",
    showInSidebar: true,
    prefetch: true,
    prefetchCritical: true,
    lazyLoader: () => import("../pages/OperationalDashboard"),
    sidebarLabel: "Visão Geral",
    sidebarIcon: "layout-dashboard",
    sidebarOrder: 10,
  },
  {
    path: "/app/admin",
    access: "admin",
    section: "dashboard",
    showInSidebar: true,
    prefetch: true,
    prefetchCritical: true,
    lazyLoader: () => import("../pages/AdminDashboard"),
    sidebarLabel: "Visão Geral",
    sidebarIcon: "layout-dashboard",
    sidebarOrder: 10,
  },
  {
    path: "/app/agendamentos",
    access: "user",
    section: "agendamentos",
    showInSidebar: true,
    prefetch: true,
    prefetchCritical: true,
    lazyLoader: () => import("../pages/Scheduling"),
    sidebarLabel: "Agendamentos",
    sidebarIcon: "calendar",
    sidebarOrder: 20,
  },
  {
    path: "/app/agendamentos/confirmacao",
    access: "user",
    section: "agendamentos",
    showInSidebar: false,
    prefetch: true,
    lazyLoader: () => import("../pages/AppointmentConfirmation"),
  },
  {
    path: "/app/ticket",
    access: "user",
    section: "agendamentos",
    showInSidebar: false,
    prefetch: true,
    prefetchCritical: true,
    lazyLoader: () => import("../pages/DigitalTicket"),
    sidebarLabel: "Ticket Digital",
    sidebarIcon: "ticket",
    sidebarOrder: 40,
  },
  {
    path: "/app/resultados",
    access: "user",
    section: "resultados",
    showInSidebar: true,
    prefetch: true,
    prefetchCritical: true,
    lazyLoader: () => import("../pages/ResultsHistory"),
    sidebarLabel: "Histórico",
    sidebarIcon: "clipboard-list",
    sidebarOrder: 50,
  },
  {
    path: "/app/documentos",
    access: "user",
    section: "documentos",
    showInSidebar: true,
    prefetch: true,
    lazyLoader: () => import("../pages/Documents"),
    sidebarLabel: "Documentos Técnicos",
    sidebarIcon: "file-text",
    sidebarOrder: 30,
  },
  {
    path: "/app/recurso",
    access: "user",
    section: "resultados",
    showInSidebar: false,
    prefetch: true,
    lazyLoader: () => import("../pages/AppealRequest"),
  },
  {
    path: "/app/perfil",
    access: "user",
    section: "perfil",
    showInSidebar: true,
    prefetch: true,
    lazyLoader: () => import("../pages/UserProfilesManagement"),
    sidebarLabel: "Meu Perfil",
    sidebarIcon: "user",
    sidebarOrder: 60,
  },
  {
    path: "/app/turmas",
    access: "admin",
    section: "turmas",
    showInSidebar: true,
    prefetch: true,
    prefetchCritical: true,
    lazyLoader: () => import("../pages/SessionsManagement"),
    sidebarLabel: "Gerenciar Turmas",
    sidebarIcon: "users",
    sidebarOrder: 20,
  },
  {
    path: "/app/turmas/nova",
    access: "admin",
    section: "turmas",
    showInSidebar: false,
    prefetch: true,
    lazyLoader: () => import("../pages/ClassCreationForm"),
  },
  {
    path: "/app/lancamento-indices",
    access: "admin",
    section: "turmas",
    showInSidebar: true,
    prefetch: true,
    lazyLoader: () => import("../pages/ScoreEntry"),
    sidebarLabel: "Lançar Índices",
    sidebarIcon: "clipboard-pen",
    sidebarOrder: 50,
  },
  {
    path: "/app/efetivo",
    access: "admin",
    section: "efetivo",
    showInSidebar: true,
    prefetch: true,
    lazyLoader: () => import("../pages/PersonnelManagement"),
    sidebarLabel: "Gerenciar Efetivo",
    sidebarIcon: "users",
    sidebarOrder: 30,
  },
  {
    path: "/app/efetivo/:userId/editar",
    access: "admin",
    section: "efetivo",
    showInSidebar: false,
    prefetch: false,
    lazyLoader: () => import("../pages/PersonnelEditor"),
  },
  {
    path: "/app/reagendamentos",
    access: "admin",
    section: "governanca",
    showInSidebar: true,
    prefetch: true,
    lazyLoader: () => import("../pages/ReschedulingManagement"),
    sidebarLabel: "Reagendamentos",
    sidebarIcon: "calendar",
    sidebarOrder: 40,
  },
  {
    path: "/app/reagendamentos/notificacao",
    access: "admin",
    section: "governanca",
    showInSidebar: false,
    prefetch: true,
    lazyLoader: () => import("../pages/ReschedulingNotification"),
  },
  {
    path: "/app/analytics",
    access: "admin",
    section: "governanca",
    showInSidebar: true,
    prefetch: true,
    lazyLoader: () => import("../pages/AnalyticsDashboard"),
    sidebarLabel: "Relatórios",
    sidebarIcon: "bar-chart-2",
    sidebarOrder: 60,
  },
  {
    path: "/app/configuracoes",
    access: "admin",
    section: "governanca",
    showInSidebar: true,
    prefetch: true,
    lazyLoader: () => import("../pages/SystemSettings"),
    sidebarLabel: "Configurações",
    sidebarIcon: "settings",
    sidebarOrder: 70,
  },
  {
    path: "/app/configuracoes/perfis",
    access: "admin",
    section: "governanca",
    showInSidebar: false,
    prefetch: true,
    lazyLoader: () => import("../pages/AccessProfilesManagement"),
  },
  {
    path: "/app/auditoria",
    access: "admin",
    section: "governanca",
    showInSidebar: true,
    prefetch: true,
    lazyLoader: () => import("../pages/AuditLog"),
    sidebarLabel: "Auditoria de acesso",
    sidebarIcon: "shield",
    sidebarOrder: 80,
  },
  {
    path: "/app/om-locations",
    access: "admin",
    section: "infra",
    showInSidebar: true,
    prefetch: true,
    lazyLoader: () => import("../pages/OmLocationManager"),
    sidebarLabel: "Locais de Avaliação",
    sidebarIcon: "map-pin",
    sidebarOrder: 35,
  },
  {
    path: "/app/om/:id",
    access: "admin",
    section: "infra",
    showInSidebar: false,
    prefetch: false,
    lazyLoader: () => import("../pages/OmLocationEditor"),
  },
  {
    path: "/app/om/:id/schedules",
    access: "admin",
    section: "infra",
    showInSidebar: false,
    prefetch: false,
    lazyLoader: () => import("../pages/OmScheduleEditor"),
  },
  {
    path: "/app/turmas/:sessionId/agendamentos",
    access: "admin",
    section: "turmas",
    showInSidebar: false,
    prefetch: false,
    lazyLoader: () => import("../pages/SessionBookingsManagement"),
  },
  {
    path: "/app/turmas/:sessionId/editar",
    access: "admin",
    section: "turmas",
    showInSidebar: false,
    prefetch: false,
    lazyLoader: () => import("../pages/SessionEditor"),
  },
];

export function getSidebarRoutesForRole(role: ProfileRole | null | undefined) {
  const access = isAdminLike(role) ? "admin" : "user";

  return appRouteRegistry
    .filter(
      (route) =>
        route.showInSidebar &&
        route.access === access &&
        route.sidebarLabel &&
        route.sidebarIcon,
    )
    .sort((a, b) => (a.sidebarOrder ?? 999) - (b.sidebarOrder ?? 999));
}

export function getPrefetchLoaders() {
  return appRouteRegistry.reduce<Record<string, () => Promise<unknown>>>(
    (acc, route) => {
      if (route.lazyLoader && route.prefetch) {
        acc[route.path] = route.lazyLoader;
      }
      return acc;
    },
    {},
  );
}

export function getCriticalPrefetchPaths() {
  return appRouteRegistry
    .filter((route) => route.prefetch && route.prefetchCritical)
    .map((route) => route.path);
}

export function getRoutableAppRoutes() {
  return appRouteRegistry.filter(
    (route) => route.path.startsWith("/app/") && route.lazyLoader,
  );
}

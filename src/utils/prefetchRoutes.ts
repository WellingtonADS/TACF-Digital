type PrefetchLoader = () => Promise<unknown>;

const routeLoaders: Record<string, PrefetchLoader> = {
  "/app": () => import("../pages/OperationalDashboard"),
  "/app/admin": () => import("../pages/AdminDashboard"),
  "/app/agendamentos": () => import("../pages/Scheduling"),
  "/app/agendamentos/confirmacao": () =>
    import("../pages/AppointmentConfirmation"),
  "/app/ticket": () => import("../pages/DigitalTicket"),
  "/app/resultados": () => import("../pages/ResultsHistory"),
  "/app/documentos": () => import("../pages/Documents"),
  "/app/perfil": () => import("../pages/UserProfilesManagement"),
  "/app/turmas": () => import("../pages/SessionsManagement"),
  "/app/turmas/nova": () => import("../pages/ClassCreationForm"),
  "/app/efetivo": () => import("../pages/PersonnelManagement"),
  "/app/lancamento-indices": () => import("../pages/ScoreEntry"),
  "/app/analytics": () => import("../pages/AnalyticsDashboard"),
  "/app/configuracoes": () => import("../pages/SystemSettings"),
  "/app/om-locations": () => import("../pages/OmLocationManager"),
  "/app/reagendamentos": () => import("../pages/ReschedulingManagement"),
  "/app/auditoria": () => import("../pages/AuditLog"),
};

const prefetched = new Set<string>();

function resolveLoader(path: string): PrefetchLoader | null {
  if (routeLoaders[path]) return routeLoaders[path];

  if (path.startsWith("/app/turmas/") && path.endsWith("/agendamentos")) {
    return () => import("../pages/SessionBookingsManagement");
  }

  if (path.startsWith("/app/turmas/") && path.endsWith("/editar")) {
    return () => import("../pages/SessionEditor");
  }

  return null;
}

export function prefetchRoute(path: string) {
  const loader = resolveLoader(path);
  if (!loader || prefetched.has(path)) return;

  prefetched.add(path);
  void loader().catch(() => {
    prefetched.delete(path);
  });
}

export function prefetchCriticalRoutes() {
  if (typeof window === "undefined") return;

  const criticalPaths = [
    "/app",
    "/app/admin",
    "/app/agendamentos",
    "/app/resultados",
    "/app/ticket",
    "/app/turmas",
  ];

  window.setTimeout(() => {
    criticalPaths.forEach(prefetchRoute);
  }, 400);
}

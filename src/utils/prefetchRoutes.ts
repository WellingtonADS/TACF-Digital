import { getCriticalPrefetchPaths, getPrefetchLoaders } from "./routeRegistry";

type PrefetchLoader = () => Promise<unknown>;

const routeLoaders = getPrefetchLoaders();

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
  const criticalPaths = getCriticalPrefetchPaths();

  window.setTimeout(() => {
    criticalPaths.forEach(prefetchRoute);
  }, 400);
}

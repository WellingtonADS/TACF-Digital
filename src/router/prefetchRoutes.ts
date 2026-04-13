import { getCriticalPrefetchPaths, getPrefetchLoaders } from "./routeRegistry";

type PrefetchLoader = () => Promise<unknown>;

const routeLoaders = getPrefetchLoaders();

const prefetched = new Set<string>();

function shouldPrefetch(): boolean {
  const c = (
    navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string };
    }
  ).connection;
  if (!c) return true;
  if (c.saveData) return false;
  return c.effectiveType !== "2g" && c.effectiveType !== "slow-2g";
}

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
  if (!loader || prefetched.has(path) || !shouldPrefetch()) return;

  prefetched.add(path);
  void loader().catch(() => {
    prefetched.delete(path);
  });
}

export function prefetchCriticalRoutes() {
  if (typeof window === "undefined") return;
  const criticalPaths = getCriticalPrefetchPaths();

  const run = () => criticalPaths.forEach(prefetchRoute);
  type WindowWithRIC = Window & {
    requestIdleCallback?: (
      cb: () => void,
      opts?: { timeout?: number },
    ) => number;
  };
  const win = window as unknown as WindowWithRIC;
  if (typeof win.requestIdleCallback === "function") {
    win.requestIdleCallback(run, { timeout: 1000 });
  } else {
    setTimeout(run, 400);
  }
}

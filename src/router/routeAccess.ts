import { ADMIN_MODULE_PATHS } from "@/router/adminModules";
import type { Json, ProfileRole, RouteAccess } from "@/types";

export const ADMIN_ROLES: ReadonlySet<ProfileRole> = new Set([
  "admin",
  "coordinator",
]);

const PROFILE_ACCESS_MODULES_KEY = "access_modules";

function isJsonObject(
  value: Json | null | undefined,
): value is Record<string, Json> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeAdminModulePath(path: string): string {
  const exact = ADMIN_MODULE_PATHS.find((modulePath) => modulePath === path);
  if (exact) return exact;

  const match = ADMIN_MODULE_PATHS.find(
    (modulePath) => path === modulePath || path.startsWith(`${modulePath}/`),
  );

  return match ?? path;
}

function matchesAdminModulePath(pathname: string, modulePath: string): boolean {
  return pathname === modulePath || pathname.startsWith(`${modulePath}/`);
}

export function getProfileAccessModules(
  metadata: Json | null | undefined,
): string[] {
  if (!isJsonObject(metadata)) {
    return [];
  }

  const raw = metadata[PROFILE_ACCESS_MODULES_KEY];
  if (!Array.isArray(raw)) {
    return [];
  }

  const modules = raw.filter(
    (value): value is string => typeof value === "string",
  );

  return modules
    .map((modulePath) => normalizeAdminModulePath(modulePath))
    .filter((modulePath, index, current) => {
      return (
        ADMIN_MODULE_PATHS.includes(modulePath) &&
        current.indexOf(modulePath) === index
      );
    });
}

export function getAllowedAdminModulePaths(
  role: ProfileRole | null | undefined,
  metadata?: Json | null,
): string[] {
  if (role === "admin") {
    return [...ADMIN_MODULE_PATHS];
  }

  if (role !== "coordinator") {
    return [];
  }

  const modules = getProfileAccessModules(metadata);
  return modules.length > 0 ? modules : [...ADMIN_MODULE_PATHS];
}

export function canAccessAdminPath(
  role: ProfileRole | null | undefined,
  metadata: Json | null | undefined,
  pathname: string,
): boolean {
  if (role === "admin") {
    return true;
  }

  if (role !== "coordinator") {
    return false;
  }

  return getAllowedAdminModulePaths(role, metadata).some((modulePath) =>
    matchesAdminModulePath(pathname, modulePath),
  );
}

export function isAdminLike(role: ProfileRole | null | undefined): boolean {
  return role ? ADMIN_ROLES.has(role) : false;
}

export function getDefaultHomeByRole(
  role: ProfileRole | null | undefined,
  metadata?: Json | null,
): string {
  if (!isAdminLike(role)) {
    return "/app";
  }

  const modules = getAllowedAdminModulePaths(role, metadata);
  return modules[0] ?? "/app/admin";
}

export function canAccessRoute(
  role: ProfileRole | null | undefined,
  access: RouteAccess,
): boolean {
  if (access === "authenticated") return true;
  if (access === "admin") return isAdminLike(role);
  return !isAdminLike(role);
}

const ROLE_LABELS: Record<ProfileRole, string> = {
  admin: "Administrador",
  coordinator: "Coordenador",
  user: "Usuário",
};

export function getRoleLabel(role: ProfileRole | null | undefined): string {
  return role ? (ROLE_LABELS[role] ?? "Usuário") : "Usuário";
}

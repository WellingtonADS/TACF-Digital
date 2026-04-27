import { ADMIN_MODULE_PATHS } from "@/router/adminModules";
import type { Json, ProfileRole, RouteAccess } from "@/types";

export const ADMIN_ROLES: ReadonlySet<ProfileRole> = new Set([
  "admin",
  "coordinator",
]);

const PROFILE_ACCESS_MODULES_KEY = "access_modules";
const PROFILE_SESSION_PERMISSIONS_KEY = "session_permissions";

export const SESSION_PERMISSION_KEYS = [
  "create_session",
  "duplicate_session",
  "cancel_session",
] as const;

export type SessionPermissionKey = (typeof SESSION_PERMISSION_KEYS)[number];

export type SessionPermissions = Record<SessionPermissionKey, boolean>;

export const EMPTY_SESSION_PERMISSIONS: SessionPermissions = {
  create_session: false,
  duplicate_session: false,
  cancel_session: false,
};

export type MilitaryProfileCompletionFields = {
  full_name?: string | null;
  email?: string | null;
  war_name?: string | null;
  saram?: string | null;
  rank?: string | null;
  sector?: string | null;
};

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

  return getProfileAccessModules(metadata);
}

export function getProfileSessionPermissions(
  metadata: Json | null | undefined,
): SessionPermissions {
  if (!isJsonObject(metadata)) {
    return { ...EMPTY_SESSION_PERMISSIONS };
  }

  const raw = metadata[PROFILE_SESSION_PERMISSIONS_KEY];
  if (!isJsonObject(raw)) {
    return { ...EMPTY_SESSION_PERMISSIONS };
  }

  return SESSION_PERMISSION_KEYS.reduce<SessionPermissions>(
    (permissions, key) => ({
      ...permissions,
      [key]: raw[key] === true,
    }),
    { ...EMPTY_SESSION_PERMISSIONS },
  );
}

export function canUseSessionPermission(
  role: ProfileRole | null | undefined,
  metadata: Json | null | undefined,
  permission: SessionPermissionKey,
): boolean {
  if (role === "admin") {
    return true;
  }

  if (role !== "coordinator") {
    return false;
  }

  return getProfileSessionPermissions(metadata)[permission];
}

export function isMilitaryProfileComplete(
  profile: MilitaryProfileCompletionFields | null | undefined,
): boolean {
  if (!profile) {
    return false;
  }

  const saram = (profile.saram ?? "").replace(/\D/g, "");

  return Boolean(
    profile.full_name?.trim() &&
    profile.email?.trim() &&
    profile.war_name?.trim() &&
    saram.length === 7 &&
    profile.rank?.trim() &&
    profile.sector?.trim(),
  );
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
  return modules[0] ?? "/app";
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

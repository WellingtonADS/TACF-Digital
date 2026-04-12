import type { ProfileRole, RouteAccess } from "@/types";

export const SESSION_MANAGER_ROLES: ReadonlySet<ProfileRole> = new Set([
  "admin",
  "coordinator",
]);

export const PLATFORM_ADMIN_ROLES: ReadonlySet<ProfileRole> = new Set(["admin"]);

export function isPlatformAdmin(
  role: ProfileRole | null | undefined,
): boolean {
  return role ? PLATFORM_ADMIN_ROLES.has(role) : false;
}

export function isSessionManager(
  role: ProfileRole | null | undefined,
): boolean {
  return role ? SESSION_MANAGER_ROLES.has(role) : false;
}

export function isAdminLike(role: ProfileRole | null | undefined): boolean {
  return isSessionManager(role);
}

export function getDefaultHomeByRole(
  role: ProfileRole | null | undefined,
): string {
  if (isPlatformAdmin(role)) return "/app/admin";
  if (role === "coordinator") return "/app/turmas";
  return "/app";
}

export function canAccessRoute(
  role: ProfileRole | null | undefined,
  access: RouteAccess,
): boolean {
  if (access === "authenticated") return true;
  if (access === "platform_admin") return isPlatformAdmin(role);
  if (access === "session_manager") return isSessionManager(role);
  return !isSessionManager(role);
}

const ROLE_LABELS: Record<ProfileRole, string> = {
  admin: "Administrador",
  coordinator: "Coordenador",
  user: "Usuário",
};

export function getRoleLabel(role: ProfileRole | null | undefined): string {
  return role ? (ROLE_LABELS[role] ?? "Usuário") : "Usuário";
}

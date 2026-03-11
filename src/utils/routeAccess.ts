import type { ProfileRole, RouteAccess } from "@/types";

const ADMIN_ROLES: ReadonlySet<ProfileRole> = new Set(["admin", "coordinator"]);

export function isAdminLike(role: ProfileRole | null | undefined): boolean {
  return role ? ADMIN_ROLES.has(role) : false;
}

export function getDefaultHomeByRole(
  role: ProfileRole | null | undefined,
): string {
  return isAdminLike(role) ? "/app/admin" : "/app";
}

export function canAccessRoute(
  role: ProfileRole | null | undefined,
  access: RouteAccess,
): boolean {
  if (access === "authenticated") return true;
  if (access === "admin") return isAdminLike(role);
  return !isAdminLike(role);
}



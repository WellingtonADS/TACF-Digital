export * from "./database.types";

export type Profile =
  import("./database.types").Database["public"]["Tables"]["profiles"]["Row"];
export type BookingRow =
  import("./database.types").Database["public"]["Tables"]["bookings"]["Row"];
export type SessionRow =
  import("./database.types").Database["public"]["Tables"]["sessions"]["Row"];
export type AuditLogRow =
  import("./database.types").Database["public"]["Tables"]["audit_logs"]["Row"];
export type AccessProfile =
  import("./database.types").Database["public"]["Tables"]["access_profiles"]["Row"];
export type Permission =
  import("./database.types").Database["public"]["Tables"]["permissions"]["Row"];
export type SystemSettingsRow =
  import("./database.types").Database["public"]["Tables"]["system_settings"]["Row"];

export type ProfileRole =
  import("./database.types").Database["public"]["Tables"]["profiles"]["Row"]["role"];

export type RouteAccess = "authenticated" | "user" | "admin";

export type RouteSection =
  | "dashboard"
  | "agendamentos"
  | "resultados"
  | "documentos"
  | "perfil"
  | "turmas"
  | "efetivo"
  | "governanca"
  | "infra"
  | "outros";

export type SidebarIconKey =
  | "layout-dashboard"
  | "calendar"
  | "file-text"
  | "ticket"
  | "clipboard-list"
  | "user"
  | "users"
  | "map-pin"
  | "clipboard-pen"
  | "bar-chart-2"
  | "settings"
  | "shield";

export type AppRouteMeta = {
  path: string;
  access: RouteAccess;
  section: RouteSection;
  showInSidebar: boolean;
  prefetch: boolean;
  prefetchCritical?: boolean;
  lazyLoader?: () => Promise<unknown>;
  sidebarLabel?: string;
  sidebarIcon?: SidebarIconKey;
  sidebarOrder?: number;
};



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

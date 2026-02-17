export type UserRole = "admin" | "coordinator" | "user";
export type SemesterType = "1" | "2";

export interface Profile {
  id: string;
  updated_at: string;
  full_name: string; // Nome Completo
  saram: string | null;
  rank: string; // Posto/Graduação
  semester: SemesterType;
  phone_number: string | null;
  email: string | null;
  role: UserRole;
  active: boolean;
  created_at: string;

  // NOVOS CAMPOS ADICIONADOS NA ISSUE-029
  war_name: string | null; // Nome de Guerra
  sector: string | null; // Setor / OM
}

export interface Session {
  id: string;
  date: string;
  period: "morning" | "afternoon";
  max_capacity: number;
  status: "open" | "closed" | "cancelled";
  created_at: string;
  updated_at: string;
  applicators: string[];
  coordinator_id: string | null;
}

export interface SessionWithBookings extends Session {
  bookings: Booking[];
  booking_count?: number;
}

export interface Booking {
  id: string;
  user_id: string;
  session_id: string;
  status: "confirmed" | "cancelled" | "pending_swap";
  attendance_confirmed: boolean;
  order_number?: string | null;
  created_at: string;
  updated_at: string;
}

export interface BookingWithDetails extends Booking {
  session: Session;
  user?: Profile;
}

export interface SwapRequest {
  id: string;
  booking_id: string;
  requested_by: string;
  new_session_id: string;
  reason: string | null;
  status: "pending" | "approved" | "rejected";
  processed_by?: string | null;
  processed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SystemSettings {
  id: string;
  is_global: boolean;
  system_name: string;
  organization_name: string;
  min_capacity: number;
  max_capacity: number;
  default_periods: Array<"morning" | "afternoon">;
  allow_swaps: boolean;
  require_quorum: boolean;
  created_at: string;
  updated_at: string;
}

export interface AccessProfile {
  id: string;
  name: string;
  description: string | null;
  role: UserRole;
  icon: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Permission {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface AccessProfilePermission {
  access_profile_id: string;
  permission_id: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  action: string | null;
  entity: string | null;
  user_id: string | null;
  user_name: string | null;
  details: string | null;
  created_at: string;
}

// Tipos auxiliares para Inserts/Updates (usados no admin.ts e supabase.ts)
export type ProfileInsert = Partial<Profile>;
export type SessionInsert = Partial<Session>;
export type BookingInsert = Partial<Booking>;
export type SwapRequestInsert = Partial<SwapRequest>;

export type ProfileUpdate = Partial<Profile>;
export type SessionUpdate = Partial<Session>;
export type BookingUpdate = Partial<Booking>;
export type SwapRequestUpdate = Partial<SwapRequest>;

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile>;
        Update: Partial<Profile>;
      };
      sessions: {
        Row: Session;
        Insert: Partial<Session>;
        Update: Partial<Session>;
      };
      bookings: {
        Row: Booking;
        Insert: Partial<Booking>;
        Update: Partial<Booking>;
      };
      swap_requests: {
        Row: SwapRequest;
        Insert: Partial<SwapRequest>;
        Update: Partial<SwapRequest>;
      };
      system_settings: {
        Row: SystemSettings;
        Insert: Partial<SystemSettings>;
        Update: Partial<SystemSettings>;
      };
      access_profiles: {
        Row: AccessProfile;
        Insert: Partial<AccessProfile>;
        Update: Partial<AccessProfile>;
      };
      permissions: {
        Row: Permission;
        Insert: Partial<Permission>;
        Update: Partial<Permission>;
      };
      access_profile_permissions: {
        Row: AccessProfilePermission;
        Insert: Partial<AccessProfilePermission>;
        Update: Partial<AccessProfilePermission>;
      };
      audit_logs: {
        Row: AuditLog;
        Insert: Partial<AuditLog>;
        Update: Partial<AuditLog>;
      };
    };
  };
}

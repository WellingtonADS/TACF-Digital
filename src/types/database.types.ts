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
  created_at: string;
  updated_at: string;
}

// Tipos auxiliares para Inserts/Updates (usados no admin.ts e supabase.ts)
export type SessionInsert = Partial<Session>;
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
    };
  };
}

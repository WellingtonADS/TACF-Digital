// ============================================================================
// TACF Digital - TypeScript Database Types
// Auto-generated from Supabase schema
// ============================================================================

export type UserRole = "user" | "admin" | "coordinator";
export type SessionPeriod = "morning" | "afternoon";
export type SessionStatus = "open" | "closed" | "completed";
export type BookingStatus = "confirmed" | "pending_swap" | "cancelled";
export type SwapStatus = "pending" | "approved" | "rejected";
export type SemesterType = "1" | "2";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          saram: string | null;
          phone_number: string | null;
          email: string | null;
          full_name: string;
          rank: string;
          role: UserRole;
          semester: SemesterType;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          saram?: string | null;
          phone_number?: string | null;
          email?: string | null;
          full_name: string;
          rank: string;
          role?: UserRole;
          semester: SemesterType;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          saram?: string | null;
          phone_number?: string | null;
          email?: string | null;
          full_name?: string;
          rank?: string;
          role?: UserRole;
          semester?: SemesterType;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      sessions: {
        Row: {
          id: string;
          date: string;
          period: SessionPeriod;
          max_capacity: number;
          applicators: string[];
          status: SessionStatus;
          coordinator_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          date: string;
          period: SessionPeriod;
          max_capacity: number;
          applicators?: string[];
          status?: SessionStatus;
          coordinator_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          date?: string;
          period?: SessionPeriod;
          max_capacity?: number;
          applicators?: string[];
          status?: SessionStatus;
          coordinator_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      bookings: {
        Row: {
          id: string;
          user_id: string;
          session_id: string;
          status: BookingStatus;
          swap_reason: string | null;
          order_number: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          session_id: string;
          status?: BookingStatus;
          swap_reason?: string | null;
          order_number?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          session_id?: string;
          status?: BookingStatus;
          swap_reason?: string | null;
          order_number?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      swap_requests: {
        Row: {
          id: string;
          booking_id: string;
          requested_by: string;
          new_session_id: string;
          reason: string;
          status: SwapStatus;
          processed_by: string | null;
          processed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          booking_id: string;
          requested_by: string;
          new_session_id: string;
          reason: string;
          status?: SwapStatus;
          processed_by?: string | null;
          processed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          booking_id?: string;
          requested_by?: string;
          new_session_id?: string;
          reason?: string;
          status?: SwapStatus;
          processed_by?: string | null;
          processed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}

// Helper types for common queries
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Session = Database["public"]["Tables"]["sessions"]["Row"];
export type Booking = Database["public"]["Tables"]["bookings"]["Row"];
export type SwapRequest = Database["public"]["Tables"]["swap_requests"]["Row"];

export type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];
export type SessionInsert = Database["public"]["Tables"]["sessions"]["Insert"];
export type BookingInsert = Database["public"]["Tables"]["bookings"]["Insert"];
export type SwapRequestInsert =
  Database["public"]["Tables"]["swap_requests"]["Insert"];

export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];
export type SessionUpdate = Database["public"]["Tables"]["sessions"]["Update"];
export type BookingUpdate = Database["public"]["Tables"]["bookings"]["Update"];
export type SwapRequestUpdate =
  Database["public"]["Tables"]["swap_requests"]["Update"];

// Extended types with relations
export interface SessionWithBookings extends Session {
  bookings: Booking[];
  booking_count?: number;
}

export interface BookingWithDetails extends Booking {
  user: Profile;
  session: Session;
}

export interface SwapRequestWithDetails extends SwapRequest {
  booking: BookingWithDetails;
  requested_by_profile: Profile;
  new_session: Session;
  processed_by_profile?: Profile;
}

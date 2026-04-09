export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[];

// ─── Enum Aliases (DRY — definir uma vez, reusar em toda parte) ───────────────────
export type UserRole = "user" | "admin" | "coordinator";
export type SemesterType = "1" | "2";
export type SessionPeriod = "manha" | "tarde";
export type SessionStatus = "open" | "closed" | "completed";
export type BookingStatus = "agendado" | "cancelado" | "remarcado";
export type SwapStatus = "solicitado" | "aprovado" | "cancelado";
export type LocationStatus = "active" | "maintenance" | "inactive";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          saram?: string | null;
          full_name?: string | null;
          rank?: string | null;
          role: UserRole;
          semester?: SemesterType | null;
          phone_number?: string | null;
          email?: string | null;
          active: boolean;
          war_name?: string | null;
          sector?: string | null;
          metadata?: Json | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Insert: {
          id?: string;
          full_name?: string | null;
          rank?: string | null;
          role?: UserRole;
          semester?: SemesterType | null;
          phone_number?: string | null;
          email?: string | null;
          active?: boolean;
          war_name?: string | null;
          sector?: string | null;
          metadata?: Json | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          saram?: string | null;
          full_name?: string | null;
          rank?: string | null;
          role?: UserRole;
          semester?: SemesterType | null;
          phone_number?: string | null;
          email?: string | null;
          active?: boolean;
          war_name?: string | null;
          sector?: string | null;
          metadata?: Json | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      system_settings: {
        Row: {
          id: string;
          is_global: boolean;
          system_name: string;
          organization_name: string;
          min_capacity: number;
          max_capacity: number;
          default_periods: SessionPeriod[];
          allow_swaps: boolean;
          require_quorum: boolean;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Insert: {
          id?: string;
          is_global?: boolean;
          system_name: string;
          organization_name: string;
          min_capacity?: number;
          max_capacity?: number;
          default_periods?: SessionPeriod[];
          allow_swaps?: boolean;
          require_quorum?: boolean;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          is_global?: boolean;
          system_name?: string;
          organization_name?: string;
          min_capacity?: number;
          max_capacity?: number;
          default_periods?: SessionPeriod[];
          allow_swaps?: boolean;
          require_quorum?: boolean;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: string;
          action?: string | null;
          entity?: string | null;
          user_id?: string | null;
          user_name?: string | null;
          details?: string | null;
          created_at?: string | null;
        };
        Insert: {
          id?: string;
          action?: string | null;
          entity?: string | null;
          user_id?: string | null;
          user_name?: string | null;
          details?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          action?: string | null;
          entity?: string | null;
          user_id?: string | null;
          user_name?: string | null;
          details?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };

      bookings: {
        Row: {
          id: string;
          user_id: string;
          session_id: string;
          status: BookingStatus;
          semester: SemesterType;
          swap_reason?: string | null;
          order_number?: string | null;
          attendance_confirmed: boolean;
          score?: string | null;
          result_details?: Json | null;
          metadata?: Json | null;
          test_date?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          session_id: string;
          status?: BookingStatus;
          semester: SemesterType;
          swap_reason?: string | null;
          order_number?: string | null;
          attendance_confirmed?: boolean;
          score?: string | null;
          result_details?: Json | null;
          metadata?: Json | null;
          test_date?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          session_id?: string;
          status?: BookingStatus;
          semester?: SemesterType;
          swap_reason?: string | null;
          order_number?: string | null;
          attendance_confirmed?: boolean;
          score?: string | null;
          result_details?: Json | null;
          metadata?: Json | null;
          test_date?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      sessions: {
        Row: {
          id: string;
          starts_at: string | null;
          date: string;
          period: SessionPeriod;
          max_capacity: number;
          capacity?: number | null;
          title?: string | null;
          summary?: string | null;
          metadata?: Json | null;
          location_id?: string | null;
          applicators?: string[] | null;
          status: SessionStatus;
          coordinator_id?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Insert: {
          id?: string;
          starts_at?: string | null;
          date: string;
          period: SessionPeriod;
          max_capacity: number;
          capacity?: number | null;
          title?: string | null;
          summary?: string | null;
          metadata?: Json | null;
          location_id?: string | null;
          applicators?: string[] | null;
          status?: SessionStatus;
          coordinator_id?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          starts_at?: string | null;
          date?: string;
          period?: SessionPeriod;
          max_capacity?: number;
          capacity?: number | null;
          title?: string | null;
          summary?: string | null;
          metadata?: Json | null;
          location_id?: string | null;
          applicators?: string[] | null;
          status?: SessionStatus;
          coordinator_id?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      locations: {
        Row: {
          id: string;
          name: string;
          address: string;
          max_capacity: number;
          status: LocationStatus;
          facilities: string[] | null;
          metadata?: Json | null;
          created_by?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          address: string;
          max_capacity?: number;
          status?: LocationStatus;
          facilities?: string[] | null;
          metadata?: Json | null;
          created_by?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          address?: string;
          max_capacity?: number;
          status?: LocationStatus;
          facilities?: string[] | null;
          metadata?: Json | null;
          created_by?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      location_schedules: {
        Row: {
          id: string;
          location_id: string;
          day_of_week: number;
          period: SessionPeriod;
          start_time: string;
          end_time?: string | null;
          is_active: boolean;
          created_at?: string | null;
        };
        Insert: {
          id?: string;
          location_id: string;
          day_of_week: number;
          period: SessionPeriod;
          start_time?: string;
          end_time?: string | null;
          is_active?: boolean;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          location_id?: string;
          day_of_week?: number;
          period?: SessionPeriod;
          start_time?: string;
          end_time?: string | null;
          is_active?: boolean;
          created_at?: string | null;
        };
        Relationships: [];
      };
      swap_requests: {
        Row: {
          id: string;
          booking_id: string;
          requested_by: string;
          new_session_id: string;
          reason: string;
          status: SwapStatus;
          processed_by?: string | null;
          processed_at?: string | null;
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
        Relationships: [];
      };
      user_notifications: {
        Row: {
          id: string;
          recipient_user_id: string;
          sender_user_id?: string | null;
          type: string;
          title: string;
          message: string;
          metadata?: Json | null;
          is_read: boolean;
          read_at?: string | null;
          created_at?: string | null;
        };
        Insert: {
          id?: string;
          recipient_user_id: string;
          sender_user_id?: string | null;
          type: string;
          title: string;
          message: string;
          metadata?: Json | null;
          is_read?: boolean;
          read_at?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          recipient_user_id?: string;
          sender_user_id?: string | null;
          type?: string;
          title?: string;
          message?: string;
          metadata?: Json | null;
          is_read?: boolean;
          read_at?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      book_session: {
        Args: { p_user_id: string; p_session_id: string };
        Returns: { success: boolean; booking_id: string; error: string }[];
      };
      confirmar_agendamento: {
        Args: { p_user_id: string; p_session_id: string };
        Returns: {
          success: boolean;
          booking_id: string;
          error: string;
          order_number: string;
        }[];
      };
      get_locations: {
        Args: {
          p_search_term?: string | null;
          p_status?: string | null;
          p_limit?: number;
          p_offset?: number;
        };
        Returns: {
          id: string;
          name: string;
          address: string;
          max_capacity: number;
          status: string;
          facilities: string[] | null;
          metadata: Json | null;
          created_by: string | null;
          created_at: string | null;
          updated_at: string | null;
          total_count: number;
        }[];
      };
      create_location: {
        Args: {
          p_name: string;
          p_address: string;
          p_max_capacity: number;
          p_status?: string;
          p_facilities?: string[] | null;
          p_metadata?: Json | null;
        };
        Returns: Database["public"]["Tables"]["locations"]["Row"];
      };
      update_location: {
        Args: {
          p_id: string;
          p_name?: string;
          p_address?: string;
          p_max_capacity?: number;
          p_status?: string;
          p_facilities?: string[] | null;
          p_metadata?: Json | null;
        };
        Returns: Database["public"]["Tables"]["locations"]["Row"];
      };
      delete_location: {
        Args: { p_id: string };
        Returns: undefined;
      };
      get_user_dashboard_summary: {
        Args: Record<string, never>;
        Returns: Json;
      };
      get_admin_operational_overview: {
        Args: Record<string, never>;
        Returns: Json;
      };
      get_sessions_availability: {
        Args: { p_start: string; p_end: string };
        Returns: {
          session_id: string;
          date: string;
          period: string;
          max_capacity: number;
          occupied_count: number;
          available_count: number;
          session_status: SessionStatus;
          location_name: string | null;
        }[];
      };
      get_booked_dates: {
        Args: { p_start: string; p_end: string };
        Returns: {
          test_date: string;
        }[];
      };
      get_existing_semester_booking: {
        Args: { p_semester: string };
        Returns: {
          id: string;
          test_date: string;
        }[];
      };
      get_audit_logs: {
        Args: Record<string, never>;
        Returns: {
          id: string;
          action?: string | null;
          entity?: string | null;
          user_id?: string | null;
          user_name?: string | null;
          details?: string | null;
          created_at?: string | null;
        }[];
      };
      log_audit_event: {
        Args: {
          p_action: string;
          p_entity: string;
          p_details?: string | null;
        };
        Returns: undefined;
      };
      approve_swap: {
        Args: { p_request_id: string; p_admin_id: string };
        Returns: {
          success: boolean;
          error: string | null;
          original_booking_id: string | null;
          new_booking_id: string | null;
          new_session_id: string | null;
          order_number: string | null;
        }[];
      };
      reject_swap: {
        Args: {
          p_request_id: string;
          p_admin_id: string;
          p_reason?: string | null;
        };
        Returns: {
          success: boolean;
          error: string | null;
          booking_id: string | null;
          user_id: string | null;
          swap_status: SwapStatus | null;
        }[];
      };
      cancel_booking: {
        Args: {
          p_booking_id: string;
          p_reason?: string | null;
        };
        Returns: {
          success: boolean;
          error: string | null;
          booking_id: string | null;
          user_id: string | null;
          booking_status: BookingStatus | null;
          cancelled_swap_requests: number;
        }[];
      };
      close_session_with_checklist: {
        Args: { p_session_id: string; p_apply?: boolean | null };
        Returns: {
          success: boolean;
          error: string | null;
          checklist: Json;
          session_status: SessionStatus | null;
        }[];
      };
      cancel_session: {
        Args: { p_session_id: string };
        Returns: {
          success: boolean;
          error: string | null;
          session_status: SessionStatus | null;
        }[];
      };
      create_swap_request_if_eligible: {
        Args: {
          p_booking_id: string;
          p_requested_by: string;
          p_new_session_id: string;
          p_reason_text: string;
          p_new_date?: string | null;
          p_attachment_url?: string | null;
        };
        Returns: string;
      };
      reopen_session: {
        Args: { p_session_id: string };
        Returns: {
          success: boolean;
          error: string | null;
          session_status: SessionStatus | null;
        }[];
      };
      get_results_history: {
        Args: {
          p_limit: number;
          p_cursor: string;
          p_from?: string | null;
          p_to?: string | null;
        };
        Returns: Json;
      };
      get_swap_requests_with_context: {
        Args: Record<string, never>;
        Returns: {
          id: string;
          booking_id: string;
          status: SwapStatus;
          reason: string;
          created_at: string | null;
          processed_at: string | null;
          processed_by: string | null;
          user_id: string | null;
          original_session_id: string | null;
          original_date: string | null;
          original_period: SessionPeriod | null;
          new_session_id: string | null;
          new_date: string | null;
          new_period: SessionPeriod | null;
          full_name: string | null;
          war_name: string | null;
          saram: string | null;
          rank: string | null;
          email: string | null;
        }[];
      };
      set_booking_result: {
        Args: { p_booking_id: string; p_result: string };
        Returns: undefined;
      };
      set_booking_attendance: {
        Args: { p_booking_id: string; p_attendance_confirmed: boolean };
        Returns: undefined;
      };
    };
    Enums: {
      session_period: SessionPeriod;
      session_status: SessionStatus;
      user_role: UserRole;
      booking_status: BookingStatus;
      swap_status: SwapStatus;
      location_status: LocationStatus;
      semester_type: SemesterType;
    };
  };
}

export type Location = Database["public"]["Tables"]["locations"]["Row"];
export type LocationSchedule =
  Database["public"]["Tables"]["location_schedules"]["Row"];

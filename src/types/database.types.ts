export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          saram?: string | null;
          full_name?: string | null;
          rank?: string | null;
          role: "user" | "admin" | "coordinator";
          semester?: "1" | "2" | null;
          phone_number?: string | null;
          email?: string | null;
          active: boolean;
          war_name?: string | null;
          sector?: string | null;
          metadata?: Json | null;
          birth_date?: string | null;
          physical_group?: string | null;
          inspsau_valid_until?: string | null;
          inspsau_last_inspection?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Insert: {
          id?: string;
          full_name?: string | null;
          rank?: string | null;
          role?: "user" | "admin" | "coordinator";
          semester?: "1" | "2" | null;
          phone_number?: string | null;
          email?: string | null;
          active?: boolean;
          war_name?: string | null;
          sector?: string | null;
          metadata?: Json | null;
          birth_date?: string | null;
          physical_group?: string | null;
          inspsau_valid_until?: string | null;
          inspsau_last_inspection?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          saram?: string | null;
          full_name?: string | null;
          rank?: string | null;
          role?: "user" | "admin" | "coordinator";
          semester?: "1" | "2" | null;
          phone_number?: string | null;
          email?: string | null;
          active?: boolean;
          war_name?: string | null;
          sector?: string | null;
          metadata?: Json | null;
          birth_date?: string | null;
          physical_group?: string | null;
          inspsau_valid_until?: string | null;
          inspsau_last_inspection?: string | null;
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
          default_periods: string[]; // session_period enum values
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
          default_periods?: string[];
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
          default_periods?: string[];
          allow_swaps?: boolean;
          require_quorum?: boolean;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      access_profiles: {
        Row: {
          id: string;
          name: string;
          description?: string | null;
          role: "user" | "admin" | "coordinator";
          icon: string;
          is_active: boolean;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          role: "user" | "admin" | "coordinator";
          icon?: string;
          is_active?: boolean;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          role?: "user" | "admin" | "coordinator";
          icon?: string;
          is_active?: boolean;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      permissions: {
        Row: {
          id: string;
          name: string;
          description?: string | null;
          created_at?: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      access_profile_permissions: {
        Row: {
          access_profile_id: string;
          permission_id: string;
          created_at?: string | null;
        };
        Insert: {
          access_profile_id: string;
          permission_id: string;
          created_at?: string | null;
        };
        Update: {
          access_profile_id?: string;
          permission_id?: string;
          created_at?: string | null;
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
          status: "agendado" | "cancelado" | "remarcado";
          semester?: string | null;
          swap_reason?: string | null;
          order_number?: string | null;
          attendance_confirmed?: boolean | null;
          score?: number | null;
          result_details?: string | null;
          test_date?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          session_id: string;
          status?: "agendado" | "cancelado" | "remarcado";
          semester?: string | null;
          swap_reason?: string | null;
          order_number?: string | null;
          attendance_confirmed?: boolean | null;
          score?: number | null;
          result_details?: string | null;
          test_date?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          session_id?: string;
          status?: "agendado" | "cancelado" | "remarcado";
          semester?: string | null;
          swap_reason?: string | null;
          order_number?: string | null;
          attendance_confirmed?: boolean | null;
          score?: number | null;
          result_details?: string | null;
          test_date?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      sessions: {
        Row: {
          id: string;
          starts_at: string;
          date: string | null;
          period: "manha" | "tarde" | null;
          max_capacity?: number | null;
          capacity?: number | null;
          location_id?: string | null;
          applicators?: string[] | null;
          status?: string | null;
          coordinator_id?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Insert: {
          id?: string;
          starts_at: string;
          date?: string | null;
          period?: "manha" | "tarde" | null;
          max_capacity?: number | null;
          capacity?: number | null;
          location_id?: string | null;
          applicators?: string[] | null;
          status?: string | null;
          coordinator_id?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          starts_at?: string;
          date?: string | null;
          period?: "manha" | "tarde" | null;
          max_capacity?: number | null;
          capacity?: number | null;
          location_id?: string | null;
          applicators?: string[] | null;
          status?: string | null;
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
          status: "active" | "maintenance" | "inactive";
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
          status?: "active" | "maintenance" | "inactive";
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
          status?: "active" | "maintenance" | "inactive";
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
          period: "manha" | "tarde";
          start_time: string;
          end_time?: string | null;
          is_active: boolean;
          created_at?: string | null;
        };
        Insert: {
          id?: string;
          location_id: string;
          day_of_week: number;
          period: "manha" | "tarde";
          start_time?: string;
          end_time?: string | null;
          is_active?: boolean;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          location_id?: string;
          day_of_week?: number;
          period?: "manha" | "tarde";
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
          status: "solicitado" | "aprovado" | "cancelado";
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
          status?: "solicitado" | "aprovado" | "cancelado";
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
          status?: "solicitado" | "aprovado" | "cancelado";
          processed_by?: string | null;
          processed_at?: string | null;
          created_at?: string;
          updated_at?: string;
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
      get_sessions_availability: {
        Args: { p_start: string; p_end: string };
        Returns: {
          session_id: string;
          date: string;
          period: string;
          max_capacity: number;
          occupied_count: number;
          available_count: number;
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
      approve_swap: {
        Args: { p_request_id: string; p_admin_id: string };
        Returns: { success: boolean; error: string }[];
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
    };
    Enums: {
      session_period: "manha" | "tarde";
      user_role: "user" | "admin" | "coordinator";
    };
  };
}

export type Location = Database["public"]["Tables"]["locations"]["Row"];
export type LocationSchedule =
  Database["public"]["Tables"]["location_schedules"]["Row"];



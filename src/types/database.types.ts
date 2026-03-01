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
          created_at?: string | null;
          updated_at?: string | null;
        };
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
      };

      bookings: {
        Row: {
          id: string;
          user_id: string;
          session_id: string;
          status: string;
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
          status?: string;
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
          status?: string;
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
      };
      sessions: {
        Row: {
          id: string;
          date: string;
          period: string;
          max_capacity?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Insert: {
          id?: string;
          date: string;
          period: string;
          max_capacity?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          date?: string;
          period?: string;
          max_capacity?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
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
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      session_period: "morning" | "afternoon";
      user_role: "user" | "admin" | "coordinator";
    };
  };
}

export type Location = Database["public"]["Tables"]["locations"]["Row"];

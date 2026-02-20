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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

/* eslint-disable @typescript-eslint/no-empty-object-type */
// Auto-generated via Supabase MCP `generate_typescript_types`.
// Regenerate when the schema changes.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      auth_challenges: {
        Row: {
          challenge: string;
          created_at: string;
          expires_at: string;
          wallet: string;
        };
        Insert: {
          challenge: string;
          created_at?: string;
          expires_at?: string;
          wallet: string;
        };
        Update: {
          challenge?: string;
          created_at?: string;
          expires_at?: string;
          wallet?: string;
        };
        Relationships: [];
      };
      rate_limit_buckets: {
        Row: {
          key: string;
          last_refill: string;
          tokens: number;
        };
        Insert: {
          key: string;
          last_refill?: string;
          tokens: number;
        };
        Update: {
          key?: string;
          last_refill?: string;
          tokens?: number;
        };
        Relationships: [];
      };
      vaults: {
        Row: {
          chunks_count: number;
          created_at: string;
          description: string | null;
          domains: string[];
          id: string;
          name: string;
          notes_count: number;
          owner_wallet: string;
          payout_address: string;
          price_usdc: number;
          public: boolean;
          slug: string;
          total_earned_usdc: number;
          total_settlements: number;
          updated_at: string;
        };
        Insert: {
          chunks_count?: number;
          created_at?: string;
          description?: string | null;
          domains?: string[];
          id?: string;
          name: string;
          notes_count?: number;
          owner_wallet: string;
          payout_address: string;
          price_usdc?: number;
          public?: boolean;
          slug: string;
          total_earned_usdc?: number;
          total_settlements?: number;
          updated_at?: string;
        };
        Update: {
          chunks_count?: number;
          created_at?: string;
          description?: string | null;
          domains?: string[];
          id?: string;
          name?: string;
          notes_count?: number;
          owner_wallet?: string;
          payout_address?: string;
          price_usdc?: number;
          public?: boolean;
          slug?: string;
          total_earned_usdc?: number;
          total_settlements?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      consume_rate_limit_token: {
        Args: { p_capacity: number; p_interval_ms: number; p_key: string };
        Returns: {
          allowed: boolean;
          remaining: number;
          retry_after_ms: number;
        }[];
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

export type Vault = Database["public"]["Tables"]["vaults"]["Row"];
export type VaultInsert = Database["public"]["Tables"]["vaults"]["Insert"];
export type VaultUpdate = Database["public"]["Tables"]["vaults"]["Update"];

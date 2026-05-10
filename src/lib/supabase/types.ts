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
      vault_feedback: {
        Row: {
          created_at: string;
          id: string;
          signature: string;
          useful: boolean;
          vault_slug: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          signature: string;
          useful: boolean;
          vault_slug: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          signature?: string;
          useful?: boolean;
          vault_slug?: string;
        };
        Relationships: [
          {
            foreignKeyName: "vault_feedback_vault_slug_fkey";
            columns: ["vault_slug"];
            isOneToOne: false;
            referencedRelation: "vaults";
            referencedColumns: ["slug"];
          },
        ];
      };
      vaults: {
        Row: {
          category: Database["public"]["Enums"]["vault_category"];
          chunks_count: number;
          created_at: string;
          description: string | null;
          domains: string[];
          id: string;
          last_settlement_at: string | null;
          name: string;
          notes_count: number;
          owner_wallet: string;
          payout_address: string;
          preview_chunks: Json;
          price_usdc: number;
          public: boolean;
          slug: string;
          total_earned_usdc: number;
          total_settlements: number;
          updated_at: string;
          useful_count: number;
          useful_rate: number | null;
        };
        Insert: {
          category?: Database["public"]["Enums"]["vault_category"];
          chunks_count?: number;
          created_at?: string;
          description?: string | null;
          domains?: string[];
          id?: string;
          last_settlement_at?: string | null;
          name: string;
          notes_count?: number;
          owner_wallet: string;
          payout_address: string;
          preview_chunks?: Json;
          price_usdc?: number;
          public?: boolean;
          slug: string;
          total_earned_usdc?: number;
          total_settlements?: number;
          updated_at?: string;
          useful_count?: number;
          useful_rate?: number | null;
        };
        Update: {
          category?: Database["public"]["Enums"]["vault_category"];
          chunks_count?: number;
          created_at?: string;
          description?: string | null;
          domains?: string[];
          id?: string;
          last_settlement_at?: string | null;
          name?: string;
          notes_count?: number;
          owner_wallet?: string;
          payout_address?: string;
          preview_chunks?: Json;
          price_usdc?: number;
          public?: boolean;
          slug?: string;
          total_earned_usdc?: number;
          total_settlements?: number;
          updated_at?: string;
          useful_count?: number;
          useful_rate?: number | null;
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
    Enums: {
      vault_category:
        | "engineering"
        | "trading"
        | "defi"
        | "research"
        | "productivity"
        | "design"
        | "legal"
        | "other";
    };
    CompositeTypes: { [_ in never]: never };
  };
};

export type Vault = Database["public"]["Tables"]["vaults"]["Row"];
export type VaultInsert = Database["public"]["Tables"]["vaults"]["Insert"];
export type VaultUpdate = Database["public"]["Tables"]["vaults"]["Update"];

export type VaultFeedback =
  Database["public"]["Tables"]["vault_feedback"]["Row"];
export type VaultFeedbackInsert =
  Database["public"]["Tables"]["vault_feedback"]["Insert"];

export type VaultCategory = Database["public"]["Enums"]["vault_category"];

/** Ordered for UI dropdowns + filter chips. `other` last. */
export const VAULT_CATEGORIES = [
  "engineering",
  "trading",
  "defi",
  "research",
  "productivity",
  "design",
  "legal",
  "other",
] as const satisfies readonly VaultCategory[];

/** Display labels for UI (Title Case). */
export const VAULT_CATEGORY_LABELS: Record<VaultCategory, string> = {
  engineering: "Engineering",
  trading: "Trading",
  defi: "DeFi",
  research: "Research",
  productivity: "Productivity",
  design: "Design",
  legal: "Legal",
  other: "Other",
};

/**
 * Per-category helper text shown below the dropdown in /vaults/new.
 * Draft copy — refine after operator review. Each line is one sentence,
 * concrete enough that an uploader knows whether their corpus fits.
 */
export const VAULT_CATEGORY_HINTS: Record<VaultCategory, string> = {
  engineering:
    "Code, architecture decisions, debugging war stories, infra gotchas. Specific error messages, working snippets, named library versions.",
  trading:
    "Market analysis, signal frameworks, real PnL outcomes, anti-patterns. Tickers, mcap, timing data — not abstract advice.",
  defi:
    "Protocol design, tokenomics, on-chain mechanics. Pool math, liquidity strategies, governance trade-offs.",
  research:
    "Long-form research notes, paper synthesis, deep exploration. Citations plus your synthesis — not just summaries.",
  productivity:
    "Workflows, tooling stacks, agentic patterns. Reproducible setups, command sequences, the actual decision rule you use.",
  design:
    "UI/UX, brand, motion, design systems. Reference shots, anti-slop checks, component variants with rationale.",
  legal:
    "Precedent, contract patterns, jurisdiction notes. Citation-grade, redacted real cases, decision trees.",
  other:
    "Fits none of the above. Agents filter by category — 'other' has the lowest discovery, prefer a closer match where you can.",
};

export interface PreviewChunk {
  readonly id: string;
  readonly heading: string | null;
  readonly content: string;
}

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
      vault_settlements: {
        Row: {
          amount_usdc: number;
          block_time: string;
          created_at: string;
          payer: string;
          signature: string;
          vault_slug: string;
        };
        Insert: {
          amount_usdc: number;
          block_time: string;
          created_at?: string;
          payer: string;
          signature: string;
          vault_slug: string;
        };
        Update: {
          amount_usdc?: number;
          block_time?: string;
          created_at?: string;
          payer?: string;
          signature?: string;
          vault_slug?: string;
        };
        Relationships: [
          {
            foreignKeyName: "vault_settlements_vault_slug_fkey";
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
 * Operator-faced — sets the depth standard so uploads stay paid-grade.
 */
export const VAULT_CATEGORY_HINTS: Record<VaultCategory, string> = {
  engineering:
    "Spesifik debugging war story'leri, kullandığın gerçek kütüphane versiyonları, aldığın asıl error mesajıyla birlikte çalışan kod. Soyut pattern değil. Bir agent 'X kütüphanesi v2.3'te neden Y koştu' diye sorabiliyorsa ve cevabı bu vault'taysa — uyar.",
  trading:
    "Gerçek PnL sonuçları, spesifik ticker ve timing, bifurcation verisiyle anti-pattern'lar. Soyut tavsiye veya 'long mu açayım' yorumu değil. Vakanın içinde '14 Nisan'da $HIGH 30 dakikada +%35 squeeze yaptı çünkü...' geçiyorsa — uyar.",
  defi:
    "Matematikle birlikte protokol mekaniği, gerekçeli governance kararları, likidite stratejisinin sonuç verileri. 'AMM nasıl çalışır' özeti değil. Citation-grade pool verisi + kendi yorumun.",
  research:
    "Citation'larla long-form sentez, başkalarının çalışmasının üzerine kendi çerçeven. Paper özeti değil. Okuyan yeni bir mental model'le ayrılıyorsa — uyar.",
  productivity:
    "Tekrarlanabilir kurulumlar, birebir komut dizileri, gerçekten uyguladığın karar kuralları. 'Şu aracı dene' listesi değil. Yabancı biri sıfırdan replicate edebiliyorsa — uyar.",
  design:
    "Referans ekranlar, anti-slop kontrolleri, hangi trade-off'u seçtiğini açıklayan component varyasyonları. 'Figma kullan' tarzı genel tavsiye değil. Agent yönlendirme yerine çalışan bir component pattern'i çekebiliyorsa — uyar.",
  legal:
    "Citation-grade dava analizi, redacted gerçek emsal, yargı yetkisine özgü karar ağaçları. 'Avukatına danış' uyarısı değil. Bir hukuk asistanı bu vault'la araştırmasını kısaltabiliyorsa — uyar.",
  other:
    "Üst kategorilerden hiçbirine sığmıyor. Agent'lar kategoriye göre filtreliyor — 'other' en zayıf discovery'ye sahip. Yakın bir match varsa onu seç, scope kayarsa sonra yeniden kategorize et.",
};

export interface PreviewChunk {
  readonly id: string;
  readonly heading: string | null;
  readonly content: string;
}

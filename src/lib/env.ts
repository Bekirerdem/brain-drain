/**
 * Server-only environment loader. Hard-fails on boot if any required key
 * is missing or malformed — prevents silent broken state in dev/prod.
 *
 * Do not import from client components; client code should read
 * NEXT_PUBLIC_* directly via `process.env`.
 */
import { z } from "zod";

const SOLANA_NETWORKS = ["devnet", "mainnet-beta"] as const;
const BASE58_MIN = 32;
const BASE58_MAX = 44;

const EnvSchema = z.object({
  SOLANA_NETWORK: z.enum(SOLANA_NETWORKS),
  SOLANA_RPC_URL: z.string().url(),
  HELIUS_API_KEY: z.string().min(1),

  CDP_API_KEY_ID: z.string().uuid(),
  CDP_API_KEY_SECRET: z.string().min(1),
  CDP_WALLET_SECRET: z.string().min(1),

  GOOGLE_GENERATIVE_AI_API_KEY: z.string().startsWith("AIza"),
  GEMINI_MODEL: z.string().min(1).default("gemini-3.1-pro-preview"),
  GEMINI_FALLBACK_MODEL: z.string().min(1).default("gemini-2.5-flash"),
  GEMINI_EMBEDDING_MODEL: z.string().min(1).default("gemini-embedding-001"),

  ANTHROPIC_API_KEY: z.string().optional(),

  SELLER_SOLANA_ADDRESS: z.string().min(BASE58_MIN).max(BASE58_MAX),
  SELLER_PHANTOM_TAG: z.string().optional(),

  X402_DEFAULT_PRICE_USDC: z.coerce.number().positive().default(0.05),
  USDC_MINT_DEVNET: z.string().min(BASE58_MIN).max(BASE58_MAX),
  USDC_MINT_MAINNET: z.string().min(BASE58_MIN).max(BASE58_MAX),

  NEXT_PUBLIC_APP_URL: z.string().url(),
});

export type Env = z.infer<typeof EnvSchema>;

const formatIssues = (error: z.ZodError): string =>
  error.issues
    .map((issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`)
    .join("\n");

const parsed = EnvSchema.safeParse(process.env);
if (!parsed.success) {
  console.error(`\n[env] Invalid environment configuration:\n${formatIssues(parsed.error)}\n`);
  throw new Error("Invalid environment — see logs above");
}

export const env: Env = parsed.data;

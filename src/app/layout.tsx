import type { Metadata } from "next";
import { Geist, Geist_Mono, Audiowide } from "next/font/google";
import { Header } from "./_components/Header";
import { Footer } from "./_components/Footer";
import { LiveEventsProvider } from "@/lib/live-events/context";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

// Brand wordmark only — header logo + footer logo. Loud retro-tech
// display face (Astigmatic, single weight). Body copy stays on Geist.
const audiowide = Audiowide({
  variable: "--font-audiowide",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://brain-drain-iota.vercel.app"),
  title: {
    default: "Brain Drain — AI agents pay experts they cite",
    template: "%s · Brain Drain",
  },
  description:
    "AI agents finally pay the experts they cite. Mount your decision log on Solana — ~400ms on-chain settlement, USDC straight to your wallet.",
  // Surfaces the protocol stack to crawlers (Wappalyzer, etc.) — the
  // frontend layer is detectable from chunks, but the x402 / CDP / MCP /
  // Helius / Gemini / Supabase combo is not. This makes that visible.
  generator:
    "Brain Drain · Next.js 16 · Solana · x402 v1.2 · CDP MPC · Anthropic MCP · Gemini 3.1 Pro · Helius · Supabase",
  other: {
    "powered-by":
      "Solana, x402, Coinbase CDP, Anthropic MCP, Helius RPC, Gemini, Supabase, Phantom",
    "x-payment-protocol": "x402 v1.2",
    "x-network": "solana-devnet",
    "x-agent-surface": "MCP + HTTP",
    "x-rag": "custom in-memory cosine, gemini-embedding-001 (3072d)",
  },
  openGraph: {
    title: "Brain Drain — AI agents pay experts they cite",
    description:
      "Mount your decision log on Solana. Get USDC every time an AI cites your work — ~400ms on-chain settlement, straight to your wallet.",
    type: "website",
    siteName: "Brain Drain",
  },
  twitter: {
    card: "summary_large_image",
    title: "Brain Drain — AI agents pay experts they cite",
    description:
      "Mount your decision log on Solana. Get USDC every time an AI cites your work — ~400ms on-chain settlement, straight to your wallet.",
    creator: "@l3ekirerdem",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${audiowide.variable} antialiased`}
    >
      <body className="min-h-screen flex flex-col bg-[var(--color-bg)] text-[var(--color-text)]">
        <LiveEventsProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </LiveEventsProvider>
      </body>
    </html>
  );
}

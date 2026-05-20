import type { Metadata } from "next";
import { Geist_Mono, JetBrains_Mono, Audiowide } from "next/font/google";
import { Header } from "./_components/Header";
import { Footer } from "./_components/Footer";
import { LiveEventsProvider } from "@/lib/live-events/context";
import { ThemeProvider } from "@/lib/theme/context";
import "./globals.css";

// Runs before React hydrates. Reads stored theme (or falls back to the
// OS preference) and stamps `data-theme` on <html>, so the first paint
// already matches the user's choice — no flash from dark to light.
const themeInitScript = `
(function () {
  try {
    var saved = window.localStorage.getItem("bd-theme");
    if (saved === "light" || saved === "dark") {
      document.documentElement.dataset.theme = saved;
      return;
    }
    var prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
    document.documentElement.dataset.theme = prefersLight ? "light" : "dark";
  } catch (_) {
    document.documentElement.dataset.theme = "dark";
  }
})();
`;

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

// JetBrains Mono — best-in-class for terminals, code blocks, and the
// tabular-nums numbers we use across stat strips and the live feed.
const jetBrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
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

import { AmbientBackground } from "./_components/AmbientBackground";

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      data-theme="dark"
      suppressHydrationWarning
      className={`${geistMono.variable} ${jetBrainsMono.variable} ${audiowide.variable} antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-screen flex flex-col bg-[var(--color-bg)] text-[var(--color-text)] relative">
        <ThemeProvider>
          <LiveEventsProvider>
            <AmbientBackground />
            <div className="relative z-10 flex flex-col min-h-screen">
              <Header />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
          </LiveEventsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

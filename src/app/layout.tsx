import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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

export const metadata: Metadata = {
  metadataBase: new URL("https://brain-drain-iota.vercel.app"),
  title: {
    default: "Brain Drain — x402 + RAG reference implementation on Solana",
    template: "%s · Brain Drain",
  },
  description:
    "The protocol AI agents pay vault operators through. x402 + RAG reference implementation on Solana — 0.25 USDC per cited snippet, ~400ms confirmation. v1 opens upload to anyone running a maintained vault.",
  openGraph: {
    title: "Brain Drain — x402 + RAG on Solana",
    description:
      "The protocol AI agents pay vault operators through. 0.25 USDC per snippet, ~400ms on-chain confirmation.",
    type: "website",
    siteName: "Brain Drain",
  },
  twitter: {
    card: "summary_large_image",
    title: "Brain Drain — x402 + RAG on Solana",
    description:
      "The protocol AI agents pay vault operators through. 0.25 USDC per snippet, ~400ms on-chain confirmation.",
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
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
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

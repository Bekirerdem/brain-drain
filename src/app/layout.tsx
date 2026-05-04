import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Header } from "./_components/Header";
import { Footer } from "./_components/Footer";
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
    default: "Brain Drain — AI agents pay for human wisdom",
    template: "%s · Brain Drain",
  },
  description:
    "An editorial vault where AI agents settle 0.05 USDC per snippet on Solana via x402. Open source. Audit-ready. ~400ms settlement.",
  openGraph: {
    title: "Brain Drain",
    description:
      "AI agents pay for human wisdom. 0.05 USDC per snippet on Solana via x402.",
    type: "website",
    siteName: "Brain Drain",
  },
  twitter: {
    card: "summary_large_image",
    title: "Brain Drain",
    description:
      "AI agents pay for human wisdom. 0.05 USDC per snippet on Solana via x402.",
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
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}

import type { NextConfig } from "next";

/**
 * BD-10 fix: defense-in-depth headers on every response.
 * Vercel sets HSTS by default; we add the rest. CSP is intentionally
 * deferred — full CSP for Next 16 + Tailwind v4 + framer-motion +
 * window.solana + multi-domain fetches needs nonce-based scripting
 * and a careful policy doc; tracked as a follow-up after submission.
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  // X-DNS-Prefetch-Control off so we don't leak browsing across hosts.
  { key: "X-DNS-Prefetch-Control", value: "off" },
];

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/mcp": ["./.cache/index.json"],
    "/api/query": ["./.cache/index.json"],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;

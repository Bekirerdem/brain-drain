import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/mcp": ["./.cache/index.json"],
    "/api/query": ["./.cache/index.json"],
  },
};

export default nextConfig;

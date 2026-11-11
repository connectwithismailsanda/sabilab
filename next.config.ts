import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  serverExternalPackages: ["@electric-sql/pglite", "pg"],
  outputFileTracingIncludes: {
    "/**/*": ["./db/**/*.sql"],
  },
};

export default nextConfig;

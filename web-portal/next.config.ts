import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Pin the workspace root: the monorepo has lockfiles at both the repo root
  // and web-portal, and inference breaks under Windows 8.3 short paths.
  turbopack: {
    root: path.resolve(__dirname),
  },
  // Keep verification builds out of the dev server's .next — a production
  // build while `next dev` runs otherwise clobbers its cache and live routes
  // start 404ing until the dev server restarts.
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;

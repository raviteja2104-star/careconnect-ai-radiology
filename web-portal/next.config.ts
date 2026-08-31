import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Pin the workspace root: the monorepo has lockfiles at both the repo root
  // and web-portal, and inference breaks under Windows 8.3 short paths.
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;

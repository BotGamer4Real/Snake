import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  transpilePackages: ["phaser"],
  output: "export",
  images: { unoptimized: true },
};

export default nextConfig;

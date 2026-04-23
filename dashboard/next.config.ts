import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  /**
   * Standalone sadece Docker/CI uretim build icin; `next dev` ile birlikte kullanildiginda
   * .next chunk uyumsuzlugu (Cannot find module './611.js') olusabiliyor.
   */
  ...(process.env.NEXT_OUTPUT_STANDALONE === "1" ? { output: "standalone" as const } : {}),
  /** Monorepo kokune isaret etmek webpack modul ID'lerini bozabiliyor; bu proje kokunu kullan. */
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;

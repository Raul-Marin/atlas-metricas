import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.join(__dirname),
  async redirects() {
    return [
      // Landing pública en /, /login es legacy y abre la modal vía ?next.
      { source: "/login", destination: "/", permanent: false },
    ];
  },
};

export default nextConfig;

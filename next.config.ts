import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // !! تحذير: هذا سيتجاهل أخطاء TypeScript للسماح بالبناء
    ignoreBuildErrors: true,
  },
};

export default nextConfig;

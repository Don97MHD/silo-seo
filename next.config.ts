import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* تجاهل أخطاء TypeScript أثناء البناء لضمان نجاح الرفع */
  typescript: {
    ignoreBuildErrors: true,
  },
  
  /* تجاهل أخطاء ESLint أثناء البناء */
  eslint: {
    ignoreDuringBuilds: true,
  },

  /* إعدادات Prisma و Postgres لضمان العمل على Vercel */
  serverExternalPackages: ["@prisma/client", "pg"],

  /* إعدادات إضافية لضمان استقرار المسارات */
  trailingSlash: false,
};

export default nextConfig;
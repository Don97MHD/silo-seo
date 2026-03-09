// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  
  // هذه الخاصية تمنع Next.js من محاولة فحص الـ API أثناء البناء
  output: 'standalone', 
  
  serverExternalPackages: ['@prisma/client', 'pg'],
  
  // تعطيل توليد الصفحات الثابتة للـ API
  experimental: {
    authInterrupts: true,
  }
};

export default nextConfig;
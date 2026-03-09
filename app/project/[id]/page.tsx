// app/project/[id]/page.tsx

import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import SiloTree from "./SiloTree";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // جلب المشروع مع جميع روابطه
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      pages: {
        orderBy: { level: "asc" }, // ترتيب الروابط من الجذر للأبناء
      },
    },
  });

  if (!project) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <Link 
          href="/" 
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg transition-colors"
        >
          <ArrowRight className="w-4 h-4" /> العودة للرئيسية
        </Link>
        <div className="flex gap-4 items-center">
          <div className="text-gray-500 text-sm bg-gray-50 px-3 py-1.5 rounded-md border">
            إجمالي الروابط: <span className="font-bold text-gray-800">{project.pages.length}</span>
          </div>
        </div>
      </div>

      {/* استدعاء مكون الشجرة التفاعلي مع تمرير الـ projectId */}
      <SiloTree 
        initialPages={project.pages} 
        projectDomain={project.domain} 
        projectId={project.id} 
      />
    </div>
  );
}
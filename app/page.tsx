// app/page.tsx

import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { FolderKanban, ArrowLeft, Calendar } from "lucide-react";
import AnalyzeForm from "./components/AnalyzeForm";

export default async function Home() {
  // جلب جميع المشاريع السابقة مع عدد الروابط بداخل كل مشروع
  const projects = await prisma.project.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      _count: {
        select: { pages: true }
      }
    }
  });

  return (
    <div className="space-y-10">
      
      {/* القسم العلوي: نموذج إدخال الرابط (مستدعى من المكون المنفصل) */}
      <AnalyzeForm />

      {/* القسم السفلي: عرض المشاريع السابقة */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 border-b pb-2">
          <FolderKanban className="w-6 h-6 text-gray-600" />
          <h3 className="text-2xl font-bold text-gray-800">مشاريعي السابقة</h3>
        </div>
        
        {projects.length === 0 ? (
          <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-8 text-center text-gray-500">
            لا توجد مشاريع سابقة حالياً. قم بتحليل موقع للبدء!
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Link 
                href={`/project/${project.id}`} 
                key={project.id}
                className="bg-white p-6 rounded-xl border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all group relative flex flex-col justify-between min-h-[120px]"
              >
                <div>
                  <h4 className="font-bold text-lg text-gray-800 truncate mb-2" dir="ltr" style={{ textAlign: 'left' }}>
                    {project.domain}
                  </h4>
                </div>
                
                <div className="flex justify-between items-center mt-4 text-sm text-gray-500 border-t pt-3">
                  <span className="flex items-center gap-1 font-medium bg-blue-50 text-blue-700 px-2 py-1 rounded">
                    {project._count.pages} رابط
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {project.updatedAt.toLocaleDateString('en-US')}
                    </span>
                    <ArrowLeft className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
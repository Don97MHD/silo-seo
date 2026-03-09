export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    // إنشاء رابط جديد مضاف يدوياً (مخطط له)
    const newPage = await prisma.page.create({
      data: {
        url: data.url,
        path: data.path,
        title: data.title,
        level: data.level,
        projectId: data.projectId,
        parentId: data.parentId || null,
        isManual: true, // <-- مهم جداً لتمييزه وتلوينه
      }
    });

    return NextResponse.json({ success: true, page: newPage });
  } catch (error) {
    console.error("Error creating manual page:", error);
    return NextResponse.json({ error: "فشل إضافة الرابط الجديد" }, { status: 500 });
  }
}   
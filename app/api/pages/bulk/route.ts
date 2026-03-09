export const dynamic = 'force-dynamic'; // أضف هذا السطر

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { updates } = await req.json(); // [{ id, keywords }]

    // Prisma Transaction لتحديث مجموعة روابط دفعة واحدة بكفاءة
    const transaction = updates.map((update: any) =>
      prisma.page.update({
        where: { id: update.id },
        data: { keywords: update.keywords },
      })
    );

    await prisma.$transaction(transaction);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error bulk updating:", error);
    return NextResponse.json({ error: "فشل تحديث البيانات من الإكسل" }, { status: 500 });
  }
}
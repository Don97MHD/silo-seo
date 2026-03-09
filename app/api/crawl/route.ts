// app/api/crawl/route.ts

import { NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { prisma } from '@/lib/prisma'; // تأكد من استخدام prisma من lib

export async function POST(req: Request) {
  try {
    const { domain } = await req.json();
    const cleanDomain = new URL(domain).origin;
    
    const response = await axios.get(cleanDomain);
    const $ = cheerio.load(response.data);
    
    const links = new Set<string>();
    $('a').each((_, element) => {
      const href = $(element).attr('href');
      if (href && href.startsWith(cleanDomain)) {
        links.add(href);
      }
    });

    const project = await prisma.project.upsert({
      where: { domain: cleanDomain },
      update: {},
      create: { domain: cleanDomain }
    });

    for (const link of Array.from(links).slice(0, 20)) {
      try {
        const pageRes = await axios.get(link);
        const page$ = cheerio.load(pageRes.data);
        const title = page$('title').text();
        
        // استخراج الـ path ليتوافق مع الـ Schema
        const urlObj = new URL(link);
        let path = urlObj.pathname;

        await prisma.page.create({
          data: {
            url: link,
            path: path || '/', // أضفنا هذا السطر لحل المشكلة
            title: title || 'بدون عنوان',
            projectId: project.id,
            isManual: false
          }
        });
      } catch (e) {
        console.error("خطأ في جلب:", link);
      }
    }

    return NextResponse.json({ success: true, projectId: project.id });
  } catch (error) {
    return NextResponse.json({ error: 'حدث خطأ أثناء الزحف' }, { status: 500 });
  }
}
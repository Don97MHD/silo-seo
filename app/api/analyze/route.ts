// app/api/analyze/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as cheerio from 'cheerio';
import crypto from 'crypto';

function extractTitleFromPath(path: string) {
  if (path === '/' || !path) return 'الصفحة الرئيسية';
  const parts = path.split('/').filter(Boolean);
  let cleanName = parts[parts.length - 1].replace(/\.[^/.]+$/, "");
  cleanName = cleanName.replace(/[-_]/g, ' ');
  return cleanName.replace(/\b\w/g, (char) => char.toUpperCase());
}

async function fetchSitemapUrls(url: string, visited = new Set<string>()): Promise<string[]> {
  if (visited.has(url)) return [];
  visited.add(url);
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }});
    if (!res.ok) return [];
    const xml = await res.text();
    const $ = cheerio.load(xml, { xmlMode: true });
    let urls: string[] = [];
    const sitemapTags = $('sitemap loc');
    if (sitemapTags.length > 0) {
      for (let i = 0; i < sitemapTags.length; i++) {
        const subUrls = await fetchSitemapUrls($(sitemapTags[i]).text().trim(), visited);
        urls = urls.concat(subUrls);
      }
    }
    const urlTags = $('url loc');
    if (urlTags.length > 0) {
      urlTags.each(function() { urls.push($(this).text().trim()); });
    }
    return urls;
  } catch (error) {
    return [];
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let { domain, customUrls } = body;
    let cleanDomain = "";
    let urls: string[] = [];

    if (customUrls && Array.isArray(customUrls) && customUrls.length > 0) {
      cleanDomain = new URL(customUrls[0]).origin;
      urls = customUrls.filter(u => u.startsWith(cleanDomain));
    } else if (domain) {
      cleanDomain = new URL(domain).origin;
      urls = await fetchSitemapUrls(`${cleanDomain}/sitemap_index.xml`);
      if (urls.length === 0) urls = await fetchSitemapUrls(`${cleanDomain}/sitemap.xml`);
      if (urls.length === 0) return NextResponse.json({ error: 'لم نتمكن من العثور على روابط.' }, { status: 404 });
    }

    urls = Array.from(new Set(urls));
    urls = urls.map(u => u.endsWith('/') && u.length > cleanDomain.length ? u.slice(0, -1) : u);

    const project = await prisma.project.upsert({
      where: { domain: cleanDomain },
      update: { updatedAt: new Date() },
      create: { domain: cleanDomain }
    });

    await prisma.page.deleteMany({ where: { projectId: project.id, isManual: false } });

    const urlToIdMap = new Map<string, string>();
    const pagesData = [];

    // الاحتفاظ بالروابط اليدوية
    const existingManualPages = await prisma.page.findMany({ where: { projectId: project.id, isManual: true } });
    existingManualPages.forEach(p => urlToIdMap.set(p.url, p.id));

    // 1. ضمان وجود الصفحة الرئيسية كجذر أول
let rootId: string = crypto.randomUUID();
    if (urlToIdMap.has(cleanDomain)) {
      rootId = urlToIdMap.get(cleanDomain)!;
    } else {
      urlToIdMap.set(cleanDomain, rootId);
      pagesData.push({
        id: rootId, url: cleanDomain, path: '/', title: 'الصفحة الرئيسية', level: 0,
        projectId: project.id, parentId: null, isManual: false
      });
    }

    // 2. معالجة كل رابط وإنشاء مساراته المفقودة
    for (const url of urls) {
      if (url === cleanDomain) continue;

      const urlObj = new URL(url);
      let path = urlObj.pathname;
      if (path.endsWith('/') && path.length > 1) path = path.slice(0, -1);

      const segments = path.split('/').filter(Boolean);
      let currentParentId = rootId;
      let currentPath = '';

      // المرور على كل مقطع من الرابط (مثلاً: /products ثم /products/shoes ثم /products/shoes/nike)
      for (let i = 0; i < segments.length; i++) {
        currentPath += '/' + segments[i];
        const currentUrl = cleanDomain + currentPath;

        if (!urlToIdMap.has(currentUrl)) {
          const newId = crypto.randomUUID();
          urlToIdMap.set(currentUrl, newId);

          // هل هذا هو الرابط النهائي أم مسار مفقود (مجلد ضمني)؟
          const isIntermediate = i < segments.length - 1;

          pagesData.push({
            id: newId,
            url: currentUrl,
            path: currentPath,
            title: extractTitleFromPath(currentPath) + (isIntermediate ? ' [مسار ضمني]' : ''),
            level: i + 1,
            projectId: project.id,
            parentId: currentParentId,
            isManual: false // نعتبره آلي لكي يتم حذفه عند إعادة التحليل
          });
        }
        // تحديث الأب للقطعة القادمة من الرابط
        currentParentId = urlToIdMap.get(currentUrl)!;
      }
    }

    if (pagesData.length > 0) {
      await prisma.page.createMany({ data: pagesData });
    }

    return NextResponse.json({ success: true, projectId: project.id, count: pagesData.length });

  } catch (error) {
    console.error("Error analyzing:", error);
    return NextResponse.json({ error: 'حدث خطأ أثناء محاولة المعالجة.' }, { status: 500 });
  }
}
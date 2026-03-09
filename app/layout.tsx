import type { Metadata } from 'next';
import { Cairo } from 'next/font/google';
import './globals.css';

const cairo = Cairo({ subsets: ['arabic'] });

export const metadata: Metadata = {
  title: 'أداة تحليل السيلو | SEO Silo Builder',
  description: 'أداة احترافية لتحليل الروابط وبناء شجرة السيلو لتطوير الـ SEO',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className={`${cairo.className} bg-gray-50 text-gray-900 min-h-screen`}>
        <nav className="bg-white shadow-sm border-b px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600">SiloBuilder Pro</h1>
          <div className="text-sm text-gray-500">منصة بناء السيلو الاحترافية</div>
        </nav>
        <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {children}
        </main>
      </body>
    </html>
  );
}
// app/components/AnalyzeForm.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Network, Loader2, Link2, List } from "lucide-react";

export default function AnalyzeForm() {
  const [mode, setMode] = useState<"sitemap" | "list">("sitemap");
  const [domain, setDomain] = useState("");
  const [urlList, setUrlList] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      let payload = {};

      if (mode === "sitemap") {
        if (!domain) throw new Error("يرجى إدخال رابط الموقع.");
        payload = { domain };
      } else {
        if (!urlList.trim()) throw new Error("يرجى إدخال الروابط.");
        // تحويل النص إلى مصفوفة روابط وتصفية الأسطر الفارغة
        const customUrls = urlList.split("\n").map(u => u.trim()).filter(Boolean);
        if (customUrls.length === 0) throw new Error("لم يتم العثور على روابط صالحة.");
        payload = { customUrls };
      }

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "حدث خطأ غير متوقع");
      }

      router.push(`/project/${data.projectId}`);
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center space-y-4">
      <Network className="w-12 h-12 text-blue-600 mx-auto mb-4" />
      <h2 className="text-3xl font-bold text-gray-800">بناء هيكل موقعك (SEO Silo)</h2>
      <p className="text-gray-500 max-w-2xl mx-auto">
        اختر طريقة استخراج الروابط لبناء شجرة السيلو الخاصة بموقعك أو ابدأ مشروعاً جديداً.
      </p>

      {/* أزرار التبديل بين الـ Sitemap والقائمة المخصصة */}
      <div className="flex justify-center gap-2 mt-6">
        <button
          type="button"
          onClick={() => { setMode("sitemap"); setError(""); }}
          className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-colors ${mode === "sitemap" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
        >
          <Link2 className="w-4 h-4" /> تحليل Sitemap
        </button>
        <button
          type="button"
          onClick={() => { setMode("list"); setError(""); }}
          className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-colors ${mode === "list" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
        >
          <List className="w-4 h-4" /> قائمة روابط يدوية
        </button>
      </div>

      {/* نموذج الإرسال */}
      <form onSubmit={handleAnalyze} className="max-w-xl mx-auto mt-4 flex flex-col gap-3">
        {mode === "sitemap" ? (
          <input
            type="url"
            required
            dir="ltr"
            placeholder="https://example.com"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-left"
          />
        ) : (
          <textarea
            required
            dir="ltr"
            placeholder="https://example.com/page1&#10;https://example.com/page2&#10;ضع كل رابط في سطر منفصل..."
            value={urlList}
            onChange={(e) => setUrlList(e.target.value)}
            rows={5}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-left text-sm"
          />
        )}
        
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white w-full py-3 rounded-lg font-medium transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "ابدأ التحليل وبناء الشجرة"}
        </button>
        
        {error && <p className="text-red-500 text-sm mt-1 font-medium bg-red-50 p-2 rounded">{error}</p>}
      </form>
    </div>
  );
}
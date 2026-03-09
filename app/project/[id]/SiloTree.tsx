// app/project/[id]/SiloTree.tsx

"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronLeft, FileSpreadsheet, Upload, CheckCircle2, Loader2, Plus, Link as LinkIcon, FileText, FolderTree, FolderOpen } from "lucide-react";
import { useDebounce } from "use-debounce";
import * as XLSX from "xlsx";

// ----------------- مكون العقدة (الرابط الواحد) -----------------
const TreeNode = ({ node, allPages, onAddManualNode, isLastChild = false }: { node: any; allPages: any[]; onAddManualNode: (parentId: string, newPath: string) => void, isLastChild?: boolean }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [keyword, setKeyword] = useState(node.keywords || "");
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showAddInput, setShowAddInput] = useState(false);
  const [newPathSlug, setNewPathSlug] = useState("");
  
  const [debouncedKeyword] = useDebounce(keyword, 1000);

  // الحفظ التلقائي للكلمات المفتاحية
  useEffect(() => {
    if (debouncedKeyword !== (node.keywords || "")) {
      const saveKeyword = async () => {
        setIsSaving(true); setSaved(false);
        try {
          await fetch(`/api/pages/${node.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ keywords: debouncedKeyword }),
          });
          node.keywords = debouncedKeyword; 
          setSaved(true);
          setTimeout(() => setSaved(false), 2000); 
        } catch (error) {
          console.error("خطأ في الحفظ:", error);
        } finally {
          setIsSaving(false);
        }
      };
      saveKeyword();
    }
  }, [debouncedKeyword, node.id, node.keywords]);

  // جلب الأبناء
  const children = allPages.filter((p) => p.parentId === node.id);
  const hasChildren = children.length > 0;

  // اكتشاف نوع الرابط
  const isImplicit = node.title?.includes("[مسار ضمني]");
  const cleanTitle = node.title?.replace(" [مسار ضمني]", "") || node.path;

  // تحديد ستايل البطاقة بناءً على نوعها
  let cardStyle = "bg-white border-gray-200 hover:border-blue-400 hover:shadow-md";
  let titleColor = "text-gray-800";
  let icon = hasChildren ? <FolderOpen className="w-5 h-5 text-blue-500" /> : <FileText className="w-5 h-5 text-gray-400" />;

  if (node.isManual) {
    cardStyle = "bg-purple-50/80 border-purple-200 hover:border-purple-400 hover:shadow-md";
    titleColor = "text-purple-800";
    icon = <FileText className="w-5 h-5 text-purple-500" />;
  } else if (isImplicit) {
    cardStyle = "bg-orange-50/50 border-orange-200 border-dashed hover:border-orange-400 hover:shadow-md";
    titleColor = "text-orange-700 italic";
    icon = <FolderTree className="w-5 h-5 text-orange-400" />;
  }

  const handleAddNew = () => {
    if(newPathSlug.trim()) {
      onAddManualNode(node.id, newPathSlug.trim());
      setNewPathSlug("");
      setShowAddInput(false);
      setIsOpen(true);
    }
  };

  return (
    <div className="relative text-sm w-full group/tree">
      
      {/* الخط الأفقي الذي يربط هذه العقدة بالشجرة */}
      {node.parentId && (
        <div className="absolute top-7 -right-6 w-6 border-t-2 border-gray-300 pointer-events-none"></div>
      )}

      {/* الخط العمودي للابن الأخير (لإخفاء الخط الزائد للأسفل) */}
      {node.parentId && isLastChild && (
        <div className="absolute top-7 -right-[26px] w-1 h-full bg-[#f8f9fa] pointer-events-none z-0"></div>
      )}

      {/* محتوى البطاقة */}
      <div className={`relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-4 p-3.5 rounded-xl border transition-all duration-200 mb-3 ${cardStyle}`}>
        
        {/* القسم الأيمن: أيقونة الفتح/الإغلاق + العنوان والرابط */}
        <div className="flex items-center gap-3 flex-1 overflow-hidden min-w-0">
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className={`w-7 h-7 flex items-center justify-center rounded-md transition-colors ${hasChildren ? 'bg-white border shadow-sm hover:bg-gray-50 cursor-pointer' : 'opacity-50 cursor-default'}`}
          >
            {hasChildren ? (isOpen ? <ChevronDown className="w-4 h-4 text-gray-600" /> : <ChevronLeft className="w-4 h-4 text-gray-600" />) : <span className="w-1.5 h-1.5 bg-gray-300 rounded-full"></span>}
          </button>
          
          <div className="flex-shrink-0 bg-white p-1.5 rounded-lg shadow-sm border border-gray-100">
             {icon}
          </div>
          
          <div className="flex flex-col flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className={`font-bold text-base truncate ${titleColor}`}>{cleanTitle}</span>
              {node.isManual && <span className="bg-purple-100 border border-purple-200 text-purple-700 text-[10px] px-2 py-0.5 rounded-md font-bold shadow-sm">صفحة مخططة</span>}
              {isImplicit && <span className="bg-orange-100 border border-orange-200 text-orange-700 text-[10px] px-2 py-0.5 rounded-md font-bold shadow-sm">مجلد هيكلي</span>}
            </div>
            <a href={node.url} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-blue-600 text-[11px] truncate mt-1 flex items-center gap-1.5 w-max" dir="ltr">
              <LinkIcon className="w-3 h-3" /> {node.path === '/' ? node.url : node.path}
            </a>
          </div>
        </div>

        {/* القسم الأيسر: الكلمات المفتاحية وأزرار الإضافة */}
        <div className="flex items-center gap-2 w-full xl:w-[450px] flex-shrink-0 xl:border-r border-gray-200 xl:pr-4">
          <button 
            onClick={() => setShowAddInput(!showAddInput)}
            className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-100"
            title="إضافة صفحة فرعية (Child Silo)"
          >
            <Plus className="w-5 h-5" />
          </button>
          
          <div className="relative w-full flex items-center gap-2">
            <input
              type="text"
              placeholder="الكلمة المفتاحية المستهدفة..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="w-full border border-gray-200 px-4 py-2.5 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 bg-gray-50/50 hover:bg-white transition-all text-gray-700 font-medium placeholder-gray-400 shadow-sm"
            />
            <div className="w-6 flex justify-center absolute left-[-28px]">
               {isSaving && <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />}
               {saved && <CheckCircle2 className="w-5 h-5 text-green-500 drop-shadow-sm" />}
            </div>
          </div>
        </div>
      </div>

      {/* حقل الإضافة السريع */}
      {showAddInput && (
        <div className="mr-10 mb-4 flex gap-2 w-full xl:w-2/3 bg-blue-50/50 p-2.5 rounded-xl border border-blue-100 shadow-inner relative z-10 animate-in fade-in slide-in-from-top-2 duration-200">
          <input 
            type="text" 
            placeholder="مثال: /new-seo-service" 
            dir="ltr"
            className="border border-blue-200 p-2.5 rounded-lg text-sm flex-1 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white shadow-sm"
            value={newPathSlug}
            onChange={(e)=> setNewPathSlug(e.target.value.replace(/ /g, '-'))}
            autoFocus
          />
          <button onClick={handleAddNew} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-bold transition-all shadow-sm hover:shadow active:scale-95">
            حفظ الرابط
          </button>
        </div>
      )}

      {/* رسم الأبناء مع خط الشجرة العمودي */}
      <div className={`transition-all duration-300 origin-top ${isOpen ? 'opacity-100 max-h-[5000px]' : 'opacity-0 max-h-0 overflow-hidden'}`}>
        {hasChildren && (
          <div className="relative pr-6 mr-[13px] border-r-2 border-gray-300">
            {children.map((child, index) => (
              <TreeNode 
                key={child.id} 
                node={child} 
                allPages={allPages} 
                onAddManualNode={onAddManualNode} 
                isLastChild={index === children.length - 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ----------------- المكون الرئيسي للشجرة -----------------
export default function SiloTree({ initialPages, projectDomain, projectId }: { initialPages: any[]; projectDomain: string, projectId: string }) {
  const [pages, setPages] = useState(initialPages);

  // العثور على الجذور (الروابط التي ليس لها أب)
  const rootNodes = pages.filter((p) => !p.parentId);

  const handleAddManualNode = async (parentId: string, newPathSlug: string) => {
    const parentNode = pages.find(p => p.id === parentId);
    
    const cleanSlug = newPathSlug.startsWith('/') ? newPathSlug : `/${newPathSlug}`;
    const parentPath = parentNode?.path === '/' ? '' : (parentNode?.path || '');
    const newPath = `${parentPath}${cleanSlug}`;
    const newUrl = `${projectDomain}${newPath}`;
    
    const generatedTitle = cleanSlug.replace(/[\/-]/g, ' ').trim();

    const tempId = Math.random().toString();
    const newPage = {
      id: tempId, url: newUrl, path: newPath, title: generatedTitle || "صفحة جديدة", 
      keywords: "", level: (parentNode?.level || 0) + 1, projectId, parentId: parentId || null, isManual: true
    };
    
    setPages([...pages, newPage]);

    try {
      const res = await fetch('/api/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPage)
      });
      const data = await res.json();
      if(data.success) {
        setPages(prev => prev.map(p => p.id === tempId ? data.page : p));
      }
    } catch(err) {
      console.error(err);
      alert("فشل إضافة الرابط");
    }
  };

  const exportToExcel = () => {
    const data = pages.map((p) => ({
      ID: p.id,
      "النوع": p.isManual ? "مخطط" : p.title?.includes("[مسار ضمني]") ? "مجلد هيكلي" : "رابط حقيقي",
      "العنوان (Title)": p.title?.replace(" [مسار ضمني]", "") || p.path,
      "الرابط (URL)": p.url,
      "الكلمات المفتاحية": p.keywords || "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Silo Structure");
    XLSX.writeFile(workbook, `Silo-${projectDomain.replace("https://", "")}.xlsx`);
  };

  const importFromExcel = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: "binary" });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data: any[] = XLSX.utils.sheet_to_json(ws);

      const updates = data.filter(row => row.ID).map((row) => ({
        id: row.ID,
        keywords: row["الكلمات المفتاحية"] || "",
      }));

      alert("جاري تحديث البيانات من ملف الإكسل...");
      
      const res = await fetch("/api/pages/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      });

      if (res.ok) {
        alert("تم استيراد الكلمات المفتاحية بنجاح! سيتم تحديث الصفحة.");
        window.location.reload();
      } else {
        alert("حدث خطأ أثناء الاستيراد.");
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="bg-white rounded-2xl shadow-[0_2px_20px_rgb(0,0,0,0.04)] border border-gray-100 p-6 xl:p-8">
      
      {/* الترويسة وأزرار التحكم */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-8 gap-6 border-b border-gray-100 pb-6">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">هيكل السيلو التفصيلي</h2>
          <a href={projectDomain} target="_blank" dir="ltr" className="text-blue-600 hover:text-blue-800 hover:underline text-base block mt-2 font-medium bg-blue-50 w-max px-3 py-1 rounded-md transition-colors">
            {projectDomain}
          </a>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <button onClick={() => handleAddManualNode("", "/new-root-category")} className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm hover:shadow-md active:scale-95">
            <Plus className="w-5 h-5" /> تصنيف جذري جديد
          </button>
          
          <button onClick={exportToExcel} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm hover:shadow-md active:scale-95">
            <FileSpreadsheet className="w-5 h-5" /> تصدير Excel
          </button>
          
          <label className="flex items-center gap-2 bg-gray-800 hover:bg-gray-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm hover:shadow-md active:scale-95 cursor-pointer">
            <Upload className="w-5 h-5" /> استيراد Excel
            <input type="file" accept=".xlsx, .xls" className="hidden" onChange={importFromExcel} />
          </label>
        </div>
      </div>

      {/* حاوية الشجرة */}
      <div className="bg-[#f8f9fa] p-4 xl:p-8 rounded-2xl border border-gray-200/80 min-h-[600px] shadow-inner">
        
        {/* ترويسة الجدول التوضيحية */}
        <div className="hidden xl:flex font-bold text-gray-400 border-b-2 border-gray-200 pb-4 mb-6 text-sm px-6 uppercase tracking-wider">
          <div className="flex-1">شجرة الروابط والتسلسل الهرمي (Pages Hierarchy)</div>
          <div className="w-[450px] pr-4 border-r border-gray-200">الكلمات المفتاحية المستهدفة (Target Keywords)</div>
        </div>

        {/* عرض الشجرة (Root Nodes) */}
        <div className="relative">
          {rootNodes.map((node, index) => (
            <TreeNode 
              key={node.id} 
              node={node} 
              allPages={pages} 
              onAddManualNode={handleAddManualNode} 
              isLastChild={index === rootNodes.length - 1} 
            />
          ))}
        </div>
        
        {/* حالة عدم وجود بيانات */}
        {rootNodes.length === 0 && (
          <div className="text-center py-32 flex flex-col items-center justify-center">
             <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                <FolderTree className="w-12 h-12 text-gray-400" />
             </div>
             <p className="text-gray-800 text-2xl font-bold">لا توجد روابط لعرضها هنا.</p>
             <p className="text-gray-500 text-base mt-3 max-w-md">اضغط على "تصنيف جذري جديد" بالأعلى للبدء بتخطيط السيلو الخاص بمشروعك بشكل يدوي.</p>
          </div>
        )}
      </div>
    </div>
  );
}
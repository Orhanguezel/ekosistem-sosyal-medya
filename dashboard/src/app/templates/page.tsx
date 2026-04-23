"use client";

import { useEffect, useState } from "react";
import { templates, tenants } from "@/lib/api";
import { getStoredTenantKey, resolveTenantKey, setStoredTenantKey } from "@/lib/tenant";
import { 
  FileText, 
  Plus, 
  MessageSquare, 
  Repeat, 
  Code, 
  Share2, 
  Layout, 
  Search, 
  RefreshCw, 
  ChevronRight,
  Zap,
  Globe,
  Tag,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Send,
  MoreVertical,
  Edit2,
  Trash2,
  Play
} from "lucide-react";

function parseTemplateVariableNames(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.filter((v): v is string => typeof v === "string");
  }
  if (typeof raw !== "string" || !raw.trim()) {
    return [];
  }
  const s = raw.trim();
  try {
    const parsed: unknown = JSON.parse(s);
    if (Array.isArray(parsed)) {
      return parsed.filter((v): v is string => typeof v === "string");
    }
  } catch {
    // CSV fallback
  }
  return s.split(",").map((part) => part.trim()).filter(Boolean);
}

const typeIcons: Record<string, any> = {
  haber: <FileText size={18} />,
  etkilesim: <MessageSquare size={18} />,
  ilan: <Tag size={18} />,
  nostalji: <Repeat size={18} />,
  tanitim: <Zap size={18} />,
  kampanya: <Share2 size={18} />,
};

const typeColors: Record<string, string> = {
  haber: "bg-blue-50 text-blue-600 border-blue-100",
  etkilesim: "bg-emerald-50 text-emerald-600 border-emerald-100",
  ilan: "bg-amber-50 text-amber-600 border-amber-100",
  nostalji: "bg-purple-50 text-purple-600 border-purple-100",
  tanitim: "bg-orange-50 text-orange-600 border-orange-100",
  kampanya: "bg-rose-50 text-rose-600 border-rose-100",
};

export default function TemplatesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tenantKey, setTenantKey] = useState("");
  const [tenantItems, setTenantItems] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    tenants.list().then((d) => {
      setTenantItems(d.items);
      const nextTenantKey = resolveTenantKey(d.items, getStoredTenantKey());
      setTenantKey(nextTenantKey);
      if (nextTenantKey) setStoredTenantKey(nextTenantKey);
    }).catch(() => setTenantItems([]));
  }, []);

  useEffect(() => {
    if (!tenantKey) return;
    setLoading(true);
    templates.list(tenantKey)
      .then((d) => setItems(d.items))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [tenantKey]);

  const filteredItems = items.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.postType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">İçerik Şablonları</h1>
          <p className="text-slate-500 font-medium">Hızlı ve tutarlı içerik üretimi için hazır şablonları yönetin.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-1.5 flex shadow-sm h-fit">
            <select
              className="bg-transparent border-none text-sm font-bold text-slate-700 focus:ring-0 cursor-pointer pl-4 pr-10 py-2 outline-none"
              value={tenantKey}
              onChange={(e) => {
                setTenantKey(e.target.value);
                setStoredTenantKey(e.target.value);
              }}
            >
              {tenantItems.map((t: any) => (
                <option key={t.key} value={t.key}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          
          <button className="flex items-center gap-2 px-6 py-3.5 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition-all font-bold shadow-xl shadow-slate-900/10">
            <Plus size={20} />
            Yeni Şablon
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="relative group">
         <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
         <input 
          type="text" 
          placeholder="Şablon adı veya türüne göre ara..." 
          className="w-full bg-white border border-slate-200 rounded-[24px] pl-14 pr-8 py-5 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-semibold text-slate-700 shadow-sm"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
         />
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-20 space-y-4">
          <RefreshCw className="animate-spin text-indigo-500" size={40} />
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Şablonlar Yükleniyor...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredItems.map((t) => {
            const variableNames = parseTemplateVariableNames(t.variables);
            return (
              <div key={t.id} className="bg-white rounded-[32px] border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden flex flex-col group">
                {/* Card Header */}
                <div className="p-8 pb-4">
                   <div className="flex items-start justify-between mb-6">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-sm ${typeColors[t.postType] || "bg-slate-50 text-slate-600 border-slate-100"}`}>
                        {typeIcons[t.postType] || <Layout size={20} />}
                      </div>
                      <div className="flex items-center gap-1">
                         <PlatformIcon platform={t.platform} />
                      </div>
                   </div>
                   
                   <div className="space-y-1">
                      <h3 className="text-lg font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">{t.name}</h3>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.postType}</p>
                   </div>
                </div>

                {/* Content Preview */}
                <div className="px-8 py-4 flex-1">
                   <div className="bg-slate-50 rounded-2xl p-5 relative overflow-hidden h-32 group-hover:bg-indigo-50/30 transition-colors">
                      <p className="text-xs font-medium text-slate-600 leading-relaxed line-clamp-4 italic">
                        "{t.captionTemplate}"
                      </p>
                      <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-slate-50 to-transparent group-hover:from-indigo-50/50"></div>
                   </div>
                   
                   {t.hashtags && (
                     <div className="mt-4 flex flex-wrap gap-1.5">
                        {t.hashtags.split(' ').slice(0, 3).map((h: string, idx: number) => (
                           <span key={idx} className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                             {h}
                           </span>
                        ))}
                        {t.hashtags.split(' ').length > 3 && (
                           <span className="text-[10px] font-bold text-slate-400 px-1">+ {t.hashtags.split(' ').length - 3}</span>
                        )}
                     </div>
                   )}
                </div>

                {/* Footer / Actions */}
                <div className="p-8 pt-4 space-y-6">
                   {variableNames.length > 0 && (
                     <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
                        <Code size={14} className="text-slate-400 shrink-0" />
                        {variableNames.map((v) => (
                          <span key={v} className="text-[10px] font-mono font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded-lg shrink-0">
                             {`{${v}}`}
                          </span>
                        ))}
                     </div>
                   )}

                   <div className="flex items-center justify-between border-t border-slate-50 pt-6">
                      <div className="flex items-center gap-2 text-slate-400">
                         <Repeat size={14} />
                         <span className="text-[11px] font-bold uppercase tracking-wider">{t.usageCount} Kullanım</span>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <button className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                           <Trash2 size={18} />
                        </button>
                        <a
                          href={`/posts/new?template=${t.id}`}
                          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/10"
                        >
                          <Play size={16} fill="currentColor" />
                          Oluştur
                        </a>
                      </div>
                   </div>
                </div>
              </div>
            );
          })}
          
          {filteredItems.length === 0 && (
             <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-300 space-y-4">
                <Layout size={64} className="opacity-20" />
                <p className="font-bold text-slate-400 text-lg">Şablon bulunamadı.</p>
             </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Local UI Components ───────────────────────────────────

function PlatformIcon({ platform }: { platform: string }) {
  if (platform === "both") return (
    <div className="flex items-center -space-x-2">
       <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center border-2 border-white shadow-sm" title="Facebook">
          <Facebook size={14} />
       </div>
       <div className="w-8 h-8 bg-pink-50 text-pink-600 rounded-full flex items-center justify-center border-2 border-white shadow-sm" title="Instagram">
          <Instagram size={14} />
       </div>
    </div>
  );
  
  const icons: Record<string, any> = {
    facebook: <Facebook size={14} className="text-blue-600" />,
    instagram: <Instagram size={14} className="text-pink-600" />,
    x: <Twitter size={14} className="text-slate-900" />,
    twitter: <Twitter size={14} className="text-slate-900" />,
    linkedin: <Linkedin size={14} className="text-blue-700" />,
    telegram: <Send size={14} className="text-sky-500" />,
  };
  
  const colors: Record<string, string> = {
    facebook: "bg-blue-50",
    instagram: "bg-pink-50",
    x: "bg-slate-50",
    twitter: "bg-slate-50",
    linkedin: "bg-blue-50",
    telegram: "bg-sky-50",
  };

  return (
    <div className={`w-8 h-8 ${colors[platform] || "bg-slate-50"} rounded-full flex items-center justify-center border border-slate-100 shadow-sm`}>
       {icons[platform] || <Globe size={14} />}
    </div>
  );
}

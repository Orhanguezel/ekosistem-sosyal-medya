"use client";

import { Dispatch, SetStateAction } from "react";
import { 
  Link2, 
  Plus, 
  Trash2, 
  Globe, 
  ExternalLink, 
  FileText, 
  Info,
  AlertCircle
} from "lucide-react";

type Row = { url: string; sourceDomain?: string; title?: string };

export function MarketingBacklinksSection(props: {
  blRows: Row[];
  setBlRows: Dispatch<SetStateAction<Row[]>>;
}) {
  const { blRows, setBlRows } = props;

  const addRow = () => setBlRows([...blRows, { url: "", sourceDomain: "", title: "" }]);
  const removeRow = (index: number) => setBlRows(blRows.filter((_, i) => i !== index));
  const updateRow = (index: number, field: keyof Row, value: string) => {
    const next = [...blRows];
    next[index] = { ...next[index], [field]: value };
    setBlRows(next);
  };

  return (
    <section className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
      <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/20">
            <Link2 size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Geri Bağlantılar (Backlinks)</h2>
            <p className="text-xs text-slate-400 font-medium">Kritik dış bağlantıları manuel olarak takip edin.</p>
          </div>
        </div>
        <button
          onClick={addRow}
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all font-bold text-sm shadow-xl shadow-slate-900/10"
        >
          <Plus size={18} /> Yeni Satır
        </button>
      </div>

      <div className="p-8 space-y-6">
        <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 flex gap-3">
          <Info size={18} className="text-blue-500 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-800/70 font-medium leading-relaxed">
            Google Search Console API tam bir dış bağlantı listesi sağlamaz. Önemli tanıtım yazıları, reklam yayınları ve kritik backlink kaynaklarını buradan listeleyebilirsiniz.
          </p>
        </div>

        <div className="space-y-3">
          {blRows.map((row, i) => (
            <div key={i} className="flex flex-col md:flex-row items-center gap-4 p-4 bg-slate-50/50 border border-slate-100 rounded-2xl group hover:bg-white hover:shadow-md transition-all">
              <div className="flex-1 w-full relative">
                 <Link2 size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                 <input
                  className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                  placeholder="Bağlantı URL"
                  value={row.url}
                  onChange={(e) => updateRow(i, "url", e.target.value)}
                />
              </div>
              <div className="w-full md:w-64 relative">
                 <Globe size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                 <input
                  className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                  placeholder="Kaynak Domain"
                  value={row.sourceDomain ?? ""}
                  onChange={(e) => updateRow(i, "sourceDomain", e.target.value)}
                />
              </div>
              <div className="w-full md:w-64 relative">
                 <FileText size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                 <input
                  className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                  placeholder="Başlık (Opsiyonel)"
                  value={row.title ?? ""}
                  onChange={(e) => updateRow(i, "title", e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                 {row.url && (
                   <a href={row.url} target="_blank" rel="noreferrer" className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                      <ExternalLink size={16} />
                   </a>
                 )}
                 <button
                  onClick={() => removeRow(i)}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}

          {blRows.length === 0 && (
             <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-slate-100 rounded-[24px] text-slate-300">
                <Link2 size={32} className="mb-2" />
                <p className="text-xs font-bold">Henüz backlink eklenmedi</p>
                <button onClick={addRow} className="mt-4 text-xs font-bold text-indigo-600 hover:underline">İlk satırı ekleyin</button>
             </div>
          )}
        </div>
      </div>
    </section>
  );
}

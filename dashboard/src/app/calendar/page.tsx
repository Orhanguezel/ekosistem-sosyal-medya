"use client";

import { useEffect, useState } from "react";
import { calendar, tenants } from "@/lib/api";
import { getStoredTenantKey, resolveTenantKey, setStoredTenantKey } from "@/lib/tenant";
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  RefreshCw, 
  Zap, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Filter,
  FileText,
  MessageSquare,
  Tag,
  Repeat,
  Share2,
  MoreVertical,
  Layout
} from "lucide-react";

interface CalendarEntry {
  id: number;
  date: string;
  timeSlot: string;
  postType: string;
  platform: string;
  status: string;
  postId: number | null;
  notes: string | null;
}

const typeIcons: Record<string, any> = {
  haber: <FileText size={12} />,
  etkilesim: <MessageSquare size={12} />,
  ilan: <Tag size={12} />,
  nostalji: <Repeat size={12} />,
  tanitim: <Zap size={12} />,
  kampanya: <Share2 size={12} />,
};

const statusColors: Record<string, string> = {
  published: "bg-emerald-50 text-emerald-700 border-emerald-100",
  content_ready: "bg-blue-50 text-blue-700 border-blue-100",
  pending: "bg-slate-50 text-slate-600 border-slate-100",
  failed: "bg-rose-50 text-rose-700 border-rose-100",
};

const slotLabels: Record<string, string> = {
  morning: "S", afternoon: "O", evening: "A",
};

const monthNames = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];

export default function CalendarPage() {
  const [entries, setEntries] = useState<CalendarEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [tenantKey, setTenantKey] = useState("");
  const [tenantItems, setTenantItems] = useState<any[]>([]);

  useEffect(() => {
    tenants.list().then((d) => {
      setTenantItems(d.items);
      const nextTenantKey = resolveTenantKey(d.items, getStoredTenantKey());
      setTenantKey(nextTenantKey);
      if (nextTenantKey) setStoredTenantKey(nextTenantKey);
    }).catch(() => setTenantItems([]));
  }, []);

  useEffect(() => {
    if (!tenantKey) {
      setEntries([]);
      setLoading(false);
      return;
    }
    loadCalendar();
  }, [currentMonth, tenantKey]);

  async function loadCalendar() {
    setLoading(true);
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const from = `${year}-${String(month + 1).padStart(2, "0")}-01`;
    const lastDay = new Date(year, month + 1, 0).getDate();
    const to = `${year}-${String(month + 1).padStart(2, "0")}-${lastDay}`;

    try {
      const data = await calendar.list(from, to, tenantKey);
      setEntries(data.items);
    } catch (err) {
      console.error(err);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateWeek() {
    const today = new Date().toISOString().split("T")[0];
    if (!tenantKey) return;
    try {
      await calendar.generateWeek(today, tenantKey);
      loadCalendar();
    } catch (err) {
      alert((err as Error).message);
    }
  }

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const days: (number | null)[] = [];
  for (let i = 0; i < adjustedFirstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  function getEntriesForDay(day: number): CalendarEntry[] {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return entries.filter((e) => {
      const entryDate = new Date(e.date);
      const d = `${entryDate.getFullYear()}-${String(entryDate.getMonth() + 1).padStart(2, "0")}-${String(entryDate.getDate()).padStart(2, "0")}`;
      return d === dateStr;
    });
  }

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">İçerik Takvimi</h1>
          <p className="text-slate-500 font-medium">Sosyal medya stratejinizi ay bazında planlayın ve izleyin.</p>
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
          
          <button 
            onClick={handleGenerateWeek}
            disabled={!tenantKey || loading}
            className="flex items-center gap-2 px-6 py-3.5 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all font-bold shadow-xl shadow-indigo-600/10 disabled:opacity-50"
          >
            <Zap size={20} fill="currentColor" />
            Haftalık Plan Oluştur
          </button>
        </div>
      </div>

      {/* Calendar Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
         <div className="flex items-center gap-4">
            <button 
              onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}
              className="p-3 hover:bg-slate-50 rounded-2xl border border-slate-100 transition-all text-slate-600"
            >
               <ChevronLeft size={20} />
            </button>
            <h2 className="text-xl font-black text-slate-900 min-w-[150px] text-center">
              {monthNames[month]} {year}
            </h2>
            <button 
              onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}
              className="p-3 hover:bg-slate-50 rounded-2xl border border-slate-100 transition-all text-slate-600"
            >
               <ChevronRight size={20} />
            </button>
         </div>

         <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
               <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
               <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Yayınlandı</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
               <div className="w-2 h-2 rounded-full bg-blue-500"></div>
               <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Hazır</span>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50 rounded-xl transition-all text-slate-400 font-bold text-xs uppercase tracking-widest">
               <Filter size={14} /> Filtrele
            </button>
         </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-[40px] border border-slate-100 shadow-2xl overflow-hidden relative group">
        {loading && (
          <div className="absolute inset-0 z-20 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
             <RefreshCw className="animate-spin text-indigo-600" size={48} />
          </div>
        )}

        {/* Days Header */}
        <div className="grid grid-cols-7 bg-slate-50/50 border-b border-slate-100">
          {["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"].map((d) => (
            <div key={d} className="px-6 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
              {d}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7">
          {days.map((day, idx) => {
            const dayEntries = day ? getEntriesForDay(day) : [];
            const isToday =
              day === new Date().getDate() &&
              month === new Date().getMonth() &&
              year === new Date().getFullYear();

            return (
              <div
                key={idx}
                className={`min-h-[160px] border-b border-r border-slate-50 p-4 transition-all duration-300 ${
                  day ? "bg-white hover:bg-indigo-50/20" : "bg-slate-50/30"
                } ${isToday ? "bg-indigo-50/40 relative ring-2 ring-inset ring-indigo-500/20" : ""}`}
              >
                {day && (
                  <div className="flex flex-col h-full space-y-3">
                    <div className="flex items-center justify-between">
                       <span className={`text-sm font-black ${isToday ? "text-indigo-600" : "text-slate-400"}`}>
                         {String(day).padStart(2, '0')}
                       </span>
                       {isToday && <span className="text-[9px] font-black bg-indigo-600 text-white px-2 py-0.5 rounded-full uppercase tracking-tighter">Bugün</span>}
                    </div>

                    <div className="space-y-2 overflow-y-auto max-h-[110px] scrollbar-none">
                      {dayEntries.map((entry) => (
                        <div
                          key={entry.id}
                          className={`group/entry flex items-center gap-2 p-2 rounded-xl border transition-all hover:shadow-md cursor-pointer ${statusColors[entry.status] || "bg-slate-50 text-slate-600 border-slate-100"}`}
                          title={`${entry.timeSlot}: ${entry.postType}`}
                        >
                           <div className="w-5 h-5 rounded-lg bg-white/50 flex items-center justify-center shrink-0">
                              {typeIcons[entry.postType] || <Layout size={10} />}
                           </div>
                           <div className="min-w-0 flex-1">
                              <p className="text-[10px] font-black truncate leading-tight uppercase tracking-tight">
                                {slotLabels[entry.timeSlot]} · {entry.postType}
                              </p>
                           </div>
                        </div>
                      ))}
                    </div>

                    {day && dayEntries.length === 0 && (
                       <button className="flex-1 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <div className="w-8 h-8 rounded-full bg-slate-50 text-slate-300 flex items-center justify-center hover:bg-indigo-50 hover:text-indigo-500 transition-all border border-dashed border-slate-200">
                             <Plus size={16} />
                          </div>
                       </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend & Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
         <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm flex flex-col gap-6">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
               <Clock size={16} className="text-indigo-500" /> Zaman Dilimleri
            </h3>
            <div className="flex flex-wrap gap-4">
               <div className="flex items-center gap-3 px-5 py-3 bg-slate-50 rounded-[20px] border border-slate-100">
                  <span className="text-sm font-black text-indigo-600">S</span>
                  <span className="text-xs font-bold text-slate-600">Sabah (09:00)</span>
               </div>
               <div className="flex items-center gap-3 px-5 py-3 bg-slate-50 rounded-[20px] border border-slate-100">
                  <span className="text-sm font-black text-amber-600">O</span>
                  <span className="text-xs font-bold text-slate-600">Öğle (13:00)</span>
               </div>
               <div className="flex items-center gap-3 px-5 py-3 bg-slate-50 rounded-[20px] border border-slate-100">
                  <span className="text-sm font-black text-blue-600">A</span>
                  <span className="text-xs font-bold text-slate-600">Akşam (19:00)</span>
               </div>
            </div>
         </div>

         <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm flex flex-col gap-6">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
               <Tag size={16} className="text-indigo-500" /> İçerik Türleri
            </h3>
            <div className="flex flex-wrap gap-3">
               {Object.entries(typeIcons).map(([type, icon]) => (
                  <div key={type} className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
                     <span className="text-indigo-600">{icon}</span>
                     <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">{type}</span>
                  </div>
               ))}
            </div>
         </div>
      </div>
    </div>
  );
}

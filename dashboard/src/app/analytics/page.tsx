"use client";

import { useEffect, useState } from "react";
import { analytics, posts } from "@/lib/api";
import { 
  BarChart3, 
  TrendingUp, 
  Activity, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  RefreshCw, 
  Share2, 
  ThumbsUp, 
  MessageCircle, 
  Eye,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Layers,
  Zap
} from "lucide-react";

export default function AnalyticsPage() {
  const [overview, setOverview] = useState<any>(null);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [o, s] = await Promise.all([
          analytics.overview().catch(() => null),
          posts.stats(),
        ]);
        setOverview(o);
        setStats(s);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <RefreshCw className="animate-spin text-indigo-500" size={40} />
        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Analizler Hazırlanıyor...</p>
      </div>
    );
  }

  const totalPosts = Object.values(stats).reduce((a, b) => a + b, 0);

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Performans Analitiği</h1>
          <p className="text-slate-500 font-medium">Paylaşımlarınızın ve platform etkileşimlerinizin anlık özeti.</p>
        </div>
        <div className="flex items-center gap-3">
           <div className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-2xl text-xs font-bold border border-emerald-100 flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
              Canlı Veri
           </div>
           <button 
            onClick={() => window.location.reload()}
            className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-2xl hover:bg-slate-50 transition-all shadow-sm"
           >
              <RefreshCw size={18} />
           </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         <MetricCard 
          title="Toplam İçerik" 
          value={totalPosts} 
          icon={<Layers size={22} className="text-indigo-600" />} 
          description="Tüm zamanlar"
          trend="+12%"
          isPositive
         />
         <MetricCard 
          title="Yayınlanan" 
          value={stats.posted || 0} 
          icon={<CheckCircle2 size={22} className="text-emerald-600" />} 
          description="Aktif paylaşımlar"
          trend="+5%"
          isPositive
         />
         <MetricCard 
          title="Zamanlanan" 
          value={stats.scheduled || 0} 
          icon={<Clock size={22} className="text-blue-600" />} 
          description="Gelecek gönderiler"
          trend="Stabil"
         />
         <MetricCard 
          title="Hata / İptal" 
          value={(stats.failed || 0) + (stats.cancelled || 0)} 
          icon={<AlertCircle size={22} className="text-rose-600" />} 
          description="Sorunlu gönderiler"
          trend="-2%"
          isPositive={false}
         />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Status Distribution */}
        <section className="lg:col-span-2 bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-lg shadow-slate-900/20">
                <BarChart3 size={20} />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Gönderi Durum Dağılımı</h2>
            </div>
          </div>
          <div className="p-8 flex-1 flex flex-col justify-center space-y-10">
             <div className="flex h-12 w-full rounded-2xl overflow-hidden shadow-inner bg-slate-50">
                {Object.entries(stats).map(([status, count]) => {
                  const percentage = totalPosts > 0 ? (count / totalPosts) * 100 : 0;
                  const colors: Record<string, string> = {
                    draft: "bg-slate-300",
                    scheduled: "bg-blue-500",
                    posted: "bg-emerald-500",
                    failed: "bg-rose-500",
                    cancelled: "bg-slate-400",
                    publishing: "bg-amber-400",
                  };
                  if (count === 0) return null;
                  return (
                    <div
                      key={status}
                      className={`${colors[status] || "bg-slate-300"} transition-all duration-500 hover:brightness-110 relative group`}
                      style={{ width: `${Math.max(percentage, 1)}%` }}
                    >
                       <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                          {status.toUpperCase()}: {count} ({percentage.toFixed(1)}%)
                       </div>
                    </div>
                  );
                })}
             </div>

             <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {Object.entries(stats).map(([status, count]) => {
                   const colors: Record<string, string> = {
                    draft: "bg-slate-300",
                    scheduled: "bg-blue-500",
                    posted: "bg-emerald-500",
                    failed: "bg-rose-500",
                    cancelled: "bg-slate-400",
                    publishing: "bg-amber-400",
                  };
                  return (
                    <div key={status} className="flex items-center gap-3 p-3 rounded-2xl border border-slate-50 hover:bg-slate-50 transition-colors">
                       <div className={`w-3 h-3 rounded-full ${colors[status]}`}></div>
                       <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">{status}</p>
                          <p className="text-sm font-bold text-slate-800">{count}</p>
                       </div>
                    </div>
                  );
                })}
             </div>
          </div>
        </section>

        {/* Weekly Performance */}
        <section className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-50 flex items-center gap-3 bg-slate-50/30">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/20">
              <TrendingUp size={20} />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Haftalık Özet</h2>
          </div>
          <div className="p-8 space-y-8">
             {overview ? (
               <>
                 <div className="space-y-6">
                    <div className="flex items-end justify-between">
                       <div>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Bu Hafta</p>
                          <p className="text-4xl font-extrabold text-slate-900">{overview.postedThisWeek || 0}</p>
                       </div>
                       <div className="flex items-center gap-1 text-emerald-500 font-bold text-sm bg-emerald-50 px-2 py-1 rounded-lg">
                          <ArrowUpRight size={16} /> 12%
                       </div>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                       <div className="h-full bg-indigo-600 rounded-full" style={{ width: '65%' }}></div>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                       <div className="flex items-center gap-3">
                          <Zap size={18} className="text-amber-500" />
                          <span className="text-sm font-bold text-slate-700">Toplam Yayınlanan</span>
                       </div>
                       <span className="text-lg font-extrabold text-slate-900">{overview.totalPosted || 0}</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                       <div className="flex items-center gap-3">
                          <Calendar size={18} className="text-indigo-500" />
                          <span className="text-sm font-bold text-slate-700">Paylaşım Sıklığı</span>
                       </div>
                       <span className="text-sm font-bold text-slate-500">~2.4 / gün</span>
                    </div>
                 </div>
               </>
             ) : (
               <div className="py-12 text-center text-slate-400 font-medium">Veri yüklenemedi.</div>
             )}
          </div>
        </section>
      </div>

      {/* Interactions / Best Posts Section (Placeholder Logic) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <section className="lg:col-span-2 bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/20">
                  <Zap size={20} />
                </div>
                <h2 className="text-xl font-bold text-slate-900">En İyi Performans Gösterenler</h2>
              </div>
            </div>
            <div className="p-8">
               {overview?.topPosts?.length > 0 ? (
                 <div className="space-y-4">
                    {overview.topPosts.map((p: any, i: number) => (
                       <div key={i} className="flex items-center justify-between p-5 bg-slate-50 rounded-[24px] border border-transparent hover:border-emerald-100 hover:bg-white hover:shadow-xl transition-all group">
                          <div className="flex items-center gap-4">
                             <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-slate-400 group-hover:scale-110 transition-transform">
                                <Activity size={24} />
                             </div>
                             <div>
                                <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">Post ID: #{p.postId}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{p.platform}</p>
                             </div>
                          </div>
                          <div className="flex items-center gap-6">
                             <InteractionStat icon={<ThumbsUp size={14}/>} value={p.likes} label="Beğeni" />
                             <InteractionStat icon={<MessageCircle size={14}/>} value={p.comments} label="Yorum" />
                             <InteractionStat icon={<Share2 size={14}/>} value={p.shares} label="Paylaşım" />
                             <div className="hidden sm:flex flex-col items-end">
                                <p className="text-xs font-black text-emerald-600">%{p.engagementRate}</p>
                                <p className="text-[9px] font-bold text-slate-400 uppercase">Etkileşim</p>
                             </div>
                          </div>
                       </div>
                    ))}
                 </div>
               ) : (
                 <div className="flex flex-col items-center justify-center py-20 text-slate-300 space-y-4">
                    <Activity size={48} className="opacity-20" />
                    <p className="font-bold text-slate-400 text-sm">Henüz yeterli etkileşim verisi toplanmadı.</p>
                 </div>
               )}
            </div>
         </section>

         <section className="bg-indigo-900 rounded-[32px] p-8 text-white relative overflow-hidden shadow-2xl shadow-indigo-900/20">
            <div className="absolute top-0 right-0 p-10 opacity-10">
               <TrendingUp size={200} />
            </div>
            <div className="relative z-10 space-y-8 h-full flex flex-col">
               <div className="space-y-2">
                  <h3 className="text-2xl font-black">Pro Analizler</h3>
                  <p className="text-indigo-200 text-sm font-medium">Platformlarınızı bağlayın, verileri derinlemesine inceleyin.</p>
               </div>

               <div className="space-y-4 flex-1">
                  <FeatureItem label="Platform Etkileşim Oranları" />
                  <FeatureItem label="Haftalık Erişim Grafikleri" />
                  <FeatureItem label="En İyi Paylaşım Saatleri" />
                  <FeatureItem label="Otomatik Raporlama (PDF)" />
               </div>

               <div className="p-5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
                  <p className="text-xs font-bold leading-relaxed">
                     Facebook ve Instagram hesaplarını bağladığınızda, beğeniden erişime kadar tüm metrikler otomatik olarak toplanır.
                  </p>
               </div>
            </div>
         </section>
      </div>
    </div>
  );
}

// ─── Local UI Components ───────────────────────────────────

function MetricCard({ title, value, icon, description, trend, isPositive }: { title: string, value: number | string, icon: React.ReactNode, description: string, trend?: string, isPositive?: boolean }) {
  return (
    <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm group hover:shadow-xl hover:scale-[1.02] transition-all duration-500">
       <div className="flex items-center justify-between mb-6">
          <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:bg-white group-hover:shadow-lg transition-all">
             {icon}
          </div>
          {trend && (
             <span className={`text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1 ${
               isPositive === undefined ? "bg-slate-50 text-slate-400" :
               isPositive ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
             }`}>
                {isPositive === true && <ArrowUpRight size={14} />}
                {isPositive === false && <ArrowDownRight size={14} />}
                {trend}
             </span>
          )}
       </div>
       <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{title}</p>
       <p className="text-4xl font-black text-slate-900 mb-2">{value}</p>
       <p className="text-xs text-slate-400 font-medium">{description}</p>
    </div>
  );
}

function InteractionStat({ icon, value, label }: { icon: React.ReactNode, value: number | string, label: string }) {
  return (
    <div className="flex flex-col items-center gap-1 min-w-[50px]">
       <div className="text-slate-400">{icon}</div>
       <p className="text-[11px] font-bold text-slate-700">{value || 0}</p>
       <p className="text-[8px] font-bold text-slate-400 uppercase">{label}</p>
    </div>
  );
}

function FeatureItem({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3">
       <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></div>
       <span className="text-sm font-bold text-indigo-100">{label}</span>
    </div>
  );
}

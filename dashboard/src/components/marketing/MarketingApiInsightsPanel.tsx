"use client";

import { 
  BarChart3, 
  Target, 
  Link2, 
  RefreshCw, 
  Zap, 
  Activity, 
  PieChart, 
  TrendingUp, 
  Layout, 
  Globe,
  AlertCircle,
  Database,
  ArrowUpRight
} from "lucide-react";

export function MarketingApiInsightsPanel(props: {
  onLoadGa4: () => void;
  onLoadAdsCampaigns: () => void;
  onSyncBacklinks: () => void;
  ga4: any;
  adsCampaigns: any;
  blSync: any;
}) {
  const { onLoadGa4, onLoadAdsCampaigns, onSyncBacklinks, ga4, adsCampaigns, blSync } = props;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* GA4 Insights Panel */}
      <section className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/20">
              <BarChart3 size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">GA4 Analizleri</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Analytics Data API</p>
            </div>
          </div>
          <button
            onClick={onLoadGa4}
            className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all shadow-sm"
          >
            <RefreshCw size={18} />
          </button>
        </div>
        <div className="p-8 flex-1 overflow-auto max-h-[500px] space-y-6">
          {ga4 ? (
            <div className="space-y-6">
              {ga4.error ? (
                <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-xs font-medium flex items-center gap-3">
                  <AlertCircle size={16} />
                  {ga4.error}
                </div>
              ) : ga4.configured ? (
                <div className="space-y-8">
                   <div className="grid grid-cols-2 gap-4">
                      <MetricCard label="Mülk Kimliği" value={ga4.property?.split('/').pop() || "Bilinmiyor"} icon={<Database size={12}/>} />
                      <MetricCard label="Durum" value="Aktif" icon={<Activity size={12}/>} isSuccess />
                   </div>

                   <div className="space-y-4">
                      <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                         <TrendingUp size={14} className="text-emerald-500" /> Günlük Performans (Örnek)
                      </h4>
                      <div className="bg-slate-900 rounded-2xl p-4 overflow-hidden">
                         <pre className="text-[10px] font-mono text-emerald-400 overflow-auto max-h-[150px] scrollbar-thin scrollbar-thumb-slate-700">
                          {JSON.stringify((ga4.dailyRows ?? []).slice(0, 5), null, 2)}
                        </pre>
                      </div>
                   </div>

                   <div className="space-y-4">
                      <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                         <Layout size={14} className="text-blue-500" /> Popüler Sayfalar
                      </h4>
                      <div className="space-y-2">
                        {(ga4.topPages ?? []).slice(0, 5).map((r: any, i: number) => (
                           <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                              <span className="text-xs font-medium text-slate-600 truncate max-w-[200px]">
                                {r.dimensionValues?.[0]?.value || "Bilinmiyor"}
                              </span>
                              <span className="text-[10px] font-bold text-emerald-600">{r.metricValues?.[0]?.value} Olay</span>
                           </div>
                        ))}
                      </div>
                   </div>
                </div>
              ) : (
                <p className="text-sm text-slate-400 font-medium">{ga4.message}</p>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-slate-100 rounded-[24px] text-slate-300">
               <PieChart size={32} className="mb-2" />
               <p className="text-xs font-bold">API verilerini çekmek için butona tıklayın</p>
            </div>
          )}
        </div>
      </section>

      {/* Google Ads Campaigns Panel */}
      <section className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Target size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Google Ads Kampanyaları</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Google Ads API</p>
            </div>
          </div>
          <button
            onClick={onLoadAdsCampaigns}
            className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all shadow-sm"
          >
            <RefreshCw size={18} />
          </button>
        </div>
        <div className="p-8 flex-1 overflow-auto max-h-[500px]">
           {adsCampaigns ? (
             <div className="space-y-4">
                {adsCampaigns.error ? (
                  <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-xs font-medium flex items-center gap-3">
                    <AlertCircle size={16} />
                    {adsCampaigns.error}
                  </div>
                ) : adsCampaigns.configured ? (
                  <div className="space-y-3">
                     {(adsCampaigns.campaigns ?? []).map((c: any, i: number) => (
                       <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-transparent hover:border-amber-100 hover:bg-white hover:shadow-sm transition-all group">
                          <div className="flex items-center gap-3">
                             <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                             <div>
                                <p className="text-xs font-bold text-slate-800 group-hover:text-amber-600 transition-colors">{c.name}</p>
                                <p className="text-[10px] text-slate-400 font-medium">#{c.id}</p>
                             </div>
                          </div>
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${c.status === 'ENABLED' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-100 text-slate-500'}`}>
                             {c.status}
                          </span>
                       </div>
                     ))}
                     {(adsCampaigns.campaigns ?? []).length === 0 && (
                        <p className="text-center py-10 text-slate-400 font-medium">Aktif kampanya bulunamadı.</p>
                     )}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 font-medium">{adsCampaigns.message}</p>
                )}
             </div>
           ) : (
            <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-slate-100 rounded-[24px] text-slate-300">
               <Target size={32} className="mb-2" />
               <p className="text-xs font-bold">Kampanyaları listelemek için butona tıklayın</p>
            </div>
           )}
        </div>
      </section>

      {/* Backlink Summary Panel */}
      <section className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden lg:col-span-2">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/20">
              <Link2 size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Backlink & Domain Özeti</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">DataForSEO Entegrasyonu</p>
            </div>
          </div>
          <button
            onClick={onSyncBacklinks}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-bold shadow-lg shadow-indigo-600/10"
          >
            <RefreshCw size={18} /> Verileri Güncelle
          </button>
        </div>
        <div className="p-8">
           {blSync ? (
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <MetricCard label="Domain" value={blSync.domain || "Bilinmiyor"} icon={<Globe size={12}/>} />
                <MetricCard label="Backlinks" value={blSync.summary?.backlinks || "0"} icon={<Link2 size={12}/>} />
                <MetricCard label="Yönlendiren Alan Adları" value={blSync.summary?.referring_domains || "0"} icon={<ArrowUpRight size={12}/>} />
             </div>
           ) : null}
           
           <div className="bg-slate-900 rounded-[24px] p-8 overflow-hidden relative group">
              <div className="absolute top-4 right-4 text-slate-700 font-mono text-[10px] uppercase">JSON RAW</div>
              {blSync ? (
                <pre className="text-[11px] font-mono text-indigo-300 overflow-auto max-h-[300px] scrollbar-thin scrollbar-thumb-slate-700">
                  {JSON.stringify(blSync, null, 2)}
                </pre>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-slate-600 space-y-3">
                   <Zap size={32} />
                   <p className="text-xs font-bold">DataForSEO üzerinden domain özetini çekmek için butona tıklayın</p>
                </div>
              )}
           </div>
        </div>
      </section>
    </div>
  );
}

function MetricCard({ label, value, icon, isSuccess }: { label: string, value: string, icon: React.ReactNode, isSuccess?: boolean }) {
  return (
    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col gap-1">
       <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          {icon} {label}
       </div>
       <p className={`text-sm font-bold ${isSuccess ? 'text-emerald-600' : 'text-slate-800'}`}>{value}</p>
    </div>
  );
}

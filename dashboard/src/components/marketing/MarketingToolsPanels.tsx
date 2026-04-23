"use client";

import { 
  Globe, 
  Search, 
  Target, 
  ExternalLink, 
  RefreshCw, 
  Download, 
  Database,
  Code,
  Layout,
  TrendingUp,
  MousePointer2,
  Eye,
  AlertCircle
} from "lucide-react";

export function MarketingToolsPanels(props: {
  onFetchRemote: () => void;
  onLoadGsc: () => void;
  onLoadAds: () => void;
  remote: any;
  gsc: any;
  ads: any;
}) {
  const { onFetchRemote, onLoadGsc, onLoadAds, remote, gsc, ads } = props;
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Remote Sync Panel */}
      <section className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-lg shadow-slate-900/20">
              <Download size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Uzak Veri Senkronizasyonu</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Public JSON API</p>
            </div>
          </div>
          <button
            onClick={onFetchRemote}
            className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all shadow-sm"
          >
            <RefreshCw size={18} />
          </button>
        </div>
        <div className="p-8 flex-1 space-y-4">
          <p className="text-sm text-slate-500 font-medium">
            Tanımlanan "Site Ayarları JSON URL" üzerinden pazarlama meta verilerini anlık olarak çekin.
          </p>
          {remote ? (
            <div className="bg-slate-900 rounded-2xl p-6 overflow-hidden">
               <pre className="text-[11px] font-mono text-emerald-400 overflow-auto max-h-[250px] scrollbar-thin scrollbar-thumb-slate-700">
                {JSON.stringify(remote, null, 2)}
              </pre>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-slate-100 rounded-[24px] text-slate-300">
               <Code size={32} className="mb-2" />
               <p className="text-xs font-bold">Henüz veri çekilmedi</p>
            </div>
          )}
        </div>
      </section>

      {/* Search Console Summary */}
      <section className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/20">
              <Search size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Search Console Özeti</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Son 28 Gün</p>
            </div>
          </div>
          <button
            onClick={onLoadGsc}
            className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all shadow-sm"
          >
            <RefreshCw size={18} />
          </button>
        </div>
        <div className="p-8 flex-1 overflow-auto max-h-[400px]">
          {gsc ? (
            <div className="space-y-6">
               {gsc.error ? (
                 <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-xs font-medium flex items-center gap-3">
                    <AlertCircle size={16} />
                    {gsc.error}
                 </div>
               ) : gsc.configured ? (
                 <div className="space-y-6">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase">
                       <span>{gsc.dateRange?.start} — {gsc.dateRange?.end}</span>
                       <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">Canlı Veri</span>
                    </div>

                    <div className="space-y-3">
                       <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                          <TrendingUp size={14} className="text-indigo-500" /> Popüler Sorgular
                       </h4>
                       <div className="space-y-2">
                          {(gsc.topQueries ?? []).slice(0, 5).map((r: any, i: number) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                               <span className="text-xs font-bold text-slate-700 truncate max-w-[150px]">
                                 {(r.keys ?? []).join(" · ")}
                               </span>
                               <div className="flex items-center gap-3">
                                  <span className="flex items-center gap-1 text-[10px] text-slate-500 font-bold"><MousePointer2 size={10}/> {r.clicks}</span>
                                  <span className="flex items-center gap-1 text-[10px] text-slate-500 font-bold"><Eye size={10}/> {r.impressions}</span>
                               </div>
                            </div>
                          ))}
                       </div>
                    </div>

                    <div className="space-y-3">
                       <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                          <Layout size={14} className="text-emerald-500" /> Popüler Sayfalar
                       </h4>
                       <div className="space-y-2">
                          {(gsc.topPages ?? []).slice(0, 5).map((r: any, i: number) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                               <span className="text-xs font-medium text-slate-600 truncate max-w-[200px]">
                                 {(r.keys ?? []).join(" · ")}
                               </span>
                               <span className="text-[10px] font-bold text-indigo-600">{r.clicks} Tık</span>
                            </div>
                          ))}
                       </div>
                    </div>
                 </div>
               ) : (
                 <p className="text-sm text-slate-400">{gsc.message}</p>
               )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-slate-100 rounded-[24px] text-slate-300">
               <Search size={32} className="mb-2" />
               <p className="text-xs font-bold text-center px-6">Verileri yüklemek için butona tıklayın</p>
            </div>
          )}
        </div>
      </section>

      {/* Ads & Links Panel */}
      <section className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden lg:col-span-2">
         <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Target size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Platform Arayüz Bağlantıları</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Hızlı Erişim</p>
            </div>
          </div>
          <button
            onClick={onLoadAds}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-all shadow-sm font-bold text-xs"
          >
            <RefreshCw size={14} /> Bağlantıları Güncelle
          </button>
        </div>
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
           {ads?.links ? (
             <>
               <ExternalLinkCard label="Google Ads Ana Sayfa" url={ads.links.googleAdsHome} color="bg-blue-50 text-blue-600" />
               <ExternalLinkCard label="Kampanya Özeti" url={ads.links.overview} color="bg-indigo-50 text-indigo-600" />
               <ExternalLinkCard label="Kampanyalar" url={ads.links.campaigns} color="bg-emerald-50 text-emerald-600" />
               {ads.searchConsoleUiUrl && (
                 <ExternalLinkCard label="Search Console (Mülk)" url={ads.searchConsoleUiUrl} color="bg-orange-50 text-orange-600" />
               )}
             </>
           ) : (
              <div className="col-span-full py-6 text-center text-slate-400 font-medium">Bağlantıları görüntülemek için butona tıklayın.</div>
           )}
        </div>
        {ads?.note && (
           <div className="px-8 pb-8">
              <div className="p-4 bg-slate-50 rounded-2xl flex gap-3">
                 <AlertCircle size={16} className="text-slate-400 shrink-0 mt-0.5" />
                 <p className="text-[11px] text-slate-500 font-medium leading-relaxed">{ads.note}</p>
              </div>
           </div>
        )}
      </section>
    </div>
  );
}

function ExternalLinkCard({ label, url, color }: { label: string, url: string, color: string }) {
  return (
    <a 
      href={url} 
      target="_blank" 
      rel="noreferrer"
      className="p-5 bg-white border border-slate-100 rounded-2xl flex flex-col justify-between gap-4 hover:shadow-lg hover:border-indigo-100 transition-all group"
    >
       <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center`}>
          <ExternalLink size={18} />
       </div>
       <div>
          <p className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{label}</p>
          <p className="text-[10px] text-slate-400 font-medium truncate mt-1">Arayüzü yeni sekmede aç</p>
       </div>
    </a>
  );
}

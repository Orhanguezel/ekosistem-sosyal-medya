"use client";

import { useEffect, useState } from "react";
import { storage, siteSettings } from "@/lib/api";
import { getStoredTenantKey, resolveStorageAssetUrl, resolveTenantAssetUrl } from "@/lib/tenant";
import { Upload, Globe, Image as ImageIcon, Save, CheckCircle2, AlertCircle, Info, Trash2, RefreshCw, Zap } from "lucide-react";

const FALLBACK_LOGO_URL = "/uploads/brand/ekosistem-sosyal-logo.svg";

export default function SiteSettingsPage() {
  const siteSettingKeys = [
    "site_title",
    "site_description",
    "global_logo_asset_id",
    "global_logo_url",
    "global_favicon_asset_id",
    "global_favicon_url",
    "global_favicon_ico_asset_id",
    "global_favicon_ico_url",
  ] as const;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [tenantKey, setTenantKey] = useState("");
  const [globalData, setGlobalData] = useState<Record<string, string>>({
    site_title: "",
    site_description: "",
    global_logo_asset_id: "",
    global_logo_url: "",
    global_favicon_asset_id: "",
    global_favicon_url: "",
    global_favicon_ico_asset_id: "",
    global_favicon_ico_url: "",
  });

  async function loadData() {
    try {
      const tk = getStoredTenantKey();
      setTenantKey(tk);

      const globalObj: Record<string, string> = {
        site_title: "",
        site_description: "",
        global_logo_asset_id: "",
        global_logo_url: "",
        global_favicon_asset_id: "",
        global_favicon_url: "",
        global_favicon_ico_asset_id: "",
        global_favicon_ico_url: "",
      };

      const results = await Promise.all(
        siteSettingKeys.map(async (key) => {
          try {
            const item = await siteSettings.get(key);
            return { key, value: item?.value ?? "" };
          } catch {
            return { key, value: "" };
          }
        })
      );

      results.forEach(({ key, value }) => {
        globalObj[key] = value;
      });
      setGlobalData(globalObj);
    } catch (err) {
      console.error("Veri yukleme hatasi:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleGlobalSave() {
    setSaving("global");
    try {
      const entries = [
        ["site_title", globalData.site_title],
        ["site_description", globalData.site_description],
        ["global_logo_asset_id", globalData.global_logo_asset_id],
        ["global_logo_url", globalData.global_logo_url],
        ["global_favicon_asset_id", globalData.global_favicon_asset_id],
        ["global_favicon_url", globalData.global_favicon_url],
        ["global_favicon_ico_asset_id", globalData.global_favicon_ico_asset_id],
        ["global_favicon_ico_url", globalData.global_favicon_ico_url],
      ] as const;

      await Promise.all(
        entries.map(([key, value]) => siteSettings.upsert({ key, value }))
      );
      alert("Global ayarlar kaydedildi.");
    } catch (err) {
      alert("Global ayar hatasi: " + (err as Error).message);
    } finally {
      setSaving(null);
    }
  }

  async function handleFileUpload(
    e: React.ChangeEvent<HTMLInputElement>,
    assetIdKey: "global_logo_asset_id" | "global_favicon_asset_id" | "global_favicon_ico_asset_id",
    urlKey: "global_logo_url" | "global_favicon_url" | "global_favicon_ico_url"
  ) {
    const file = e.target.files?.[0];
    if (!file) return;

    setSaving(assetIdKey);
    try {
      const res = await storage.upload(file, "brand");
      const nextData = {
        ...globalData,
        [assetIdKey]: res.id || "",
        [urlKey]: res.url || "",
      };

      setGlobalData(nextData);
      await Promise.all([
        siteSettings.upsert({ key: assetIdKey, value: nextData[assetIdKey] }),
        siteSettings.upsert({ key: urlKey, value: nextData[urlKey] }),
      ]);
    } catch (err) {
      alert("Yukleme hatasi: " + (err as Error).message);
    } finally {
      setSaving(null);
      e.target.value = "";
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="animate-spin h-12 w-12 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
        <p className="text-slate-500 font-medium animate-pulse">Ayarlar Yukleniyor...</p>
      </div>
    );
  }

  // Helper to ensure URL starts with /uploads/ if it's a relative path
  const fixUrl = (url?: string | null) => {
    if (!url) return null;
    if (url.startsWith("http")) return url;
    if (url.startsWith("/uploads/")) return url;
    if (url.startsWith("uploads/")) return `/${url}`;
    return `/uploads/${url}`;
  };

  const logoPreview =
    resolveTenantAssetUrl(fixUrl(globalData.global_logo_url)) ||
    resolveStorageAssetUrl(globalData.global_logo_asset_id) ||
    resolveTenantAssetUrl(FALLBACK_LOGO_URL) ||
    FALLBACK_LOGO_URL;

  const faviconPreview =
    resolveTenantAssetUrl(fixUrl(globalData.global_favicon_url)) ||
    resolveStorageAssetUrl(globalData.global_favicon_asset_id);

  const faviconIcoPreview =
    resolveTenantAssetUrl(fixUrl(globalData.global_favicon_ico_url)) ||
    resolveStorageAssetUrl(globalData.global_favicon_ico_asset_id);

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">SaaS Site Ayarları</h1>
          <p className="text-slate-500 font-medium text-lg">Platform genelindeki marka kimliğini ve SEO yapılandırmasını yönetin.</p>
        </div>
        <div className="flex items-center gap-3">
            <button
                onClick={() => window.location.reload()}
                className="p-3 bg-white border border-slate-200 text-slate-600 rounded-2xl hover:bg-slate-50 transition-all shadow-sm"
                title="Sayfayı Yenile"
            >
                <RefreshCw size={20} />
            </button>
            <button
                onClick={handleGlobalSave}
                disabled={!!saving}
                className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 disabled:opacity-50 font-bold active:scale-95"
            >
            {saving === "global" ? (
                <><div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> Kaydediliyor...</>
            ) : (
                <><Save size={18} /> Tüm Ayarları Kaydet</>
            )}
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sol Kolon: Yapılandırma */}
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex items-center gap-3 bg-slate-50/30">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/20">
                <Globe size={20} />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Genel Yapılandırma</h2>
            </div>
            <div className="p-8 space-y-8">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Site Başlığı (SEO)</label>
                <input
                  type="text"
                  value={globalData.site_title}
                  onChange={(e) => setGlobalData(s => ({ ...s, site_title: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-semibold text-slate-700"
                  placeholder="Örn: Sosyal Medya SaaS"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Meta Açıklaması (Description)</label>
                <textarea
                  rows={4}
                  value={globalData.site_description}
                  onChange={(e) => setGlobalData(s => ({ ...s, site_description: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-semibold text-slate-700 resize-none"
                  placeholder="Arama sonuçlarında görünecek kısa açıklama..."
                />
              </div>
            </div>
          </section>

          <section className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex items-center gap-3 bg-slate-50/30">
              <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-lg shadow-purple-600/20">
                <ImageIcon size={20} />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Marka Varlıkları (Assets)</h2>
            </div>
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-10">
              {/* Logo Upload */}
              <div className="space-y-6">
                <div className="group relative flex flex-col items-center justify-center p-12 border-2 border-dashed border-slate-200 rounded-[40px] bg-slate-50/50 hover:bg-slate-50 hover:border-indigo-300 transition-all duration-500 overflow-hidden">
                  <div className="w-full h-32 flex items-center justify-center mb-8 relative z-10">
                    <img
                      src={logoPreview}
                      alt="Mevcut Logo"
                      className="max-h-full max-w-full object-contain group-hover:scale-110 transition-transform duration-700 drop-shadow-sm"
                      onError={(e) => {
                          (e.target as HTMLImageElement).src = FALLBACK_LOGO_URL;
                      }}
                    />
                  </div>
                  <label className="cursor-pointer relative z-20">
                    <span className="px-8 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold shadow-sm hover:shadow-xl hover:-translate-y-1 flex items-center gap-2 transition-all active:scale-95 text-slate-900">
                      <Upload size={18} className="text-indigo-600" />
                      Logo Değiştir
                    </span>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/svg+xml,image/png,image/jpeg" 
                      onChange={(e) => handleFileUpload(e, "global_logo_asset_id", "global_logo_url")}
                      disabled={!!saving}
                    />
                  </label>
                  {saving === "global_logo_asset_id" && (
                    <div className="absolute inset-0 bg-white/90 backdrop-blur-sm rounded-[40px] flex flex-col items-center justify-center z-30">
                      <div className="animate-spin h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full mb-4"></div>
                      <p className="text-xs font-bold text-slate-900 uppercase tracking-widest">Yükleniyor...</p>
                    </div>
                  )}
                  {/* Backdrop decoration */}
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </div>
                <div className="px-4">
                  <h4 className="text-sm font-bold text-slate-900 mb-1">Global Logo</h4>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed">SaaS paneli ve tüm varsayılan alanlarda kullanılan ana logo.</p>
                </div>
              </div>

              {/* Favicon Upload */}
              <div className="space-y-6">
                <div className="group relative flex flex-col items-center justify-center p-12 border-2 border-dashed border-slate-200 rounded-[40px] bg-slate-50/50 hover:bg-slate-50 hover:border-indigo-300 transition-all duration-500 overflow-hidden">
                  <div className="w-24 h-24 flex items-center justify-center mb-8 bg-white rounded-[28px] shadow-xl border border-slate-100 p-5 group-hover:rotate-12 transition-all duration-700 relative z-10">
                    {faviconPreview ? (
                      <img 
                        src={faviconPreview} 
                        alt="Favicon" 
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <Globe size={32} className="text-slate-200" />
                    )}
                  </div>
                  <label className="cursor-pointer relative z-20">
                    <span className="px-8 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold shadow-sm hover:shadow-xl hover:-translate-y-1 flex items-center gap-2 transition-all active:scale-95 text-slate-900">
                      <Upload size={18} className="text-indigo-600" />
                      Favicon Yükle
                    </span>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/svg+xml,image/png" 
                      onChange={(e) => handleFileUpload(e, "global_favicon_asset_id", "global_favicon_url")}
                      disabled={!!saving}
                    />
                  </label>
                  {saving === "global_favicon_asset_id" && (
                    <div className="absolute inset-0 bg-white/90 backdrop-blur-sm rounded-[40px] flex flex-col items-center justify-center z-30">
                      <div className="animate-spin h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full mb-4"></div>
                      <p className="text-xs font-bold text-slate-900 uppercase tracking-widest">Yükleniyor...</p>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </div>
                <div className="px-4">
                  <h4 className="text-sm font-bold text-slate-900 mb-1">Modern Favicon</h4>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed">Tarayıcı sekmeleri için SVG veya yüksek çözünürlüklü PNG.</p>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Sağ Kolon */}
        <div className="space-y-8">
          <div className="bg-slate-900 rounded-[40px] p-10 text-white shadow-2xl shadow-slate-900/40 relative overflow-hidden group">
            <div className="relative z-10">
              <h3 className="text-xl font-bold mb-8 flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400">
                    <Info size={24} />
                </div>
                Sistem Özeti
              </h3>
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b border-white/5 pb-5">
                  <span className="text-slate-400 text-sm font-bold uppercase tracking-widest">Mod</span>
                  <span className="font-bold text-indigo-400 text-xs bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">GLOBAL SaaS</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/5 pb-5">
                  <span className="text-slate-400 text-sm font-bold uppercase tracking-widest">Sunucu</span>
                  <span className="font-bold text-emerald-400 text-xs flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    Online
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm font-bold uppercase tracking-widest">Asset Yolu</span>
                  <span className="font-mono text-[10px] text-slate-500">/uploads/brand/*</span>
                </div>
              </div>
              
              <div className="mt-10 p-5 bg-white/5 rounded-2xl border border-white/5 text-[11px] text-slate-400 leading-relaxed italic">
                "Burada yapılan her değişiklik anında tüm alt projelere ve yönetim paneline yansıtılır. Lütfen yüksek çözünürlüklü varlıklar kullanın."
              </div>
            </div>
            {/* Decorative Background */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-[80px] -mr-24 -mt-24 group-hover:bg-indigo-500/20 transition-colors duration-700"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full blur-[60px] -ml-16 -mb-16 group-hover:bg-purple-500/20 transition-colors duration-700"></div>
          </div>

          <div className="bg-amber-50/50 border border-amber-100 rounded-[40px] p-10 relative overflow-hidden">
            <div className="relative z-10 flex flex-col gap-5">
              <div className="bg-amber-100 w-12 h-12 rounded-2xl flex items-center justify-center text-amber-600 shadow-sm">
                <AlertCircle size={28} />
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-amber-900">Önemli Hatırlatma</h3>
                <p className="text-sm text-amber-800/70 leading-relaxed font-medium">
                  Marka varlıkları artık tenant bazlı değil, panel genelinde merkezi olarak yönetilmektedir.
                </p>
                <div className="space-y-3">
                    <div className="flex items-center gap-3 text-xs font-bold text-amber-800/80 bg-amber-100/50 p-3 rounded-xl border border-amber-200/50">
                        <CheckCircle2 size={14} /> Logo yolu otomatik çözümlenir.
                    </div>
                    <div className="flex items-center gap-3 text-xs font-bold text-amber-800/80 bg-amber-100/50 p-3 rounded-xl border border-amber-200/50">
                        <CheckCircle2 size={14} /> Favicon modern tarayıcılar içindir.
                    </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[40px] border border-slate-100 p-10 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Zap className="text-indigo-500" size={20} />
                Hızlı İşlemler
            </h3>
            <div className="space-y-3">
              <a href="/settings" className="flex items-center justify-between p-5 rounded-2xl bg-slate-50 hover:bg-slate-900 hover:text-white transition-all group border border-slate-100">
                <span className="text-sm font-bold text-slate-600 group-hover:text-white">Tenant Ayarları</span>
                <Save size={18} className="text-slate-400 group-hover:text-indigo-400" />
              </a>
              <button 
                onClick={() => window.location.reload()} 
                className="w-full flex items-center justify-between p-5 rounded-2xl bg-slate-50 hover:bg-slate-900 hover:text-white transition-all group border border-slate-100"
              >
                <span className="text-sm font-bold text-slate-600 group-hover:text-white">Cache Temizle</span>
                <Trash2 size={18} className="text-rose-400" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



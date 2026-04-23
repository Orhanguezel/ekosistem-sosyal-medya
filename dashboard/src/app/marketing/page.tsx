"use client";

import { useEffect, useState } from "react";
import { marketing, tenants } from "@/lib/api";
import { getStoredTenantKey, resolveTenantKey, setStoredTenantKey } from "@/lib/tenant";
import { MarketingTagsSection } from "@/components/marketing/MarketingTagsSection";
import { MarketingToolsPanels } from "@/components/marketing/MarketingToolsPanels";
import { MarketingApiInsightsPanel } from "@/components/marketing/MarketingApiInsightsPanel";
import { MarketingBacklinksSection } from "@/components/marketing/MarketingBacklinksSection";
import { GoogleAdsManagementPanel } from "@/components/marketing/GoogleAdsManagementPanel";
import { 
  BarChart3, 
  Settings2, 
  Link2, 
  RefreshCw, 
  Zap, 
  Globe, 
  Search, 
  Target,
  Activity,
  Save,
  Database,
  PieChart,
  Layout,
  Layers,
  Code
} from "lucide-react";

type Row = { url: string; sourceDomain?: string; title?: string };
type TabType = "tracking" | "insights" | "ads" | "backlinks";

export default function MarketingPage() {
  const [activeTab, setActiveTab] = useState<TabType>("tracking");
  const [tenantKey, setTenantKey] = useState("");
  const [tenantItems, setTenantItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    gtmContainerId: "",
    ga4MeasurementId: "",
    ga4PropertyId: "",
    googleAdsCustomerId: "",
    googleAdsManagerId: "",
    searchConsoleSiteUrl: "",
    siteSettingsApiUrl: "",
    notes: "",
  });
  const [gsc, setGsc] = useState<any>(null);
  const [remote, setRemote] = useState<any>(null);
  const [ads, setAds] = useState<any>(null);
  const [ga4, setGa4] = useState<any>(null);
  const [adsCampaigns, setAdsCampaigns] = useState<any>(null);
  const [blSync, setBlSync] = useState<any>(null);
  const [blRows, setBlRows] = useState<Row[]>([]);

  useEffect(() => {
    tenants.list().then((data) => {
      setTenantItems(data.items);
      const nextTenantKey = resolveTenantKey(data.items, getStoredTenantKey());
      setTenantKey(nextTenantKey);
      if (nextTenantKey) setStoredTenantKey(nextTenantKey);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!tenantKey) return;
    marketing.settings(tenantKey).then((data) => {
      setForm({
        gtmContainerId: data.gtmContainerId ?? "",
        ga4MeasurementId: data.ga4MeasurementId ?? "",
        ga4PropertyId: data.ga4PropertyId ?? "",
        googleAdsCustomerId: data.googleAdsCustomerId ?? "",
        googleAdsManagerId: data.googleAdsManagerId ?? "",
        searchConsoleSiteUrl: data.searchConsoleSiteUrl ?? "",
        siteSettingsApiUrl: data.siteSettingsApiUrl ?? "",
        notes: data.marketingJson?.notes ?? "",
      });
      setBlRows(data.marketingJson?.backlinks?.rows ?? []);
    });
  }, [tenantKey]);

  async function save() {
    setSaving(true);
    try {
      await marketing.updateSettings({
        tenantKey,
        gtmContainerId: form.gtmContainerId.trim() || null,
        ga4MeasurementId: form.ga4MeasurementId.trim() || null,
        ga4PropertyId: form.ga4PropertyId.trim() || null,
        googleAdsCustomerId: form.googleAdsCustomerId.trim() || null,
        googleAdsManagerId: form.googleAdsManagerId.trim() || null,
        searchConsoleSiteUrl: form.searchConsoleSiteUrl.trim() || null,
        siteSettingsApiUrl: form.siteSettingsApiUrl.trim() || null,
        marketingJson: {
          notes: form.notes.trim() || undefined,
          backlinks: {
            rows: blRows.filter((r) => r.url.trim()),
            updatedAt: new Date().toISOString(),
            source: "manual" as const,
          },
        },
      });
      alert("Pazarlama ayarları kaydedildi.");
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function loadGsc() {
    try {
      const data = await marketing.gscSummary(tenantKey);
      setGsc(data);
    } catch (e) { alert((e as Error).message); }
  }

  async function fetchSiteJson() {
    try {
      const data = await marketing.siteSettingsFetch(tenantKey);
      setRemote(data);
    } catch (e) { alert((e as Error).message); }
  }

  async function loadAdsLinks() {
    try {
      const data = await marketing.googleAdsLinks(tenantKey);
      setAds(data);
    } catch (e) { alert((e as Error).message); }
  }

  async function loadGa4() {
    try {
      const data = await marketing.ga4Summary(tenantKey);
      setGa4(data);
    } catch (e) { alert((e as Error).message); }
  }

  async function loadAdsCampaigns() {
    try {
      const data = await marketing.googleAdsCampaigns(tenantKey);
      setAdsCampaigns(data);
    } catch (e) { alert((e as Error).message); }
  }

  async function syncBacklinks() {
    try {
      const data = await marketing.backlinksSync(tenantKey);
      setBlSync(data);
    } catch (e) { alert((e as Error).message); }
  }

  async function discoverIds() {
    try {
      const data = await marketing.discoverTrackingIds(tenantKey);
      if (data.gtmId || data.ga4Id) {
        setForm(f => ({
          ...f,
          gtmContainerId: data.gtmId || f.gtmContainerId,
          ga4MeasurementId: data.ga4Id || f.ga4MeasurementId,
        }));
        alert(`Buldum! GTM: ${data.gtmId || 'Yok'}, GA4: ${data.ga4Id || 'Yok'}`);
      } else {
        alert("Sitede takip kodu bulunamadı.");
      }
    } catch (e) { alert((e as Error).message); }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <RefreshCw className="animate-spin text-indigo-500" size={40} />
        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Pazarlama Paneli Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Pazarlama & Ölçüm</h1>
          <p className="text-slate-500 font-medium">GTM, GA4, Ads ve Search Console verilerini tek noktadan yönetin.</p>
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
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 px-8 py-3.5 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition-all font-bold shadow-xl shadow-slate-900/10 disabled:opacity-50"
          >
            {saving ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
            Ayarları Kaydet
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-[24px] w-fit">
        <TabButton 
          active={activeTab === "tracking"} 
          onClick={() => setActiveTab("tracking")} 
          icon={<Layers size={18} />} 
          label="Takip Kodları & API" 
        />
        <TabButton 
          active={activeTab === "insights"} 
          onClick={() => setActiveTab("insights")} 
          icon={<Activity size={18} />} 
          label="Veri & Analizler" 
        />
        <TabButton 
          active={activeTab === "ads"} 
          onClick={() => setActiveTab("ads")} 
          icon={<Target size={18} />} 
          label="Ads Yönetimi" 
        />
        <TabButton 
          active={activeTab === "backlinks"} 
          onClick={() => setActiveTab("backlinks")} 
          icon={<Link2 size={18} />} 
          label="Backlink Yönetimi" 
        />
      </div>

      {/* Main Content Areas */}
      <div className="space-y-12">
        {activeTab === "tracking" && (
          <div className="animate-in slide-in-from-bottom-4 duration-500 space-y-10">
            <MarketingTagsSection 
              form={form} 
              setForm={setForm} 
              saving={saving} 
              onSave={save} 
              onDiscover={discoverIds}
            />
            <MarketingToolsPanels
              remote={remote}
              gsc={gsc}
              ads={ads}
              onFetchRemote={fetchSiteJson}
              onLoadGsc={loadGsc}
              onLoadAds={loadAdsLinks}
            />
          </div>
        )}

        {activeTab === "insights" && (
          <div className="animate-in slide-in-from-bottom-4 duration-500 space-y-10">
            <MarketingApiInsightsPanel
              ga4={ga4}
              adsCampaigns={adsCampaigns}
              blSync={blSync}
              onLoadGa4={loadGa4}
              onLoadAdsCampaigns={loadAdsCampaigns}
              onSyncBacklinks={syncBacklinks}
            />
          </div>
        )}

        {activeTab === "ads" && (
          <div className="animate-in slide-in-from-bottom-4 duration-500">
            <GoogleAdsManagementPanel tenantKey={tenantKey} />
          </div>
        )}

        {activeTab === "backlinks" && (
          <div className="animate-in slide-in-from-bottom-4 duration-500">
            <MarketingBacklinksSection blRows={blRows} setBlRows={setBlRows} />
          </div>
        )}
      </div>

      {/* Quick Summary Cards (Fixed Bottom or Side) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-10 border-t border-slate-100">
         <StatsPreviewCard title="GTM Container" value={form.gtmContainerId || "Tanımlanmadı"} icon={<TagIcon />} />
         <StatsPreviewCard title="GA4 Measurement" value={form.ga4MeasurementId || "Tanımlanmadı"} icon={<BarChartIcon />} />
         <StatsPreviewCard title="Ads Customer" value={form.googleAdsCustomerId || "Tanımlanmadı"} icon={<AdsIcon />} />
      </div>
    </div>
  );
}

// ─── Local UI Components ───────────────────────────────────

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 px-8 py-3 rounded-[18px] transition-all duration-300 font-bold text-sm ${
        active 
          ? "bg-white text-slate-900 shadow-md scale-[1.02]" 
          : "text-slate-500 hover:text-slate-900 hover:bg-white/50"
      }`}
    >
      <span className={active ? "text-indigo-500" : "text-slate-400"}>{icon}</span>
      {label}
    </button>
  );
}

function StatsPreviewCard({ title, value, icon }: { title: string, value: string, icon: React.ReactNode }) {
  return (
    <div className="p-6 bg-slate-50/50 rounded-3xl border border-slate-100 flex items-center gap-5 group hover:bg-white hover:shadow-xl transition-all duration-300">
       <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
          {icon}
       </div>
       <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{title}</p>
          <p className="text-sm font-bold text-slate-800 truncate">{value}</p>
       </div>
    </div>
  );
}

const TagIcon = () => (
  <svg className="w-6 h-6 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
  </svg>
);

const BarChartIcon = () => (
  <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const AdsIcon = () => (
  <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
  </svg>
);

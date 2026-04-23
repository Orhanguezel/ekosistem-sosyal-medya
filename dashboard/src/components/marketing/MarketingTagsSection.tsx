"use client";

import { Dispatch, SetStateAction, useState } from "react";
import { 
  Tag, 
  BarChart3, 
  Search, 
  Target, 
  Globe, 
  Code, 
  Save, 
  RefreshCw,
  Info,
  AlertCircle,
  Zap
} from "lucide-react";

type Form = {
  gtmContainerId: string;
  ga4MeasurementId: string;
  ga4PropertyId: string;
  googleAdsCustomerId: string;
  googleAdsManagerId: string;
  searchConsoleSiteUrl: string;
  siteSettingsApiUrl: string;
  notes: string;
};

export function MarketingTagsSection(props: {
  form: Form;
  setForm: Dispatch<SetStateAction<Form>>;
  saving: boolean;
  onSave: () => void;
  onDiscover?: () => void;
}) {
  const { form, setForm, saving, onSave, onDiscover } = props;

  return (
    <div className="space-y-10">
      <section className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/20">
              <Tag size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Takip Kodları & Kimlikler</h2>
              <p className="text-xs text-slate-400 font-medium">Analitik ve reklam platformları entegrasyonu.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {onDiscover && (
              <button 
                onClick={onDiscover}
                className="flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-200 text-indigo-600 rounded-xl hover:bg-indigo-50 transition-all font-bold shadow-sm"
              >
                <Zap size={18} />
                Akıllı Bul (Site Tara)
              </button>
            )}
            <button 
              onClick={onSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-bold shadow-lg shadow-indigo-600/10 disabled:opacity-50"
            >
              {saving ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
              Değişiklikleri Uygula
            </button>
          </div>
        </div>

        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          <InputField 
            label="GTM Container ID" 
            value={form.gtmContainerId} 
            onChange={(v) => setForm(f => ({ ...f, gtmContainerId: v }))} 
            icon={<Code size={18} />} 
            placeholder="GTM-XXXX"
            helper="Google Tag Manager konteyner kodu."
          />
          <InputField 
            label="GA4 Measurement ID" 
            value={form.ga4MeasurementId} 
            onChange={(v) => setForm(f => ({ ...f, ga4MeasurementId: v }))} 
            icon={<BarChart3 size={18} />} 
            placeholder="G-XXXX"
            helper="Google Analytics 4 ölçüm kimliği."
          />
          <div className="md:col-span-2">
            <InputField 
              label="GA4 Mülk ID (API — Sayısal)" 
              value={form.ga4PropertyId} 
              onChange={(v) => setForm(f => ({ ...f, ga4PropertyId: v }))} 
              icon={<BarChart3 size={18} />} 
              placeholder="123456789"
              helper="Rapor API verileri için Admin > Mülk Ayarları altındaki sayısal ID."
            />
          </div>
          <InputField 
            label="Google Ads Müşteri ID" 
            value={form.googleAdsCustomerId} 
            onChange={(v) => setForm(f => ({ ...f, googleAdsCustomerId: v }))} 
            icon={<Target size={18} />} 
            placeholder="123-456-7890"
          />
          <InputField 
            label="MCC / Yönetici ID (Opsiyonel)" 
            value={form.googleAdsManagerId} 
            onChange={(v) => setForm(f => ({ ...f, googleAdsManagerId: v }))} 
            icon={<Target size={18} />} 
          />
        </div>
      </section>

      <section className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex items-center gap-3 bg-slate-50/30">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/20">
            <Search size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Search Console & Dinamik Yapılandırma</h2>
            <p className="text-xs text-slate-400 font-medium">Site performansı ve dış veri kaynakları.</p>
          </div>
        </div>
        <div className="p-8 space-y-6">
          <InputField 
            label="Search Console Mülk URL" 
            value={form.searchConsoleSiteUrl} 
            onChange={(v) => setForm(f => ({ ...f, searchConsoleSiteUrl: v }))} 
            icon={<Globe size={18} />} 
            placeholder="https://www.ornek.com/"
          />
          <InputField 
            label="Site Ayarları JSON URL (Marketing Meta)" 
            value={form.siteSettingsApiUrl} 
            onChange={(v) => setForm(f => ({ ...f, siteSettingsApiUrl: v }))} 
            icon={<RefreshCw size={18} />} 
            placeholder="https://site.com/api/public/marketing-meta"
            helper="Dış bir kaynaktan marketing verilerini senkronize etmek için kullanılır."
          />
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Özel Notlar</label>
            <textarea 
              value={form.notes}
              onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-semibold text-slate-700 min-h-[100px]"
              placeholder="Kampanya notları, özel açıklamalar..."
            />
          </div>
        </div>
      </section>

      <div className="bg-amber-50 border border-amber-100 rounded-[24px] p-6 flex gap-4">
        <div className="bg-amber-100 p-2.5 rounded-xl text-amber-600 h-fit">
          <Info size={20} />
        </div>
        <div className="space-y-1">
          <h4 className="font-bold text-amber-900 text-sm">Geliştirici Notu</h4>
          <p className="text-xs text-amber-800/70 font-medium">
            Bu kimlikler hem frontend taraflı takip kodlarını (GTM/GA4) tetiklemek hem de backend tarafındaki Raporlama API'lerini yetkilendirmek için kullanılmaktadır. 
            Hatalı ID girilmesi veri kaybına yol açabilir.
          </p>
        </div>
      </div>
    </div>
  );
}

function InputField({ label, value, onChange, icon, placeholder, helper }: { label: string, value: string, onChange: (v: string) => void, icon?: React.ReactNode, placeholder?: string, helper?: string }) {
  return (
    <div className="space-y-2 group">
      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest px-1">{label}</label>
      <div className="relative">
        {icon && (
          <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
            {icon}
          </div>
        )}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full bg-slate-50 border border-slate-200 rounded-2xl ${icon ? 'pl-12' : 'px-6'} py-4 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-semibold text-slate-700`}
          placeholder={placeholder}
        />
      </div>
      {helper && <p className="text-[10px] text-slate-400 font-medium px-1">{helper}</p>}
    </div>
  );
}

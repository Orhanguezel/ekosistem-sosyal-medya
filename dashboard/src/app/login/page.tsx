"use client";

import { useEffect, useState } from "react";
import { siteSettings, tenants } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { resolveStorageAssetUrl, resolveTenantAssetUrl } from "@/lib/tenant";
import { 
  Mail, 
  Lock, 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  Layout, 
  Sparkles,
  ChevronRight,
  Loader2
} from "lucide-react";

const FALLBACK_LOGO_URL = "/uploads/brand/ekosistem-sosyal-icon-512-maskable.png";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [brand, setBrand] = useState<{
    appName: string;
    loginSubtitle: string;
    logoUrl?: string | null;
  }>({
    appName: process.env.NEXT_PUBLIC_APP_NAME || "Guezel Sosyal",
    loginSubtitle: "Yapay zeka destekli sosyal medya yönetim platformu",
    logoUrl: null,
  });

  useEffect(() => {
    Promise.all([
      siteSettings.list({
        keys: "site_title,site_description,global_logo_asset_id,global_logo_url",
      }),
    ])
      .then(([settings]) => {
        const siteBranding = settings.items.reduce((acc: Record<string, string>, item: any) => {
          acc[item.key] = item.value;
          return acc;
        }, {});
        
        setBrand({
          appName:
            siteBranding.site_title ||
            "Guezel Sosyal",
          loginSubtitle:
            siteBranding.site_description ||
            "Dijital varlığınızı tek noktadan, akıllıca yönetin.",
          logoUrl:
            resolveStorageAssetUrl(siteBranding.global_logo_asset_id) ||
            resolveTenantAssetUrl(siteBranding.global_logo_url) ||
            FALLBACK_LOGO_URL,
        });
      })
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      window.location.href = "/";
    } catch (err) {
      setError((err as Error).message || "Giriş başarısız. Lütfen bilgilerinizi kontrol edin.");
    } finally {
      setLoading(false);
    }
  }

  const logoSrc =
    resolveTenantAssetUrl(brand.logoUrl) ||
    resolveTenantAssetUrl(FALLBACK_LOGO_URL) ||
    FALLBACK_LOGO_URL;

  return (
    <div className="min-h-screen flex bg-slate-50 font-sans overflow-hidden">
      {/* Left Side: Login Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 md:p-16 z-20 relative bg-white/80 backdrop-blur-xl lg:bg-white">
        <div className="w-full max-w-md space-y-12">
          {/* Logo & Intro */}
          <div className="text-center lg:text-left space-y-6">
            <div className="flex justify-center lg:justify-start">
               <div className="p-4 bg-slate-50 rounded-[28px] border border-slate-100 shadow-inner inline-block">
	                <img
	                    src={logoSrc}
	                    alt={brand.appName}
	                    className="h-10 w-auto object-contain"
	                    onError={(e) => {
	                      (e.target as HTMLImageElement).src = resolveTenantAssetUrl(FALLBACK_LOGO_URL) || FALLBACK_LOGO_URL;
	                    }}
	                 />
               </div>
            </div>
            <div className="space-y-2">
               <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                 {brand.appName}
               </h1>
               <p className="text-slate-500 text-lg font-medium leading-relaxed">
                 {brand.loginSubtitle}
               </p>
            </div>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-100 text-rose-600 px-5 py-4 rounded-[20px] text-sm flex items-center gap-3 animate-in fade-in slide-in-from-top-2 font-bold shadow-sm">
              <AlertCircle size={20} className="shrink-0" /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-6">
              <InputGroup 
                label="E-posta Adresi" 
                icon={<Mail size={20} />}
                type="email"
                placeholder="ornek@sirket.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <InputGroup 
                label="Şifre" 
                icon={<Lock size={20} />}
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                showForgot
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group w-full py-5 bg-slate-900 text-white rounded-[24px] hover:bg-slate-800 disabled:opacity-50 font-bold shadow-2xl shadow-slate-900/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={24} />
              ) : (
                <>
                  Hesabına Giriş Yap
                  <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
          
          <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
             <p className="text-sm text-slate-400 font-medium">
               Hesabınız yok mu? <a href="#" className="text-indigo-600 font-bold hover:underline">Şimdi Kaydol</a>
             </p>
             <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-widest border border-slate-100">
                <ShieldCheck size={12} className="text-emerald-500" /> Güvenli Giriş
             </div>
          </div>
        </div>

        {/* Floating Decorative Dots for Left Side */}
        <div className="absolute top-10 left-10 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl"></div>
        <div className="absolute bottom-10 right-10 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl"></div>
      </div>

      {/* Right Side: Premium Hero Section */}
      <div className="hidden lg:flex flex-1 relative items-center justify-center bg-slate-900 overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
           <img 
            src="/images/login-bg.png" 
            alt="Dashboard Mockup" 
            className="w-full h-full object-cover opacity-40 scale-105"
           />
           <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/80 via-slate-900/60 to-slate-950/90"></div>
        </div>

        {/* Content Over the Background */}
        <div className="relative z-10 w-full max-w-xl p-12 space-y-12">
           <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/10 text-white text-xs font-bold uppercase tracking-widest animate-in fade-in slide-in-from-bottom-4 duration-700">
                 <Sparkles size={14} className="text-amber-400" /> Yeni Nesil Yönetim
              </div>
              <h2 className="text-5xl font-black text-white leading-[1.1] animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-200">
                Sosyal Medyada <span className="text-indigo-400">Yapay Zeka</span> Çağını Başlatın
              </h2>
              <p className="text-indigo-100/60 text-lg font-medium leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
                İçerik üretiminden analitiğe kadar tüm süreçlerinizi Guezel ile otomatikleştirin ve etkileşimlerinizi zirveye taşıyın.
              </p>
           </div>

           <div className="grid grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-500">
              <FeatureBox icon={<Zap size={20} />} title="Hızlı Paylaşım" desc="Tüm platformlara anında." />
              <FeatureBox icon={<Layout size={20} />} title="Akıllı Takvim" desc="Optimize edilmiş planlama." />
           </div>
        </div>

        {/* Abstract Shapes */}
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-indigo-500/20 rounded-full blur-[120px]"></div>
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-purple-500/20 rounded-full blur-[120px]"></div>
      </div>
    </div>
  );
}

// ─── Local UI Components ───────────────────────────────────

function InputGroup({ label, icon, type, placeholder, value, onChange, required, showForgot }: { label: string, icon: React.ReactNode, type: string, placeholder: string, value: string, onChange: (e: any) => void, required?: boolean, showForgot?: boolean }) {
  return (
    <div className="space-y-2.5 group">
      <div className="flex items-center justify-between px-1">
        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{label}</label>
        {showForgot && <a href="#" className="text-xs text-indigo-600 font-bold hover:underline">Şifremi Unuttum</a>}
      </div>
      <div className="relative flex items-center">
        <div className="absolute left-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
          {icon}
        </div>
        <input
          type={type}
          className="w-full bg-slate-50 border border-slate-100 rounded-[22px] pl-14 pr-6 py-4.5 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none font-semibold text-slate-700 shadow-sm"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
        />
      </div>
    </div>
  );
}

function FeatureBox({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-[32px] space-y-3">
       <div className="w-10 h-10 bg-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center">
          {icon}
       </div>
       <div>
          <h4 className="text-white font-bold text-sm">{title}</h4>
          <p className="text-white/40 text-[11px] font-medium leading-tight mt-1">{desc}</p>
       </div>
    </div>
  );
}

function AlertCircle(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
  );
}

function ThumbsUp(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 16.5 22H7c-1.1 0-2-.9-2-2v-8a2 2 0 0 1 .59-1.41L11.5 5.5z"/></svg>
  );
}

function MessageSquare(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
  );
}

function Share2(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
  );
}

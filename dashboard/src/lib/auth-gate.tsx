"use client";

import { useAuth } from "./auth-context";
import { usePathname } from "next/navigation";
import { getStoredTenantKey, resolveStorageAssetUrl, resolveTenantAssetUrl, resolveTenantKey, setStoredTenantKey } from "./tenant";
import { useEffect, useState } from "react";
import { siteSettings, tenants } from "./api";
import { 
  LayoutGrid, 
  FileText, 
  PlusCircle, 
  Calendar, 
  ClipboardList, 
  BarChart3, 
  Zap, 
  Settings, 
  Globe,
  LogOut,
  ChevronRight,
  MoreVertical,
  Bell,
  Search,
  User,
  ShieldCheck,
  Smartphone
} from "lucide-react";

const PUBLIC_PATHS = ["/login"];
const FALLBACK_LOGO_URL = "/uploads/brand/ekosistem-sosyal-icon-512-maskable.png";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const [tenantKey, setTenantKey] = useState("");
  const [tenantItems, setTenantItems] = useState<any[]>([]);
  const [brand, setBrand] = useState<{
    appName: string;
    appSubtitle: string;
    logoUrl?: string | null;
  }>({
    appName: "Guezel Sosyal",
    appSubtitle: "Yapay Zeka Destekli Yönetim",
    logoUrl: null,
  });

  useEffect(() => {
    Promise.all([
      tenants.list(),
      siteSettings.list({
        keys: "site_title,site_description,global_logo_asset_id,global_logo_url",
      }),
    ])
      .then(([d, settings]) => {
        setTenantItems(d.items);
        const nextTenantKey = resolveTenantKey(d.items, getStoredTenantKey());
        setTenantKey(nextTenantKey);
        if (nextTenantKey) setStoredTenantKey(nextTenantKey);
        
        const activeTenant = d.items.find((item: any) => item.key === nextTenantKey) || d.items[0];
        const siteBranding = settings.items.reduce((acc: Record<string, string>, item: any) => {
          acc[item.key] = item.value;
          return acc;
        }, {});

        // Use global branding if on login or as fallback, but prefer tenant branding if inside
        if (activeTenant) {
          setBrand({
            appName:
              activeTenant.branding?.appName ||
              activeTenant.name ||
              siteBranding.site_title || "Guezel Sosyal",
            appSubtitle:
              activeTenant.branding?.appSubtitle ||
              siteBranding.site_description ||
              "Sosyal medya yönetimi",
            logoUrl:
              resolveTenantAssetUrl(siteBranding.global_logo_url) ||
              resolveStorageAssetUrl(siteBranding.global_logo_asset_id) ||
              FALLBACK_LOGO_URL,
          });
        }
      })
      .catch(() => setTenantItems([]));
  }, []);

  if (PUBLIC_PATHS.includes(pathname)) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 space-y-4">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em]">Sistem Hazırlanıyor</p>
      </div>
    );
  }

  if (!user) {
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    return null;
  }

  const fixUrl = (url?: string | null) => {
    if (!url) return null;
    if (url.startsWith("http")) return url;
    if (url.startsWith("/uploads/")) return url;
    if (url.startsWith("uploads/")) return `/${url}`;
    return `/uploads/${url}`;
  };
  const logoSrc =
    resolveTenantAssetUrl(brand.logoUrl) ||
    resolveTenantAssetUrl(FALLBACK_LOGO_URL) ||
    FALLBACK_LOGO_URL;

  return (
    <div className="min-h-screen flex bg-slate-50/50 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Sidebar */}
      <aside className="w-80 bg-white border-r border-slate-100 flex flex-col hidden lg:flex sticky top-0 h-screen z-40 transition-all duration-500 shadow-[20px_0_40px_rgba(0,0,0,0.01)]">
        {/* Sidebar Header: Branding */}
        <div className="p-8 pb-4">
           <div className="flex items-center gap-4 mb-10 group cursor-pointer">
              <div className="w-12 h-12 bg-slate-900 rounded-[20px] flex items-center justify-center shadow-2xl shadow-slate-900/20 group-hover:scale-110 transition-transform">
              <img
                src={logoSrc}
                alt={brand.appName}
                className="h-10 w-auto object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = resolveTenantAssetUrl(FALLBACK_LOGO_URL) || FALLBACK_LOGO_URL;
                }}
              />
              </div>
              <div className="min-w-0">
                 <h2 className="font-black text-slate-900 truncate tracking-tight text-lg leading-tight">{brand.appName}</h2>
                 <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                    <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest truncate">{brand.appSubtitle}</p>
                 </div>
              </div>
           </div>

           {/* Tenant Switcher */}
           <div className="space-y-3 mb-10">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-4">Aktif Proje</label>
              <div className="relative group">
                <select
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 appearance-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none cursor-pointer shadow-sm group-hover:bg-white"
                  value={tenantKey}
                  onChange={(e) => {
                    setTenantKey(e.target.value);
                    setStoredTenantKey(e.target.value);
                    window.location.reload();
                  }}
                >
                  {tenantItems.map((t: any) => (
                    <option key={t.key} value={t.key}>
                      {t.name}
                    </option>
                  ))}
                </select>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-indigo-500 transition-colors">
                  <ChevronRight size={16} className="rotate-90" />
                </div>
              </div>
           </div>

           {/* Navigation */}
           <nav className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-4 mb-3 block">Ana Menü</label>
              <NavLink href="/" label="Dashboard" icon={<LayoutGrid size={18} />} active={pathname === "/"} />
              <NavLink href="/posts" label="İçerik Arşivi" icon={<FileText size={18} />} active={pathname === "/posts"} />
              <NavLink href="/posts/new" label="Yeni Gönderi" icon={<PlusCircle size={18} />} active={pathname === "/posts/new"} />
              <NavLink href="/calendar" label="Yayın Takvimi" icon={<Calendar size={18} />} active={pathname === "/calendar"} />
              <NavLink href="/templates" label="İçerik Şablonları" icon={<ClipboardList size={18} />} active={pathname === "/templates"} />
              <NavLink href="/analytics" label="Performans Analizi" icon={<BarChart3 size={18} />} active={pathname === "/analytics"} />
              <NavLink href="/marketing" label="Akıllı Pazarlama" icon={<Zap size={18} />} active={pathname === "/marketing"} />
              
              <div className="pt-6 mt-6 border-t border-slate-50">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-4 mb-3 block">Yapılandırma</label>
                <NavLink href="/settings" label="Genel Ayarlar" icon={<Settings size={18} />} active={pathname === "/settings"} />
                <NavLink href="/settings/site" label="SaaS Site Ayarları" icon={<Globe size={18} />} active={pathname === "/settings/site"} />
              </div>
           </nav>
        </div>

        {/* Sidebar Footer: User Profile */}
        <div className="mt-auto p-6">
           <div className="bg-slate-50 rounded-[32px] p-4 border border-slate-100 group hover:bg-white hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-sm font-black shadow-lg shadow-indigo-600/20 group-hover:scale-110 transition-transform">
                    {user.email?.[0]?.toUpperCase() || "U"}
                 </div>
                 <div className="min-w-0 flex-1">
                    <p className="text-sm font-black text-slate-900 truncate leading-tight">{user.email?.split('@')[0]}</p>
                    <p className="text-[10px] font-bold text-slate-400 truncate">{user.email}</p>
                 </div>
                 <button 
                  onClick={logout}
                  className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                  title="Oturumu Kapat"
                 >
                    <LogOut size={18} />
                 </button>
              </div>
           </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
         {/* Top Header (Optional/Contextual) */}
         <header className="h-20 bg-white/40 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-10 sticky top-0 z-30">
            <div className="flex items-center gap-4 text-slate-400">
               <span className="text-[11px] font-black uppercase tracking-widest">Sistem Durumu:</span>
               <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 rounded-full border border-emerald-100">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-[9px] font-black text-emerald-600 uppercase tracking-tighter">Normal</span>
               </div>
            </div>
            
            <div className="flex items-center gap-6">
               <div className="hidden sm:flex items-center gap-2 text-slate-400 bg-white/50 px-4 py-2 rounded-xl border border-slate-100">
                  <Search size={16} />
                  <input type="text" placeholder="Hızlı ara..." className="bg-transparent border-none text-xs font-bold focus:ring-0 w-32 outline-none text-slate-600" />
               </div>
               <div className="flex items-center gap-3">
                  <button className="p-2.5 bg-white text-slate-400 hover:text-indigo-600 rounded-xl border border-slate-100 shadow-sm transition-all relative">
                     <Bell size={20} />
                     <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
                  </button>
                  <button className="lg:hidden p-2.5 bg-slate-900 text-white rounded-xl shadow-lg shadow-slate-900/20">
                     <LayoutGrid size={20} />
                  </button>
               </div>
            </div>
         </header>

         {/* Scrollable Content Area */}
         <main className="flex-1 overflow-y-auto">
            <div className="p-10 max-w-[1600px] mx-auto animate-in fade-in duration-1000">
              {children}
            </div>
            
            {/* Footer */}
            <footer className="p-10 pt-20 flex flex-col md:flex-row items-center justify-between gap-6 opacity-30 group hover:opacity-100 transition-opacity duration-700">
               <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-slate-900 rounded-lg flex items-center justify-center">
                     <ShieldCheck size={14} className="text-white" />
                  </div>
                  <p className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">Guezel SaaS Engine v2.0</p>
               </div>
               <div className="flex items-center gap-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <a href="#" className="hover:text-indigo-600">Dokümantasyon</a>
                  <a href="#" className="hover:text-indigo-600">Destek</a>
                  <span className="text-slate-200">|</span>
                  <span>© 2026 Tüm Hakları Saklıdır</span>
               </div>
            </footer>
         </main>
      </div>
    </div>
  );
}

function NavLink({
  href,
  label,
  icon,
  active
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  active?: boolean;
}) {
  return (
    <a
      href={href}
      className={`group flex items-center gap-4 px-5 py-3.5 text-sm rounded-2xl transition-all duration-300 relative ${
        active 
          ? "bg-indigo-600 text-white shadow-xl shadow-indigo-600/20 font-bold" 
          : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
      }`}
    >
      <span className={`transition-transform duration-300 ${active ? "text-white" : "text-slate-400 group-hover:text-indigo-500 group-hover:scale-110"}`}>
        {icon}
      </span>
      <span className="flex-1">{label}</span>
      {active && <ChevronRight size={14} className="animate-in slide-in-from-left-2 duration-300" />}
    </a>
  );
}

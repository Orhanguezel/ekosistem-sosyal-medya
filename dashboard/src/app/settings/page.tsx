"use client";

import { useEffect, useState } from "react";
import { analytics, platforms, tenantAdmin, tenants } from "@/lib/api";
import { SettingsEmailPanel } from "@/components/settings/SettingsEmailPanel";
import { clearLinkedInTenant, prepareXOAuth, saveLinkedInTenant, saveXPkce } from "@/lib/oauth-pkce";
import { getStoredTenantKey, resolveTenantKey, setStoredTenantKey } from "@/lib/tenant";
import { 
  Settings, 
  Globe, 
  Share2, 
  Mail, 
  Terminal, 
  Plus, 
  Save, 
  RefreshCw, 
  Download, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink,
  ChevronRight,
  User,
  Layout,
  Image as ImageIcon,
  Link2,
  Tags,
  Briefcase,
  Users,
  Database,
  Clock,
  Cpu,
  Facebook,
  Instagram,
  Send,
  Linkedin,
  Twitter
} from "lucide-react";

type TabType = "general" | "social" | "email" | "advanced";

export default function SettingsPage() {
  const dashboardUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3004";

  const [activeTab, setActiveTab] = useState<TabType>("general");
  const [tenantKey, setTenantKey] = useState("");
  const [tenantItems, setTenantItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [oauthBusy, setOauthBusy] = useState<"linkedin" | "x" | null>(null);
  const [status, setStatus] = useState<any>(null);
  
  const [tenantProfile, setTenantProfile] = useState({
    name: "",
    websiteUrl: "",
    appName: "",
    appSubtitle: "",
    loginTitle: "",
    loginSubtitle: "",
    logoUrl: "",
    faviconUrl: "",
    faviconIcoUrl: "",
    defaultLinkUrl: "",
    defaultHashtags: "",
    sector: "",
    audience: "",
    contentSourceLabel: "",
  });

  const [onboard, setOnboard] = useState({
    key: "",
    name: "",
    websiteUrl: "",
    appName: "",
    loginSubtitle: "",
    defaultHashtags: "",
  });

  // Manual Connection Forms
  const [manualPlatform, setManualPlatform] = useState<string>("facebook");
  const [manualForm, setManualForm] = useState({
    accountName: "",
    accountId: "",
    accessToken: "",
    refreshToken: "",
    pageId: "",
    pageToken: "",
  });

  function refreshPlatforms(tk: string) {
    return Promise.all([platforms.status(tk), platforms.list(tk)])
      .then(([s, list]) => setStatus({ ...s, items: list.items }))
      .catch(() => setStatus(null));
  }

  useEffect(() => {
    tenants.list().then((data) => {
      setTenantItems(data.items);
      const nextTenantKey = resolveTenantKey(data.items, getStoredTenantKey());
      setTenantKey(nextTenantKey);
      if (nextTenantKey) setStoredTenantKey(nextTenantKey);
    }).catch(() => setTenantItems([]));

    if (typeof window !== "undefined") {
      const oauth = new URLSearchParams(window.location.search).get("oauth");
      if (oauth === "linkedin_ok" || oauth === "x_ok") {
        window.history.replaceState({}, "", "/settings");
        setActiveTab("social");
      }
    }
  }, []);

  useEffect(() => {
    if (!tenantKey) return;
    setLoading(true);
    refreshPlatforms(tenantKey).finally(() => setLoading(false));
    tenants.get(tenantKey).then((item) => {
      setTenantProfile({
        name: item.name ?? "",
        websiteUrl: item.websiteUrl ?? "",
        appName: item.branding?.appName ?? item.name ?? "",
        appSubtitle: item.branding?.appSubtitle ?? "",
        loginTitle: item.branding?.loginTitle ?? item.name ?? "",
        loginSubtitle: item.branding?.loginSubtitle ?? "",
        logoUrl: item.branding?.logoUrl ?? "",
        faviconUrl: item.branding?.faviconUrl ?? "",
        faviconIcoUrl: item.branding?.faviconIcoUrl ?? "",
        defaultLinkUrl: item.branding?.defaultLinkUrl ?? item.websiteUrl ?? "",
        defaultHashtags: item.branding?.defaultHashtags ?? "",
        sector: item.branding?.sector ?? "",
        audience: item.branding?.audience ?? "",
        contentSourceLabel: item.branding?.contentSourceLabel ?? "",
      });
    }).catch(() => {});
  }, [tenantKey]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await tenantAdmin.updateProfile(tenantKey, tenantProfile);
      alert("Tenant profili başarıyla güncellendi.");
      const list = await tenants.list();
      setTenantItems(list.items);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleManualConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await platforms.manualConnect({
        tenantKey,
        platform: manualPlatform,
        ...manualForm
      });
      alert(`${manualPlatform} hesabı başarıyla kaydedildi.`);
      refreshPlatforms(tenantKey);
      setManualForm({
        accountName: "",
        accountId: "",
        accessToken: "",
        refreshToken: "",
        pageId: "",
        pageToken: "",
      });
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const handleDisconnect = async (id: number) => {
    if (!confirm("Bu bağlantıyı silmek istediğinize emin misiniz?")) return;
    try {
      await platforms.delete(String(id) as any);
      refreshPlatforms(tenantKey);
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const handleTestFacebook = async () => {
    try {
      const res = await platforms.testFacebook(tenantKey);
      alert(res.ok ? `Facebook test postu gönderildi (ID: ${res.postId})` : "Başarısız");
    } catch (err) { alert((err as Error).message); }
  };

  const handleTestInstagram = async () => {
    try {
      const res = await platforms.testInstagram(tenantKey);
      alert(res.ok ? `Instagram test postu gönderildi (ID: ${res.mediaId})` : "Başarısız");
    } catch (err) { alert((err as Error).message); }
  };

  const handleTestTelegram = async () => {
    try {
      const res = await platforms.testTelegram();
      alert(res.ok ? "Telegram test mesajı gönderildi!" : "Başarısız");
    } catch (err) { alert((err as Error).message); }
  };

  const handleTestLinkedIn = async () => {
    try {
      const res = await platforms.testLinkedIn(tenantKey);
      alert(res.ok ? "LinkedIn test postu gönderildi!" : "Başarısız");
    } catch (err) { alert((err as Error).message); }
  };

  const handleTestX = async () => {
    try {
      const res = await platforms.testX(tenantKey);
      alert(res.ok ? "X test postu gönderildi!" : "Başarısız");
    } catch (err) { alert((err as Error).message); }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Ayarlar</h1>
          <p className="text-slate-500 font-medium">Tenant yapılandırması ve entegrasyonları yönetin.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white border border-slate-200 rounded-2xl p-1.5 flex shadow-sm">
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
        </div>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Navigation Sidebar */}
        <aside className="space-y-2">
          <TabButton 
            active={activeTab === "general"} 
            onClick={() => setActiveTab("general")} 
            icon={<User size={18} />} 
            label="Genel & Marka" 
          />
          <TabButton 
            active={activeTab === "social"} 
            onClick={() => setActiveTab("social")} 
            icon={<Share2 size={18} />} 
            label="Sosyal Medya" 
          />
          <TabButton 
            active={activeTab === "email"} 
            onClick={() => setActiveTab("email")} 
            icon={<Mail size={18} />} 
            label="E-posta (SMTP/IMAP)" 
          />
          <TabButton 
            active={activeTab === "advanced"} 
            onClick={() => setActiveTab("advanced")} 
            icon={<Terminal size={18} />} 
            label="Sistem & Gelişmiş" 
          />
        </aside>

        {/* Content Area */}
        <div className="lg:col-span-3 space-y-8">
          {/* Tab: General */}
          {activeTab === "general" && (
            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
              <section className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/20">
                      <Layout size={20} />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">Tenant Profili</h2>
                  </div>
                  <button 
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all font-bold disabled:opacity-50"
                  >
                    {saving ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
                    Kaydet
                  </button>
                </div>
                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputField label="Kurum/Marka Adı" value={tenantProfile.name} onChange={(v) => setTenantProfile(s => ({ ...s, name: v }))} icon={<Briefcase size={16}/>} />
                  <InputField label="Web Sitesi URL" value={tenantProfile.websiteUrl} onChange={(v) => setTenantProfile(s => ({ ...s, websiteUrl: v }))} icon={<Globe size={16}/>} />
                  <InputField label="Uygulama Adı" value={tenantProfile.appName} onChange={(v) => setTenantProfile(s => ({ ...s, appName: v }))} icon={<Layout size={16}/>} />
                  <InputField label="Alt Başlık" value={tenantProfile.appSubtitle} onChange={(v) => setTenantProfile(s => ({ ...s, appSubtitle: v }))} icon={<Layout size={16}/>} />
                  <InputField label="Login Başlığı" value={tenantProfile.loginTitle} onChange={(v) => setTenantProfile(s => ({ ...s, loginTitle: v }))} icon={<User size={16}/>} />
                  <InputField label="Login Alt Başlığı" value={tenantProfile.loginSubtitle} onChange={(v) => setTenantProfile(s => ({ ...s, loginSubtitle: v }))} icon={<User size={16}/>} />
                  <InputField label="Sektör" value={tenantProfile.sector} onChange={(v) => setTenantProfile(s => ({ ...s, sector: v }))} icon={<Briefcase size={16}/>} />
                  <InputField label="Hedef Kitle" value={tenantProfile.audience} onChange={(v) => setTenantProfile(s => ({ ...s, audience: v }))} icon={<Users size={16}/>} />
                </div>
              </section>

              <section className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-slate-50 flex items-center gap-3 bg-slate-50/30">
                  <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-lg shadow-purple-600/20">
                    <ImageIcon size={20} />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">Görsel & Link Varlıkları</h2>
                </div>
                <div className="p-8 space-y-6">
                  <InputField label="Logo URL" value={tenantProfile.logoUrl} onChange={(v) => setTenantProfile(s => ({ ...s, logoUrl: v }))} icon={<ImageIcon size={16}/>} />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField label="Favicon URL (SVG/PNG)" value={tenantProfile.faviconUrl} onChange={(v) => setTenantProfile(s => ({ ...s, faviconUrl: v }))} icon={<Globe size={16}/>} />
                    <InputField label="Favicon ICO URL" value={tenantProfile.faviconIcoUrl} onChange={(v) => setTenantProfile(s => ({ ...s, faviconIcoUrl: v }))} icon={<Globe size={16}/>} />
                  </div>
                  <InputField label="Varsayılan Yönlendirme URL" value={tenantProfile.defaultLinkUrl} onChange={(v) => setTenantProfile(s => ({ ...s, defaultLinkUrl: v }))} icon={<Link2 size={16}/>} />
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Varsayılan Hashtagler</label>
                    <textarea 
                      value={tenantProfile.defaultHashtags} 
                      onChange={(e) => setTenantProfile(s => ({ ...s, defaultHashtags: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-semibold text-slate-700 min-h-[100px]"
                      placeholder="#tarim #teknoloji..."
                    />
                  </div>
                  <InputField label="İçerik Kaynak Etiketi" value={tenantProfile.contentSourceLabel} onChange={(v) => setTenantProfile(s => ({ ...s, contentSourceLabel: v }))} icon={<Tags size={16}/>} />
                </div>
              </section>
            </div>
          )}

          {/* Tab: Social */}
          {activeTab === "social" && (
            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
              <section className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/20">
                      <Share2 size={20} />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">Platform Bağlantıları</h2>
                  </div>
                </div>
                <div className="p-8 space-y-4">
                  {loading ? (
                    <div className="flex items-center justify-center p-12">
                      <RefreshCw className="animate-spin text-slate-300" size={32} />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      <ConnectionCard 
                        platform="facebook" 
                        connected={status?.facebook?.connected} 
                        onTest={handleTestFacebook} 
                        icon={<Facebook size={20} className="text-blue-600" />}
                        description={status?.facebook?.connected ? "Tenant hesabı aktif" : "Bağlı değil"}
                      />
                      <ConnectionCard 
                        platform="instagram" 
                        connected={status?.instagram?.connected} 
                        onTest={handleTestInstagram} 
                        icon={<Instagram size={20} className="text-pink-600" />}
                        description={status?.instagram?.connected ? "İşletme hesabı aktif" : "Bağlı değil"}
                      />
                      <ConnectionCard 
                        platform="telegram" 
                        connected={status?.telegram?.connected} 
                        onTest={handleTestTelegram} 
                        icon={<Send size={20} className="text-sky-500" />}
                        description={status?.telegram?.connected ? "Bot bildirimleri aktif" : "Bağlı değil"}
                      />
                      <ConnectionCard 
                        platform="linkedin" 
                        connected={status?.items?.some((a: any) => a.platform === "linkedin")} 
                        onConnect={() => {
                            setOauthBusy("linkedin");
                            saveLinkedInTenant(tenantKey);
                            platforms.linkedinAuthUrl(tenantKey).then(({url}) => window.location.href = url).finally(() => setOauthBusy(null));
                        }}
                        onTest={handleTestLinkedIn} 
                        icon={<Linkedin size={20} className="text-blue-700" />}
                        isBusy={oauthBusy === "linkedin"}
                      />
                      <ConnectionCard 
                        platform="x" 
                        connected={status?.items?.some((a: any) => a.platform === "x")} 
                        onConnect={() => {
                            setOauthBusy("x");
                            prepareXOAuth().then(({codeVerifier, codeChallenge}) => {
                                saveXPkce(tenantKey, codeVerifier);
                                platforms.xAuthUrl(tenantKey, codeChallenge).then(({url}) => window.location.href = url);
                            }).finally(() => setOauthBusy(null));
                        }}
                        onTest={handleTestX} 
                        icon={<Twitter size={20} className="text-slate-900" />}
                        isBusy={oauthBusy === "x"}
                      />
                    </div>
                  )}
                </div>
              </section>

              {/* Manual Connection Form */}
              <section className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/20">
                      <Plus size={20} />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">Manuel Hesap Girişi (Şifre/Token)</h2>
                  </div>
                </div>
                <form onSubmit={handleManualConnect} className="p-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Platform Seçin</label>
                      <select 
                        value={manualPlatform} 
                        onChange={(e) => setManualPlatform(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-semibold text-slate-700"
                      >
                        <option value="facebook">Facebook</option>
                        <option value="instagram">Instagram</option>
                        <option value="telegram">Telegram</option>
                        <option value="linkedin">LinkedIn</option>
                        <option value="x">X (Twitter)</option>
                      </select>
                    </div>
                    <InputField label="Hesap Takma Adı" value={manualForm.accountName} onChange={(v) => setManualForm(s => ({ ...s, accountName: v }))} icon={<User size={16}/>} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField label="Account/Chat ID" value={manualForm.accountId} onChange={(v) => setManualForm(s => ({ ...s, accountId: v }))} icon={<Link2 size={16}/>} />
                    <InputField label="Access Token / Bot Token" value={manualForm.accessToken} onChange={(v) => setManualForm(s => ({ ...s, accessToken: v }))} icon={<RefreshCw size={16}/>} isPassword />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField label="Page ID (FB)" value={manualForm.pageId} onChange={(v) => setManualForm(s => ({ ...s, pageId: v }))} icon={<Layout size={16}/>} />
                    <InputField label="Page Token (FB)" value={manualForm.pageToken} onChange={(v) => setManualForm(s => ({ ...s, pageToken: v }))} icon={<RefreshCw size={16}/>} isPassword />
                  </div>
                  <button type="submit" className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/10">
                    Hesabı Manuel Kaydet
                  </button>
                </form>
              </section>

              {/* Connected Accounts Table */}
              <section className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-slate-50 flex items-center gap-3 bg-slate-50/30">
                   <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-lg shadow-slate-900/20">
                    <Database size={20} />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">Aktif Bağlantılar</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50">
                        <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Platform</th>
                        <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Hesap Adı</th>
                        <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">ID</th>
                        <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">İşlem</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {status?.items?.map((acc: any) => (
                        <tr key={acc.id} className="hover:bg-slate-50/30 transition-colors">
                          <td className="px-8 py-4 capitalize font-bold text-slate-700 flex items-center gap-2">
                             {acc.platform === 'facebook' && <Facebook size={14} className="text-blue-600"/>}
                             {acc.platform === 'instagram' && <Instagram size={14} className="text-pink-600"/>}
                             {acc.platform === 'telegram' && <Send size={14} className="text-sky-500"/>}
                             {acc.platform === 'linkedin' && <Linkedin size={14} className="text-blue-700"/>}
                             {acc.platform === 'x' && <Twitter size={14} className="text-slate-900"/>}
                             {acc.platform}
                          </td>
                          <td className="px-8 py-4 text-sm font-medium text-slate-600">{acc.accountName}</td>
                          <td className="px-8 py-4 text-xs font-mono text-slate-400">{acc.accountId}</td>
                          <td className="px-8 py-4 text-right">
                            <button onClick={() => handleDisconnect(acc.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {(!status?.items || status?.items.length === 0) && (
                        <tr>
                          <td colSpan={4} className="px-8 py-10 text-center text-slate-400 font-medium">Bağlı hesap bulunamadı.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}

          {/* Tab: Email */}
          {activeTab === "email" && (
            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
               <section className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-slate-50 flex items-center gap-3 bg-slate-50/30">
                  <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/20">
                    <Mail size={20} />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">E-posta (SMTP / IMAP) Ayarları</h2>
                </div>
                <div className="p-8">
                  <SettingsEmailPanel tenantKey={tenantKey} />
                </div>
              </section>
            </div>
          )}

          {/* Tab: Advanced */}
          {activeTab === "advanced" && (
            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
              <section className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-slate-50 flex items-center gap-3 bg-slate-50/30">
                  <div className="w-10 h-10 rounded-xl bg-slate-700 text-white flex items-center justify-center shadow-lg shadow-slate-700/20">
                    <Cpu size={20} />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">API & Sistem Bilgileri</h2>
                </div>
                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                   <ApiInfoCard label="Backend API" value="http://localhost:8089" />
                   <ApiInfoCard label="Dashboard URL" value={dashboardUrl} />
                   <ApiInfoCard label="Content Source" value="http://localhost:8080/api" />
                   <ApiInfoCard label="Active Tenant Key" value={tenantKey} />
                </div>
              </section>

              <section className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-slate-50 flex items-center gap-3 bg-slate-50/30">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20">
                    <Clock size={20} />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">Otomasyon (Cron)</h2>
                </div>
                <div className="p-8 space-y-4">
                   <CronItem label="Zamanlanmış Yayın" frequency="Her 5 dakika" status="Aktif" />
                   <CronItem label="İçerik Senkronizasyonu" frequency="Her 30 dakika" status="Aktif" />
                   <CronItem label="AI İçerik Üretimi" frequency="Günlük 08:00" status="Aktif" />
                   <CronItem label="Analitik Veri Toplama" frequency="Her 6 saat" status="Aktif" />
                </div>
              </section>

              <section className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-slate-50 flex items-center gap-3 bg-slate-50/30 text-rose-600">
                  <Plus size={20} />
                  <h2 className="text-xl font-bold">Yeni Tenant Oluştur (Onboarding)</h2>
                </div>
                <form 
                  onSubmit={async (e) => {
                      e.preventDefault();
                      try {
                          await tenantAdmin.onboard(onboard as any);
                          alert("Tenant oluşturuldu!");
                          window.location.reload();
                      } catch(err) { alert((err as Error).message); }
                  }} 
                  className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                  <InputField label="Tenant Key (benzersiz)" value={onboard.key} onChange={(v) => setOnboard(s => ({ ...s, key: v }))} placeholder="yeni-marka" />
                  <InputField label="Tenant Adı" value={onboard.name} onChange={(v) => setOnboard(s => ({ ...s, name: v }))} placeholder="Yeni Marka Ltd." />
                  <div className="md:col-span-2">
                    <button type="submit" className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all">
                        Tenant Oluştur ve Başlat
                    </button>
                  </div>
                </form>
              </section>

              <div className="bg-emerald-50 border border-emerald-100 rounded-[32px] p-8">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="bg-emerald-100 p-3 rounded-2xl text-emerald-600">
                      <Download size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-emerald-900">Analitik Rapor Export</h3>
                      <p className="text-sm text-emerald-800/70 font-medium">Mevcut tenant için detaylı performans raporunu PDF olarak indirin.</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => window.open(analytics.tenantReportPdfUrl(tenantKey), "_blank")}
                    className="px-6 py-3 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/10"
                  >
                    PDF İndir
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Yardımcı Bileşenler ───────────────────────────────────

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl transition-all duration-300 font-bold text-sm ${
        active 
          ? "bg-slate-900 text-white shadow-xl shadow-slate-900/10 translate-x-2" 
          : "text-slate-500 hover:bg-white hover:text-slate-900"
      }`}
    >
      <span className={active ? "text-indigo-400" : "text-slate-400"}>{icon}</span>
      {label}
    </button>
  );
}

function InputField({ label, value, onChange, icon, placeholder, isPassword }: { label: string, value: string, onChange: (v: string) => void, icon?: React.ReactNode, placeholder?: string, isPassword?: boolean }) {
  return (
    <div className="space-y-2">
      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest px-1">{label}</label>
      <div className="relative group">
        {icon && (
          <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
            {icon}
          </div>
        )}
        <input
          type={isPassword ? "password" : "text"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full bg-slate-50 border border-slate-200 rounded-2xl ${icon ? 'pl-12' : 'px-6'} py-4 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-semibold text-slate-700`}
          placeholder={placeholder}
        />
      </div>
    </div>
  );
}

function ConnectionCard({ platform, connected, onConnect, onTest, icon, description, isBusy }: { 
    platform: string, 
    connected: boolean, 
    onConnect?: () => void, 
    onTest?: () => void, 
    icon: React.ReactNode,
    description?: string,
    isBusy?: boolean
}) {
  return (
    <div className="flex items-center justify-between p-6 bg-slate-50/50 rounded-[24px] border border-slate-100 group hover:bg-white hover:shadow-md transition-all duration-300">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
          {icon}
        </div>
        <div>
          <h4 className="font-bold text-slate-900 capitalize">{platform}</h4>
          <p className="text-xs text-slate-400 font-medium">{description || (connected ? "Bağlantı kuruldu" : "Henüz bağlı değil")}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {connected ? (
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase rounded-lg border border-emerald-100">
              <CheckCircle2 size={12} /> Bağlı
            </span>
            <button onClick={onTest} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors">
              <RefreshCw size={18} />
            </button>
          </div>
        ) : (
          onConnect && (
            <button 
                onClick={onConnect} 
                disabled={isBusy}
                className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-all disabled:opacity-50"
            >
              {isBusy ? "Bağlanıyor..." : "Bağlan"}
            </button>
          )
        )}
      </div>
    </div>
  );
}

function ApiInfoCard({ label, value }: { label: string, value: string }) {
  return (
    <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <code className="text-xs font-mono text-slate-700 block truncate">{value}</code>
    </div>
  );
}

function CronItem({ label, frequency, status }: { label: string, frequency: string, status: string }) {
  return (
    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
       <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
          <span className="text-sm font-bold text-slate-700">{label}</span>
       </div>
       <div className="flex items-center gap-4">
          <span className="text-xs text-slate-400 font-medium">{frequency}</span>
          <span className="text-[10px] font-bold text-emerald-600 uppercase bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">{status}</span>
       </div>
    </div>
  );
}

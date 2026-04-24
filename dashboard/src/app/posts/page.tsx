"use client";

import { useEffect, useState } from "react";
import { posts, tenants } from "@/lib/api";
import { getStoredTenantKey, resolveTenantKey, setStoredTenantKey } from "@/lib/tenant";
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  Share2, 
  Trash2, 
  Send, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  RefreshCw, 
  Facebook, 
  Instagram, 
  Globe,
  FileText,
  MessageSquare,
  Tag,
  Repeat,
  Zap,
  ExternalLink,
  X,
  Heart,
  Eye,
  MousePointer,
  Bookmark,
  Pencil
} from "lucide-react";

export default function PostsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<any>({});
  const [filter, setFilter] = useState({ status: "", platform: "", postType: "" });
  const [loading, setLoading] = useState(true);
  const [tenantKey, setTenantKey] = useState("");
  const [tenantItems, setTenantItems] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [detail, setDetail] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  async function loadPosts() {
    setLoading(true);
    try {
      const params: Record<string, string> = { limit: "50" };
      params.tenantKey = tenantKey;
      if (filter.status) params.status = filter.status;
      if (filter.platform) params.platform = filter.platform;
      if (filter.postType) params.postType = filter.postType;
      
      const [data, s] = await Promise.all([
        posts.list(params),
        posts.stats(tenantKey)
      ]);
      
      setItems(data.items);
      setTotal(data.total);
      setStats(s);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    tenants.list().then((d) => {
      setTenantItems(d.items);
      const nextTenantKey = resolveTenantKey(d.items, getStoredTenantKey());
      setTenantKey(nextTenantKey);
      if (nextTenantKey) setStoredTenantKey(nextTenantKey);
    }).catch(() => setTenantItems([]));
  }, []);

  useEffect(() => {
    if (!tenantKey) return;
    loadPosts();
  }, [filter, tenantKey]);

  async function handleDelete(id: number) {
    if (!confirm("Bu içeriği silmek istediğinize emin misiniz?")) return;
    await posts.delete(id);
    loadPosts();
  }

  async function handlePublish(id: number) {
    if (!confirm("Bu içeriği şimdi yayınlamak istiyor musunuz?")) return;
    try {
      await posts.publishNow(id);
      loadPosts();
    } catch (err) {
      alert((err as Error).message);
    }
  }

  async function handleDuplicate(id: number) {
    if (!confirm("Bu içeriği kopyalamak istiyor musunuz?")) return;
    await posts.duplicate(id);
    await loadPosts();
  }

  async function openDetails(id: number, refresh = false) {
    setDetailLoading(true);
    setDetailError("");
    try {
      const data = await posts.details(id, refresh);
      setDetail(data);
    } catch (err) {
      setDetailError((err as Error).message);
    } finally {
      setDetailLoading(false);
    }
  }

  async function refreshDetailMetrics() {
    if (!detail?.post?.id) return;
    setDetailLoading(true);
    setDetailError("");
    try {
      const refreshed = await posts.refreshMetrics(detail.post.id);
      const data = await posts.details(detail.post.id);
      setDetail({ ...data, refreshed });
      await loadPosts();
    } catch (err) {
      setDetailError((err as Error).message);
    } finally {
      setDetailLoading(false);
    }
  }

  const typeIcons: Record<string, any> = {
    haber: <FileText size={16} />,
    etkilesim: <MessageSquare size={16} />,
    ilan: <Tag size={16} />,
    nostalji: <Repeat size={16} />,
    tanitim: <Zap size={16} />,
    kampanya: <Share2 size={16} />,
  };

  const statusStyles: Record<string, string> = {
    draft: "bg-slate-100 text-slate-600 border-slate-200",
    scheduled: "bg-indigo-50 text-indigo-600 border-indigo-100",
    posted: "bg-emerald-50 text-emerald-600 border-emerald-100",
    failed: "bg-rose-50 text-rose-600 border-rose-100",
    publishing: "bg-amber-50 text-amber-600 border-amber-100",
    cancelled: "bg-slate-200 text-slate-500 border-slate-300",
  };

  const statusLabels: Record<string, string> = {
    draft: "Taslak",
    scheduled: "Zamanlandı",
    posted: "Yayınlandı",
    failed: "Hata",
    publishing: "Yayınlanıyor",
    cancelled: "İptal",
  };

  const filteredItems = items.filter(item => 
    (item.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.caption || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
            İçerik Arşivi <span className="text-slate-400 text-xl font-medium ml-2">({total})</span>
          </h1>
          <p className="text-slate-500 font-medium">Tüm sosyal medya paylaşımlarınızı buradan yönetin ve izleyin.</p>
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
          
          <a
            href="/posts/new"
            className="flex items-center gap-2 px-6 py-3.5 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition-all font-bold shadow-xl shadow-slate-900/10"
          >
            <Plus size={20} />
            Yeni Gönderi
          </a>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
         <StatCard 
            label="Toplam Arşiv" 
            value={total} 
            icon={<Globe className="text-slate-400" />} 
            description="Filtrelenmiş toplam"
         />
         <StatCard 
            label="Zamanlanmış" 
            value={stats.scheduled || 0} 
            icon={<Clock className="text-indigo-500" />} 
            description="Paylaşım bekleyen"
            gradient="from-indigo-50 to-white"
         />
         <StatCard 
            label="Yayınlanan" 
            value={stats.posted || 0} 
            icon={<CheckCircle2 className="text-emerald-500" />} 
            description="Başarılı içerikler"
            gradient="from-emerald-50 to-white"
         />
         <StatCard 
            label="Hatalı" 
            value={stats.failed || 0} 
            icon={<AlertCircle className="text-rose-500" />} 
            description="İşlem bekleyen"
            gradient="from-rose-50 to-white"
         />
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
         <div className="relative w-full lg:w-96 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="İçeriklerde ara..." 
              className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-11 pr-4 py-2.5 text-sm font-semibold text-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
         </div>

         <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <FilterSelect 
              value={filter.status} 
              onChange={(v) => setFilter({ ...filter, status: v })}
              options={[
                { label: "Tüm Durumlar", value: "" },
                { label: "Taslak", value: "draft" },
                { label: "Zamanlandı", value: "scheduled" },
                { label: "Yayınlandı", value: "posted" },
                { label: "Hata", value: "failed" },
              ]}
            />
            <FilterSelect 
              value={filter.platform} 
              onChange={(v) => setFilter({ ...filter, platform: v })}
              options={[
                { label: "Tüm Platformlar", value: "" },
                { label: "Facebook", value: "facebook" },
                { label: "Instagram", value: "instagram" },
                { label: "FB + IG", value: "both" },
              ]}
            />
            <FilterSelect 
              value={filter.postType} 
              onChange={(v) => setFilter({ ...filter, postType: v })}
              options={[
                { label: "Tüm Türler", value: "" },
                { label: "Haber", value: "haber" },
                { label: "Etkileşim", value: "etkilesim" },
                { label: "İlan", value: "ilan" },
                { label: "Nostalji", value: "nostalji" },
                { label: "Tanıtım", value: "tanitim" },
                { label: "Kampanya", value: "kampanya" },
              ]}
            />
            <button 
              onClick={loadPosts}
              className="p-2.5 hover:bg-slate-100 rounded-xl transition-all text-slate-400"
              title="Yenile"
            >
               <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
            </button>
         </div>
      </div>

      {/* Posts List */}
      <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
             <RefreshCw className="animate-spin text-indigo-500" size={40} />
             <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">İçerikler Yükleniyor...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4 text-slate-300">
             <FileText size={64} className="opacity-20" />
             <p className="font-bold text-slate-400">İçerik bulunamadı.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Gönderi</th>
                  <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Platform</th>
                  <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Zamanlama</th>
                  <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Durum</th>
                  <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredItems.map((post) => (
                  <tr key={post.id} className="hover:bg-slate-50/50 transition-all group">
                    <td className="px-8 py-6">
                       <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 shadow-sm group-hover:scale-110 transition-transform`}>
                             {typeIcons[post.postType] || <FileText size={16} />}
                          </div>
                          <div className="max-w-xs sm:max-w-md">
                             <p className="text-sm font-bold text-slate-900 line-clamp-1">{post.title || "Başlıksız İçerik"}</p>
                             <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{post.caption}</p>
                          </div>
                       </div>
                    </td>
                    <td className="px-8 py-6">
                       <PlatformBadge platform={post.platform} />
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                             <Calendar size={14} className="text-slate-400" />
                             {post.scheduledAt ? new Date(post.scheduledAt).toLocaleDateString("tr-TR") : "-"}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] font-medium text-slate-400">
                             <Clock size={12} />
                             {post.scheduledAt ? new Date(post.scheduledAt).toLocaleTimeString("tr-TR", { hour: '2-digit', minute: '2-digit' }) : "Zamanlanmadı"}
                          </div>
                       </div>
                    </td>
                    <td className="px-8 py-6">
                       <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm ${statusStyles[post.status] || "bg-slate-100"}`}>
                          {statusLabels[post.status] || post.status}
                       </span>
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex items-center justify-end gap-2">
                          {post.status !== "posted" && post.status !== "publishing" && (
                            <a
                              href={`/posts/new?edit=${post.id}`}
                              className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
                              title="Düzenle ve zamanla"
                            >
                              <Pencil size={18} />
                            </a>
                          )}
                          {post.status === "draft" && (
                            <button
                              onClick={() => handlePublish(post.id)}
                              className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                              title="Şimdi Yayınla"
                            >
                              <Send size={18} />
                            </button>
                          )}
                          <button
                            onClick={() => handleDuplicate(post.id)}
                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                            title="Kopyala (Duplicate)"
                          >
                             <Repeat size={18} />
                          </button>
                          <button
                            onClick={() => openDetails(post.id)}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                            title="Detay ve analiz"
                          >
                             <ExternalLink size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(post.id)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                            title="Sil"
                          >
                            <Trash2 size={18} />
                          </button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {(detail || detailLoading || detailError) && (
        <PostDetailModal
          detail={detail}
          loading={detailLoading}
          error={detailError}
          onClose={() => {
            setDetail(null);
            setDetailError("");
          }}
          onRefresh={refreshDetailMetrics}
          onDuplicate={() => detail?.post?.id && handleDuplicate(detail.post.id)}
        />
      )}
    </div>
  );
}

// ─── Local UI Components ───────────────────────────────────

function FilterSelect({ value, onChange, options }: { value: string, onChange: (v: string) => void, options: { label: string, value: string }[] }) {
  return (
    <select
      className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-[11px] font-black uppercase tracking-widest text-slate-600 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none cursor-pointer transition-all"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  );
}

function PlatformBadge({ platform }: { platform: string }) {
  if (platform === "both") return (
    <div className="flex items-center gap-1.5">
       <div className="w-7 h-7 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center border border-blue-100" title="Facebook">
          <Facebook size={14} />
       </div>
       <div className="w-7 h-7 bg-pink-50 text-pink-600 rounded-lg flex items-center justify-center border border-pink-100" title="Instagram">
          <Instagram size={14} />
       </div>
    </div>
  );

  const icons: Record<string, any> = {
    facebook: { icon: <Facebook size={14} />, color: "bg-blue-50 text-blue-600 border-blue-100" },
    instagram: { icon: <Instagram size={14} />, color: "bg-pink-50 text-pink-600 border-pink-100" },
  };

  const current = icons[platform] || { icon: <Globe size={14} />, color: "bg-slate-50 text-slate-500 border-slate-100" };

  return (
    <div className={`w-7 h-7 ${current.color} rounded-lg flex items-center justify-center border shadow-sm`}>
       {current.icon}
    </div>
  );
}

function StatCard({ label, value, icon, description, gradient }: { label: string, value: number, icon: React.ReactNode, description: string, gradient?: string }) {
  return (
    <div className={`p-6 bg-white rounded-[32px] border border-slate-100 shadow-sm bg-gradient-to-br ${gradient || 'from-white to-white'} flex items-center gap-5 group hover:shadow-xl transition-all duration-500`}>
       <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
          {icon}
       </div>
       <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{label}</p>
          <div className="flex items-baseline gap-2">
             <p className="text-2xl font-black text-slate-900">{value}</p>
             <p className="text-[10px] font-bold text-slate-400">{description}</p>
          </div>
       </div>
    </div>
  );
}

function PostDetailModal({
  detail,
  loading,
  error,
  onClose,
  onRefresh,
  onDuplicate,
}: {
  detail: any | null;
  loading: boolean;
  error: string;
  onClose: () => void;
  onRefresh: () => void;
  onDuplicate: () => void;
}) {
  const post = detail?.post;
  const analytics = Array.isArray(detail?.analytics) ? detail.analytics : [];
  const comments = Array.isArray(detail?.comments) ? detail.comments : [];
  const remotes = Array.isArray(detail?.refreshed?.remotes) ? detail.refreshed.remotes : [];
  const remote = remotes[0] || null;
  const link = remote?.permalink || post?.linkUrl;
  const image = remote?.mediaUrl || post?.imageUrl;
  const refreshErrors = Array.isArray(detail?.refreshed?.errors) ? detail.refreshed.errors : [];
  const totals = analytics.reduce(
    (acc: Record<string, number>, row: any) => {
      acc.likes += Number(row.likes || 0);
      acc.comments += Number(row.comments || 0);
      acc.shares += Number(row.shares || 0);
      acc.saves += Number(row.saves || 0);
      acc.reach += Number(row.reach || 0);
      acc.impressions += Number(row.impressions || 0);
      acc.clicks += Number(row.clicks || 0);
      return acc;
    },
    { likes: 0, comments: 0, shares: 0, saves: 0, reach: 0, impressions: 0, clicks: 0 },
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-sm p-4 flex items-center justify-center">
      <div className="w-full max-w-6xl max-h-[90vh] overflow-hidden bg-white rounded-[32px] border border-slate-200 shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-slate-100 bg-white/95 px-6 py-5">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Gönderi Detayı</p>
            <h2 className="mt-1 text-xl font-black text-slate-900 line-clamp-1">
              {post?.title || "Başlıksız içerik"}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {link && (
              <a
                href={link}
                target="_blank"
                rel="noreferrer"
                className="hidden sm:flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-xs font-black text-slate-600 hover:border-indigo-200 hover:text-indigo-600"
              >
                <ExternalLink size={15} />
                Meta'da Aç
              </a>
            )}
            {post && post.status !== "posted" && post.status !== "publishing" && (
              <a
                href={`/posts/new?edit=${post.id}`}
                className="hidden sm:flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-xs font-black text-slate-600 hover:border-slate-300 hover:text-slate-900"
              >
                <Pencil size={15} />
                Düzenle
              </a>
            )}
            <button
              onClick={onRefresh}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-black text-white hover:bg-indigo-700 disabled:opacity-60"
              disabled={loading || !post}
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
              Yenile
            </button>
            <button
              onClick={onClose}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              title="Kapat"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="max-h-[calc(90vh-86px)] overflow-y-auto p-6">
          {loading && !detail ? (
            <div className="flex flex-col items-center justify-center py-24 text-slate-400">
              <RefreshCw className="mb-4 animate-spin text-indigo-500" size={36} />
              <p className="text-xs font-black uppercase tracking-widest">Detaylar yükleniyor...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">
              <div className="space-y-6">
                {(error || refreshErrors.length > 0) && (
                  <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
                    {error || refreshErrors.join("; ")}
                  </div>
                )}

                <div className="rounded-[28px] border border-slate-100 bg-slate-50/40 p-5">
                  <div className="mb-4 flex flex-wrap items-center gap-3">
                    {post?.platform && <PlatformBadge platform={post.platform} />}
                    {post?.status && (
                      <span className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-600">
                        {post.status === "posted" ? "Yayınlandı" : post.status}
                      </span>
                    )}
                    <span className="text-xs font-bold text-slate-400">
                      {formatDateTime(post?.postedAt || post?.createdAt)}
                    </span>
                  </div>

                  {image && (
                    <img
                      src={image}
                      alt={post?.title || "Gönderi görseli"}
                      className="mb-5 max-h-[420px] w-full rounded-2xl border border-slate-100 object-cover"
                    />
                  )}

                  <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
                    {remote?.message || post?.caption || "İçerik metni bulunamadı."}
                  </p>

                  {(post?.fbPostId || post?.igMediaId) && (
                    <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {post.fbPostId && <MetaId label="Facebook ID" value={post.fbPostId} />}
                      {post.igMediaId && <MetaId label="Instagram ID" value={post.igMediaId} />}
                    </div>
                  )}
                </div>

                <div className="rounded-[28px] border border-slate-100 p-5">
                  <div className="mb-4 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Yorumlar</p>
                      <h3 className="text-lg font-black text-slate-900">{comments.length} kayıt</h3>
                    </div>
                    <button
                      onClick={onDuplicate}
                      className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-xs font-black text-slate-600 hover:border-indigo-200 hover:text-indigo-600"
                      disabled={!post}
                    >
                      <Repeat size={15} />
                      Kopyala
                    </button>
                  </div>

                  {comments.length === 0 ? (
                    <div className="rounded-2xl bg-slate-50 p-8 text-center text-sm font-bold text-slate-400">
                      Yorum bulunamadı. Yenile butonu ile Meta'dan tekrar kontrol edebilirsiniz.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {comments.map((comment: any) => (
                        <div key={comment.id} className="rounded-2xl border border-slate-100 p-4">
                          <div className="mb-2 flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-black text-slate-800">
                                {comment.authorName || "Kullanıcı"}
                              </p>
                              <p className="text-[11px] font-bold text-slate-400">
                                {formatDateTime(comment.createdTime)}
                              </p>
                            </div>
                            <span className="flex items-center gap-1 rounded-lg bg-rose-50 px-2 py-1 text-[11px] font-black text-rose-500">
                              <Heart size={12} />
                              {formatNumber(comment.likeCount || 0)}
                            </span>
                          </div>
                          <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">{comment.message}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <aside className="space-y-6">
                <div className="rounded-[28px] border border-slate-100 p-5">
                  <p className="mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Son Metrikler</p>
                  {analytics.length === 0 ? (
                    <div className="rounded-2xl bg-slate-50 p-6 text-sm font-bold text-slate-400">
                      Henüz metrik yok. Yenile ile Meta'dan çekebilirsiniz.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <MetricTile icon={<Heart size={16} />} label="Beğeni" value={totals.likes} />
                      <MetricTile icon={<MessageSquare size={16} />} label="Yorum" value={totals.comments} />
                      <MetricTile icon={<Share2 size={16} />} label="Paylaşım" value={totals.shares} />
                      <MetricTile icon={<Bookmark size={16} />} label="Kaydetme" value={totals.saves} />
                      <MetricTile icon={<Eye size={16} />} label="Erişim" value={totals.reach} />
                      <MetricTile icon={<MousePointer size={16} />} label="Tıklama" value={totals.clicks} />
                    </div>
                  )}
                </div>

                <div className="rounded-[28px] border border-slate-100 p-5">
                  <p className="mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Platform Kırılımı</p>
                  {analytics.length === 0 ? (
                    <p className="text-sm font-bold text-slate-400">Veri bulunamadı.</p>
                  ) : (
                    <div className="space-y-3">
                      {analytics.map((row: any) => (
                        <div key={`${row.platform}-${row.fetchedAt}`} className="rounded-2xl bg-slate-50 p-4">
                          <div className="mb-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <PlatformBadge platform={row.platform} />
                              <span className="text-sm font-black capitalize text-slate-800">{row.platform}</span>
                            </div>
                            <span className="text-[11px] font-bold text-slate-400">{formatDateTime(row.fetchedAt)}</span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-center">
                            <TinyMetric label="Beğeni" value={row.likes} />
                            <TinyMetric label="Yorum" value={row.comments} />
                            <TinyMetric label="Etkileşim" value={`${row.engagementRate || 0}%`} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </aside>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm">
        {icon}
      </div>
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
      <p className="mt-1 text-xl font-black text-slate-900">{formatNumber(value)}</p>
    </div>
  );
}

function TinyMetric({ label, value }: { label: string; value: number | string }) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
      <p className="text-sm font-black text-slate-800">{typeof value === "number" ? formatNumber(value) : value}</p>
    </div>
  );
}

function MetaId({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white px-4 py-3 text-xs">
      <p className="font-black uppercase tracking-widest text-slate-400">{label}</p>
      <p className="mt-1 break-all font-bold text-slate-600">{value}</p>
    </div>
  );
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("tr-TR").format(Number(value || 0));
}

function formatDateTime(value: string | Date | null | undefined) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return "-";
  return date.toLocaleString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

"use client";

import { useEffect, useState } from "react";
import { posts, platforms, tenants } from "@/lib/api";
import { getStoredTenantKey, resolveTenantKey, setStoredTenantKey } from "@/lib/tenant";
import { 
  FileEdit, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ListTodo, 
  Facebook, 
  Instagram, 
  Send, 
  Zap 
} from "lucide-react";

interface Stats {
  draft?: number;
  scheduled?: number;
  posted?: number;
  failed?: number;
}

interface QueueItem {
  id: number;
  title: string | null;
  caption: string;
  postType: string;
  platform: string;
  scheduledAt: string | null;
  status: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({});
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [platformStatus, setPlatformStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tenantKey, setTenantKey] = useState("");
  const [tenantItems, setTenantItems] = useState<any[]>([]);

  useEffect(() => {
    tenants
      .list()
      .then((d) => {
        setTenantItems(d.items);
        const nextTenantKey = resolveTenantKey(d.items, getStoredTenantKey());
        setTenantKey(nextTenantKey);
        if (nextTenantKey) setStoredTenantKey(nextTenantKey);
      })
      .catch(() => setTenantItems([]));
  }, []);

  useEffect(() => {
    if (!tenantKey) return;
    async function load() {
      try {
        const [s, q, p] = await Promise.all([
          posts.stats(tenantKey),
          posts.list({ limit: "10", status: "scheduled", tenantKey }),
          platforms.status(tenantKey).catch(() => null),
        ]);
        setStats(s);
        setQueue(q.items);
        setPlatformStatus(p);
      } catch (err) {
        console.error("Dashboard yuklenemedi:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [tenantKey]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <div className="animate-spin h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
        <p className="text-slate-500 font-medium animate-pulse">Dashboard Verileri Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Hoş Geldiniz 👋</h1>
          <p className="text-slate-500 font-medium">Sosyal medya performansınızı ve planlamalarınızı buradan takip edebilirsiniz.</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm shadow-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none cursor-pointer transition-all"
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

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="Taslaklar" 
          value={stats.draft || 0} 
          icon={<FileEdit className="text-slate-400" />} 
          trend="Düzenleme bekleyenler"
        />
        <StatCard 
          label="Zamanlanmış" 
          value={stats.scheduled || 0} 
          icon={<Clock className="text-indigo-500" />} 
          trend="Paylaşılacaklar"
          gradient="from-indigo-50 to-white"
        />
        <StatCard 
          label="Yayınlanmış" 
          value={stats.posted || 0} 
          icon={<CheckCircle2 className="text-emerald-500" />} 
          trend="Başarılı paylaşımlar"
          gradient="from-emerald-50 to-white"
        />
        <StatCard 
          label="Hatalı" 
          value={stats.failed || 0} 
          icon={<AlertCircle className="text-rose-500" />} 
          trend="Kontrol etmeniz gerekenler"
          gradient="from-rose-50 to-white"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Queue */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                  <ListTodo size={20} />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Yayın Kuyruğu</h2>
              </div>
              <a
                href="/posts/new"
                className="px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
              >
                + Yeni Gönderi
              </a>
            </div>

            <div className="p-6">
              {queue.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300 text-2xl">📋</div>
                  <p className="text-slate-400 font-medium italic">
                    Kuyrukta bekleyen gönderi bulunmuyor.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {queue.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 bg-slate-50/50 hover:bg-slate-50 rounded-2xl border border-transparent hover:border-slate-100 transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                          <PostTypeIcon type={item.postType} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 line-clamp-1">
                            {item.title || item.caption.substring(0, 60)}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-200/50 px-2 py-0.5 rounded-md">
                              {item.platform === "both"
                                ? "FB + IG"
                                : item.platform === "facebook"
                                  ? "Facebook"
                                  : "Instagram"}
                            </span>
                            <span className="text-xs text-slate-400 flex items-center gap-1">
                              <Clock size={12} />
                              {item.scheduledAt &&
                                new Date(item.scheduledAt).toLocaleString("tr-TR", { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <StatusBadge status={item.status} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Platform Status & Quick Actions */}
        <div className="space-y-6">
          {platformStatus && (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-6">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Zap size={20} className="text-amber-500" />
                Platform Durumu
              </h2>
              <div className="space-y-4">
                <PlatformRow
                  name="Facebook"
                  connected={platformStatus.facebook?.connected}
                  icon={<Facebook size={18} className="text-blue-600" />}
                />
                <PlatformRow
                  name="Instagram"
                  connected={platformStatus.instagram?.connected}
                  icon={<Instagram size={18} className="text-pink-600" />}
                />
                <PlatformRow
                  name="Telegram"
                  connected={platformStatus.telegram?.connected}
                  icon={<Send size={18} className="text-sky-500" />}
                />
              </div>
              <a href="/settings" className="block text-center py-3 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-widest rounded-xl transition-colors">
                Bağlantıları Yönet
              </a>
            </div>
          )}
          
          {/* Quick Tips */}
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-1 rounded-3xl">
            <div className="bg-white rounded-[22px] p-6">
              <h3 className="font-bold text-slate-900 mb-2">İpucu 💡</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                AI asistanını kullanarak gönderileriniz için daha etkileşimli başlıklar oluşturabilirsiniz. "Yeni Post" ekranında asistanı deneyin!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  trend,
  gradient
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  trend?: string;
  gradient?: string;
}) {
  return (
    <div className={`p-6 flex flex-col justify-between h-full rounded-3xl border border-slate-100 shadow-sm bg-gradient-to-br ${gradient || 'from-white to-white'}`}>
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-white shadow-sm rounded-xl border border-slate-50">
          {icon}
        </div>
      </div>
      <div>
        <p className="text-3xl font-extrabold text-slate-900 mb-1">{value}</p>
        <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">{label}</p>
        {trend && <p className="text-[10px] text-slate-400 mt-2 font-medium">{trend}</p>}
      </div>
    </div>
  );
}

function PlatformRow({
  name,
  connected,
  icon
}: {
  name: string;
  connected: boolean;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/50">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-white rounded-lg shadow-sm">
          {icon}
        </div>
        <span className="text-sm font-bold text-slate-700">{name}</span>
      </div>
      <div className={`px-2 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-widest ${
        connected ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
      }`}>
        {connected ? "Aktif" : "Bağlı Değil"}
      </div>
    </div>
  );
}

function PostTypeIcon({ type }: { type: string }) {
  const icons: Record<string, string> = {
    haber: "📰",
    etkilesim: "💬",
    ilan: "🏷️",
    nostalji: "📸",
    tanitim: "📢",
    kampanya: "🎉",
  };
  return <span>{icons[type] || "📝"}</span>;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: "bg-slate-100 text-slate-600 border-slate-200",
    scheduled: "bg-indigo-50 text-indigo-600 border-indigo-100",
    posted: "bg-emerald-50 text-emerald-600 border-emerald-100",
    failed: "bg-rose-50 text-rose-600 border-rose-100",
    publishing: "bg-amber-50 text-amber-600 border-amber-100",
    cancelled: "bg-slate-200 text-slate-500 border-slate-300",
  };
  const labels: Record<string, string> = {
    draft: "Taslak",
    scheduled: "Zamanlandı",
    posted: "Yayınlandı",
    failed: "Hatalı",
    publishing: "Yayınlanıyor",
    cancelled: "İptal",
  };

  return (
    <span
      className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border ${styles[status] || "bg-slate-100"}`}
    >
      {labels[status] || status}
    </span>
  );
}

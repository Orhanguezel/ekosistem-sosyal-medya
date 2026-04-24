"use client";

import { useState, useEffect, useRef } from "react";
import { API_ORIGIN, posts, ai, templates as templatesApi, tenants, storage } from "@/lib/api";
import { getStoredTenantKey, resolveTenantAssetUrl, resolveTenantKey, setStoredTenantKey } from "@/lib/tenant";
import { 
  Plus, 
  Sparkles, 
  Calendar, 
  Globe, 
  Image as ImageIcon, 
  Link as LinkIcon, 
  Hash, 
  Facebook, 
  Instagram, 
  Smartphone, 
  Send, 
  Save, 
  RefreshCw, 
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Layout,
  Type,
  Clock,
  Zap,
  ArrowRight,
  ThumbsUp,
  MessageSquare,
  Share2,
  ArrowLeft,
  Upload,
  Library,
  X,
  Search,
  Trash2,
  Check,
  FolderOpen
} from "lucide-react";

function toDatetimeLocal(value: string | Date | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return "";
  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

const POST_IMAGE_BUCKET = "public";
const POST_IMAGE_FOLDER = "social-posts";

type StorageAssetItem = {
  id?: string;
  asset_id?: string;
  name?: string;
  bucket?: string;
  path?: string;
  folder?: string | null;
  mime?: string;
  size?: number;
  url?: string | null;
  created_at?: string;
  createdAt?: string;
};

function normalizeStorageUrl(raw?: string | null) {
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith("/api/")) return `${API_ORIGIN}${raw}`;
  if (raw.startsWith("/storage/")) return `${API_ORIGIN}/api/v1${raw}`;
  return resolveTenantAssetUrl(raw) || raw;
}

function encodePath(path: string) {
  return path.split("/").map((part) => encodeURIComponent(part)).join("/");
}

function getAssetUrl(asset: StorageAssetItem) {
  const direct = normalizeStorageUrl(asset.url);
  if (direct) return direct;
  if (asset.bucket && asset.path) {
    return `${API_ORIGIN}/api/v1/storage/${encodeURIComponent(asset.bucket)}/${encodePath(asset.path)}`;
  }
  return "";
}

function isImageAsset(asset: StorageAssetItem) {
  const mime = String(asset.mime || "").toLowerCase();
  if (mime.startsWith("image/")) return true;
  const source = `${asset.url || ""} ${asset.path || ""} ${asset.name || ""}`.toLowerCase();
  return /\.(png|jpe?g|webp|gif|svg|avif|ico)(\?|#|$)/i.test(source);
}

function formatAssetDate(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return "";
  return date.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function NewPostPage() {
  const [form, setForm] = useState({
    postType: "haber",
    caption: "",
    title: "",
    hashtags: "",
    imageUrl: "",
    linkUrl: "",
    platform: "both",
    scheduledAt: "",
  });
  const [templates, setTemplates] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [tenantKey, setTenantKey] = useState("");
  const [tenantItems, setTenantItems] = useState<any[]>([]);
  const [previewPlatform, setPreviewPlatform] = useState<"facebook" | "instagram">("facebook");
  const [editId, setEditId] = useState<number | null>(null);
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState("");
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [libraryError, setLibraryError] = useState("");
  const [librarySearch, setLibrarySearch] = useState("");
  const [libraryItems, setLibraryItems] = useState<StorageAssetItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const isEditing = editId !== null;

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        const d = await tenants.list();
        if (!mounted) return;

        setTenantItems(d.items);
        let nextTenantKey = resolveTenantKey(d.items, getStoredTenantKey());

        const editParam = new URLSearchParams(window.location.search).get("edit");
        const parsedEditId = editParam ? Number(editParam) : NaN;

        if (Number.isFinite(parsedEditId) && parsedEditId > 0) {
          setEditId(parsedEditId);
          setLoadingExisting(true);
          try {
            const post = await posts.get(parsedEditId);
            if (!mounted) return;
            nextTenantKey = post.subType || nextTenantKey;
            setForm({
              postType: post.postType || "haber",
              caption: post.caption || "",
              title: post.title || "",
              hashtags: post.hashtags || "",
              imageUrl: post.imageUrl || "",
              linkUrl: post.linkUrl || "",
              platform: post.platform || "both",
              scheduledAt: toDatetimeLocal(post.scheduledAt),
            });
          } catch (err) {
            alert("İçerik yüklenemedi: " + (err as Error).message);
          } finally {
            if (mounted) setLoadingExisting(false);
          }
        }

        setTenantKey(nextTenantKey);
        if (nextTenantKey) {
          setStoredTenantKey(nextTenantKey);
          templatesApi.list(nextTenantKey).then((data) => setTemplates(data.items)).catch(() => {});
        }
      } catch {
        if (mounted) setTenantItems([]);
      }
    }

    init();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!tenantKey) return;
    templatesApi.list(tenantKey).then((d) => setTemplates(d.items)).catch(() => setTemplates([]));
  }, [tenantKey]);

  async function loadImageLibrary(search = librarySearch) {
    setLibraryLoading(true);
    setImageError("");
    setLibraryError("");
    try {
      const data = await storage.list({
        bucket: POST_IMAGE_BUCKET,
        mime: "image",
        q: search.trim() || undefined,
        sort: "created_at",
        order: "desc",
        limit: 120,
      });
      setLibraryItems((data.items || []).filter(isImageAsset));
    } catch (err) {
      const message = "Görsel kütüphanesi yüklenemedi: " + (err as Error).message;
      setImageError(message);
      setLibraryError(message);
      setLibraryItems([]);
    } finally {
      setLibraryLoading(false);
    }
  }

  async function openImageLibrary() {
    setLibraryOpen(true);
    await loadImageLibrary();
  }

  function selectImageUrl(nextUrl: string) {
    setForm((current) => ({ ...current, imageUrl: nextUrl }));
    setImageError("");
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setImageError("Lütfen görsel dosyası seçin.");
      return;
    }

    setUploadingImage(true);
    setImageError("");
    try {
      const res = await storage.upload(file, POST_IMAGE_FOLDER, POST_IMAGE_BUCKET, {
        tenantKey,
        source: "social-post",
      });
      const nextUrl = getAssetUrl(res);
      if (!nextUrl) throw new Error("Storage görsel URL'i döndürmedi.");
      selectImageUrl(nextUrl);
      if (libraryOpen) await loadImageLibrary();
    } catch (err) {
      setImageError("Görsel yüklenemedi: " + (err as Error).message);
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const data: any = {
        tenantKey,
        postType: form.postType,
        caption: form.caption,
        platform: form.platform,
      };
      if (form.title) data.title = form.title;
      if (form.hashtags) data.hashtags = form.hashtags;
      if (form.imageUrl) data.imageUrl = form.imageUrl;
      if (form.linkUrl) data.linkUrl = form.linkUrl;

      if (isEditing && editId) {
        await posts.update(editId, data);
        if (form.scheduledAt) {
          await posts.schedule(editId, new Date(form.scheduledAt).toISOString());
        }
        setSuccess(form.scheduledAt ? "İçerik güncellendi ve yayın takvimine alındı." : "İçerik güncellendi.");
      } else {
        if (form.scheduledAt) data.scheduledAt = new Date(form.scheduledAt).toISOString();
        await posts.create(data);
        setSuccess("İçerik başarıyla oluşturuldu!");
        setForm({
          postType: "haber", caption: "", title: "", hashtags: "",
          imageUrl: "", linkUrl: "", platform: "both", scheduledAt: "",
        });
      }
      setTimeout(() => setSuccess(""), 5000);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAIGenerate() {
    setAiLoading(true);
    try {
      if (form.postType === "etkilesim") {
        const result = await ai.engagementPost({ tenantKey, type: "soru" });
        setForm({ ...form, caption: result.caption, hashtags: result.hashtags });
      } else {
        const result = await ai.generateCaption({
          tenantKey,
          title: form.title || "Güncel gelişme",
        });
        setForm({ ...form, caption: result.caption, hashtags: result.hashtags });
      }
    } catch (err) {
      alert("AI içerik üretimi başarısız: " + (err as Error).message);
    } finally {
      setAiLoading(false);
    }
  }

  async function handleTemplateSelect(templateId: number) {
    const template = templates.find((t: any) => t.id === templateId);
    if (template) {
      setForm({
        ...form,
        postType: template.postType,
        caption: template.captionTemplate,
        hashtags: template.hashtags || "",
        platform: template.platform,
      });
    }
  }

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
            {isEditing ? "İçerik Düzenle" : "Yeni İçerik Oluştur"}
          </h1>
          <p className="text-slate-500 font-medium">
            {isEditing
              ? "Taslak içeriği güncelleyin, görselini değiştirin veya yayın takvimine alın."
              : "Yaratıcılığınızı serbest bırakın, AI desteği ile içeriklerinizi parlatın."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/posts"
            className="flex items-center gap-2 px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-600 hover:text-slate-900 hover:border-slate-300 transition-all shadow-sm"
          >
            <ArrowLeft size={18} />
            Arşiv
          </a>
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
        </div>
      </div>

      {success && (
        <div className="mb-10 bg-emerald-50 border border-emerald-100 p-6 rounded-[24px] flex items-center justify-between animate-in slide-in-from-top-4">
          <div className="flex items-center gap-4 text-emerald-700 font-bold">
            <CheckCircle2 size={24} />
            {success}
          </div>
          <a href="/posts" className="flex items-center gap-2 text-emerald-600 font-black text-sm uppercase tracking-widest hover:underline">
            İçeriklere Git <ArrowRight size={16} />
          </a>
        </div>
      )}

      {loadingExisting && (
        <div className="mb-10 bg-white border border-slate-100 p-6 rounded-[24px] flex items-center gap-4 text-slate-500 font-bold shadow-sm">
          <RefreshCw className="animate-spin text-indigo-500" size={22} />
          İçerik yükleniyor...
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Form Column */}
        <div className="lg:col-span-7 space-y-8">
           <form onSubmit={handleSubmit} className="space-y-8">
              {/* Template Section */}
              {templates.length > 0 && (
                <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-4">
                   <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] px-1">Şablondan Başlat</label>
                   <select
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-semibold text-slate-700"
                    onChange={(e) => {
                      if (e.target.value) handleTemplateSelect(Number(e.target.value));
                    }}
                    defaultValue=""
                  >
                    <option value="">Bir şablon seçin...</option>
                    {templates.map((t: any) => (
                      <option key={t.id} value={t.id}>{t.name} ({t.postType})</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Core Content Card */}
              <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-8">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <InputField 
                      label="Post Türü" 
                      icon={<Layout size={18}/>}
                    >
                       <select 
                        value={form.postType}
                        onChange={(e) => setForm({ ...form, postType: e.target.value })}
                        className="w-full bg-transparent border-none p-0 focus:ring-0 font-bold text-slate-700 cursor-pointer"
                       >
                          <option value="haber">📰 Haber</option>
                          <option value="etkilesim">💬 Etkileşim</option>
                          <option value="ilan">🏷️ İlan</option>
                          <option value="nostalji">📸 Nostalji</option>
                          <option value="tanitim">📢 Tanıtım</option>
                          <option value="kampanya">🎉 Kampanya</option>
                       </select>
                    </InputField>

                    <InputField 
                      label="Başlık (Dahili)" 
                      icon={<Type size={18}/>}
                    >
                       <input 
                        type="text"
                        placeholder="İç referans adı..."
                        className="w-full bg-transparent border-none p-0 focus:ring-0 font-bold text-slate-700"
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                       />
                    </InputField>
                 </div>

                 <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                       <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">İçerik Metni</label>
                       <button
                        type="button"
                        onClick={handleAIGenerate}
                        disabled={aiLoading}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg hover:shadow-indigo-600/20 transition-all font-bold text-xs disabled:opacity-50"
                      >
                        {aiLoading ? <RefreshCw className="animate-spin" size={14} /> : <Sparkles size={14} />}
                        {aiLoading ? "Yapay Zeka Üretiyor..." : "AI ile Sihir Yap"}
                      </button>
                    </div>
                    <div className="relative">
                       <textarea 
                        className="w-full bg-slate-50 border border-slate-200 rounded-[32px] px-8 py-6 h-48 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-semibold text-slate-700 resize-none"
                        placeholder="Buraya yazın veya AI butonuna tıklayın..."
                        value={form.caption}
                        onChange={(e) => setForm({ ...form, caption: e.target.value })}
                        required
                       />
                       <div className="absolute bottom-6 right-8 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white/80 backdrop-blur px-2 py-1 rounded-md">
                          {form.caption.length} Karakter
                       </div>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <InputField label="Hashtags" icon={<Hash size={18}/>}>
                       <input 
                        type="text"
                        placeholder="#etiket #paylas..."
                        className="w-full bg-transparent border-none p-0 focus:ring-0 font-bold text-slate-700"
                        value={form.hashtags}
                        onChange={(e) => setForm({ ...form, hashtags: e.target.value })}
                       />
                    </InputField>
                    <div className="md:col-span-2 space-y-3">
                      <div className="flex items-center justify-between gap-3 px-1">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                          Görsel
                        </label>
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageUpload}
                          />
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadingImage}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-600 shadow-sm transition-all hover:border-indigo-200 hover:text-indigo-600 disabled:opacity-50"
                          >
                            {uploadingImage ? <RefreshCw className="animate-spin" size={14} /> : <Upload size={14} />}
                            Dosyadan Yükle
                          </button>
                          <button
                            type="button"
                            onClick={openImageLibrary}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-600 shadow-sm transition-all hover:border-indigo-200 hover:text-indigo-600"
                          >
                            <Library size={14} />
                            Kütüphaneden Seç
                          </button>
                          {form.imageUrl && (
                            <button
                              type="button"
                              onClick={() => selectImageUrl("")}
                              className="inline-flex items-center gap-2 rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-xs font-black text-rose-500 transition-all hover:bg-rose-100"
                            >
                              <Trash2 size={14} />
                              Kaldır
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="bg-slate-50 border border-slate-200 rounded-[24px] p-4 focus-within:ring-4 focus-within:ring-indigo-500/10 focus-within:border-indigo-500 transition-all">
                        <div className="flex flex-col md:flex-row gap-4">
                          <div className="md:w-44 aspect-video rounded-2xl bg-white border border-slate-100 overflow-hidden flex items-center justify-center shrink-0">
                            {form.imageUrl ? (
                              <img src={form.imageUrl} alt="Seçili görsel" className="h-full w-full object-cover" />
                            ) : (
                              <ImageIcon size={32} className="text-slate-300" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0 space-y-3">
                            <div className="flex items-center gap-3 rounded-2xl bg-white border border-slate-100 px-4 py-3">
                              <ImageIcon size={18} className="text-slate-400 shrink-0" />
                              <input
                                type="url"
                                placeholder="https://gorsel.jpg"
                                className="w-full bg-transparent border-none p-0 focus:ring-0 font-bold text-slate-700"
                                value={form.imageUrl}
                                onChange={(e) => selectImageUrl(e.target.value)}
                              />
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                              <FolderOpen size={13} />
                              Storage klasörü: {POST_IMAGE_FOLDER}
                            </div>
                          </div>
                        </div>
                      </div>
                      {imageError && (
                        <div className="flex items-center gap-2 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-600">
                          <AlertCircle size={16} />
                          {imageError}
                        </div>
                      )}
                    </div>
                    <InputField label="Link URL" icon={<LinkIcon size={18}/>}>
                       <input 
                        type="url"
                        placeholder="https://site.com/link"
                        className="w-full bg-transparent border-none p-0 focus:ring-0 font-bold text-slate-700"
                        value={form.linkUrl}
                        onChange={(e) => setForm({ ...form, linkUrl: e.target.value })}
                       />
                    </InputField>
                    <InputField label="Zamanlama (Opsiyonel)" icon={<Clock size={18}/>}>
                       <input 
                        type="datetime-local"
                        className="w-full bg-transparent border-none p-0 focus:ring-0 font-bold text-slate-700 cursor-pointer"
                        value={form.scheduledAt}
                        onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
                       />
                    </InputField>
                 </div>
              </div>

              {/* Platform Selector & Actions */}
              <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                 <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-2xl w-full md:w-auto">
                    <PlatformTab 
                      active={form.platform === "both"} 
                      onClick={() => setForm({ ...form, platform: "both" })} 
                      label="Hepsi" 
                    />
                    <PlatformTab 
                      active={form.platform === "facebook"} 
                      onClick={() => setForm({ ...form, platform: "facebook" })} 
                      icon={<Facebook size={14} />} 
                      label="FB" 
                    />
                    <PlatformTab 
                      active={form.platform === "instagram"} 
                      onClick={() => setForm({ ...form, platform: "instagram" })} 
                      icon={<Instagram size={14} />} 
                      label="IG" 
                    />
                 </div>

                 <div className="flex items-center gap-4 w-full md:w-auto">
                    <button
                      type="submit"
                      disabled={submitting || loadingExisting || !form.caption}
                      className="flex-1 md:flex-none flex items-center justify-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-[20px] hover:bg-slate-800 transition-all font-bold shadow-xl shadow-slate-900/10 disabled:opacity-50"
                    >
                      {submitting ? <RefreshCw className="animate-spin" size={20} /> : <Save size={20} />}
                      {isEditing
                        ? form.scheduledAt
                          ? "Güncelle ve Zamanla"
                          : "Güncelle"
                        : form.scheduledAt
                          ? "Zamanla"
                          : "Taslak Kaydet"}
                    </button>
                    <button
                      type="submit"
                      disabled={submitting || loadingExisting || !form.caption}
                      className="p-4 bg-indigo-600 text-white rounded-[20px] hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/10 disabled:opacity-50"
                      title={isEditing ? "Güncelle" : "Kaydet"}
                    >
                       <Send size={20} />
                    </button>
                 </div>
              </div>
           </form>
        </div>

        {/* Preview Column */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-10 h-fit">
           <div className="flex items-center justify-between px-2">
              <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Canlı Önizleme</h2>
              <div className="flex gap-2">
                 <button 
                  onClick={() => setPreviewPlatform("facebook")}
                  className={`p-2 rounded-lg transition-all ${previewPlatform === "facebook" ? "bg-blue-100 text-blue-600 shadow-sm" : "bg-white text-slate-400 border border-slate-100"}`}
                 >
                    <Facebook size={18} />
                 </button>
                 <button 
                  onClick={() => setPreviewPlatform("instagram")}
                  className={`p-2 rounded-lg transition-all ${previewPlatform === "instagram" ? "bg-pink-100 text-pink-600 shadow-sm" : "bg-white text-slate-400 border border-slate-100"}`}
                 >
                    <Instagram size={18} />
                 </button>
              </div>
           </div>

           {/* Mockup Container */}
           <div className="bg-slate-100 rounded-[48px] p-6 shadow-inner border-[12px] border-slate-900 overflow-hidden min-h-[600px] flex flex-col">
              <div className="bg-white rounded-[32px] flex-1 overflow-hidden flex flex-col shadow-2xl">
                 {/* Mockup Header */}
                 <div className="p-4 border-b border-slate-50 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200 animate-pulse"></div>
                    <div className="space-y-1">
                       <div className="h-3 w-24 bg-slate-200 rounded animate-pulse"></div>
                       <div className="h-2 w-16 bg-slate-100 rounded animate-pulse"></div>
                    </div>
                 </div>

                 {/* Mockup Media */}
                 <div className="aspect-square bg-slate-50 relative flex items-center justify-center overflow-hidden">
                    {form.imageUrl ? (
                      <img src={form.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-slate-300">
                         <ImageIcon size={48} />
                         <p className="text-[10px] font-bold uppercase tracking-widest">Görsel Seçilmedi</p>
                      </div>
                    )}
                    <div className="absolute top-4 right-4 bg-black/20 backdrop-blur text-white p-2 rounded-full">
                       <Smartphone size={14} />
                    </div>
                 </div>

                 {/* Mockup Actions */}
                 <div className="p-4 flex items-center gap-4">
                    <ThumbsUp size={20} className="text-slate-400" />
                    <MessageSquare size={20} className="text-slate-400" />
                    <Share2 size={20} className="text-slate-400" />
                 </div>

                 {/* Mockup Caption */}
                 <div className="p-4 pt-0 flex-1 overflow-y-auto scrollbar-none">
                    <p className="text-sm text-slate-800 font-medium whitespace-pre-wrap leading-relaxed">
                       {form.caption || "İçerik metni burada görünecek..."}
                    </p>
                    {form.hashtags && (
                      <p className="text-sm text-indigo-600 font-bold mt-2">
                        {form.hashtags}
                      </p>
                    )}
                 </div>
              </div>
              <div className="h-1.5 w-32 bg-slate-800 mx-auto mt-6 rounded-full"></div>
           </div>
           
           <div className="bg-indigo-50 border border-indigo-100 rounded-[24px] p-6 flex gap-4">
              <Zap size={20} className="text-indigo-600 shrink-0" />
              <p className="text-[11px] text-indigo-800/70 font-bold leading-relaxed">
                 Önizleme modu yaklaşık bir gösterim sunar. Platformların güncel tasarım değişiklikleri veya link önizlemeleri farklılık gösterebilir.
              </p>
           </div>
        </div>
      </div>
      {libraryOpen && (
        <ImageLibraryModal
          items={libraryItems}
          loading={libraryLoading}
          error={libraryError}
          search={librarySearch}
          selectedUrl={form.imageUrl}
          onSearchChange={setLibrarySearch}
          onSearchSubmit={() => loadImageLibrary(librarySearch)}
          onRefresh={() => loadImageLibrary()}
          onClose={() => setLibraryOpen(false)}
          onSelect={(url) => {
            selectImageUrl(url);
            setLibraryOpen(false);
          }}
        />
      )}
    </div>
  );
}

// ─── Local UI Components ───────────────────────────────────

function ImageLibraryModal({
  items,
  loading,
  error,
  search,
  selectedUrl,
  onSearchChange,
  onSearchSubmit,
  onRefresh,
  onClose,
  onSelect,
}: {
  items: StorageAssetItem[];
  loading: boolean;
  error: string;
  search: string;
  selectedUrl: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit: () => void;
  onRefresh: () => void;
  onClose: () => void;
  onSelect: (url: string) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
      <div className="w-full max-w-5xl overflow-hidden rounded-[32px] border border-white/70 bg-white shadow-2xl">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">Storage Kütüphanesi</p>
            <h2 className="mt-1 text-2xl font-black text-slate-900">Görsel Seç</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-black text-slate-600 transition-all hover:border-indigo-200 hover:text-indigo-600 disabled:opacity-50"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              Yenile
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-500 transition-all hover:bg-slate-50 hover:text-slate-900"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-6">
          <form
            className="mb-6 flex flex-col gap-3 md:flex-row"
            onSubmit={(e) => {
              e.preventDefault();
              onSearchSubmit();
            }}
          >
            <div className="flex flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-500/10">
              <Search size={18} className="text-slate-400" />
              <input
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Görsel ara..."
                className="w-full bg-transparent text-sm font-bold text-slate-700 outline-none"
              />
            </div>
            <button
              type="submit"
              className="rounded-2xl bg-slate-900 px-6 py-3 text-sm font-black text-white transition-all hover:bg-slate-800"
            >
              Ara
            </button>
          </form>

          {error ? (
            <div className="flex min-h-80 flex-col items-center justify-center rounded-[28px] border border-rose-100 bg-rose-50 px-6 text-center text-rose-600">
              <AlertCircle size={34} className="mb-3" />
              <p className="text-sm font-black">{error}</p>
            </div>
          ) : loading ? (
            <div className="flex min-h-80 items-center justify-center rounded-[28px] border border-slate-100 bg-slate-50 text-slate-500">
              <RefreshCw className="mr-3 animate-spin text-indigo-500" size={22} />
              <span className="text-sm font-black">Görseller yükleniyor...</span>
            </div>
          ) : items.length ? (
            <div className="grid max-h-[58vh] grid-cols-2 gap-4 overflow-y-auto pr-2 md:grid-cols-3 lg:grid-cols-4">
              {items.map((asset) => {
                const url = getAssetUrl(asset);
                const isSelected = !!url && url === selectedUrl;
                return (
                  <button
                    key={asset.id || asset.asset_id || `${asset.bucket}-${asset.path}`}
                    type="button"
                    onClick={() => url && onSelect(url)}
                    disabled={!url}
                    className={`group relative overflow-hidden rounded-[24px] border bg-white text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 ${
                      isSelected ? "border-indigo-500 ring-4 ring-indigo-500/10" : "border-slate-100"
                    }`}
                  >
                    <div className="aspect-square bg-slate-100">
                      {url ? (
                        <img src={url} alt={asset.name || "Storage görseli"} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-slate-300">
                          <ImageIcon size={34} />
                        </div>
                      )}
                    </div>
                    <div className="space-y-1 p-3">
                      <p className="truncate text-xs font-black text-slate-800" title={asset.name || asset.path || ""}>
                        {asset.name || asset.path || "Adsız görsel"}
                      </p>
                      <p className="truncate text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        {asset.folder || asset.bucket || "storage"} {formatAssetDate(asset.created_at || asset.createdAt)}
                      </p>
                    </div>
                    {isSelected && (
                      <div className="absolute right-3 top-3 rounded-full bg-indigo-600 p-2 text-white shadow-lg">
                        <Check size={16} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex min-h-80 flex-col items-center justify-center rounded-[28px] border border-slate-100 bg-slate-50 text-center">
              <ImageIcon size={42} className="mb-3 text-slate-300" />
              <p className="text-sm font-black text-slate-600">Kütüphanede görsel bulunamadı.</p>
              <p className="mt-1 text-xs font-bold text-slate-400">Dosyadan yüklediğiniz görseller burada listelenir.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InputField({ label, icon, children }: { label: string, icon: React.ReactNode, children: React.ReactNode }) {
  return (
    <div className="space-y-2 group">
      <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] px-1">{label}</label>
      <div className="bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 flex items-center gap-3 focus-within:ring-4 focus-within:ring-indigo-500/10 focus-within:border-indigo-500 transition-all">
         <div className="text-slate-400 group-focus-within:text-indigo-500 transition-colors">
            {icon}
         </div>
         <div className="flex-1">
            {children}
         </div>
      </div>
    </div>
  );
}

function PlatformTab({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon?: React.ReactNode, label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all font-bold text-xs ${
        active 
          ? "bg-white text-slate-900 shadow-md" 
          : "text-slate-500 hover:text-slate-900"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

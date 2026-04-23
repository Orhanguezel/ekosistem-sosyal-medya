import * as postRepo from "../modules/posts/repository";
import * as generator from "../modules/ai/generator";
import { listActiveTenants } from "../modules/tenants/service";

interface SourceArticle {
  id: number | string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  cover_url?: string;
  cover_image_url?: string;
  image_url?: string;
  source_url?: string;
  published_at: string;
}

async function syncTenantNews(tenantKey: string, sourceUrl: string, sourceType: string) {
  const tenant = (await listActiveTenants()).find((t) => t.key === tenantKey);
  if (!tenant) return;

  const sourceLabel = tenant.branding.contentSourceLabel || tenant.name;
  const defaultHashtags = tenant.branding.defaultHashtags || "#sosyalmedya";
  const websiteUrl = tenant.branding.defaultLinkUrl || tenant.websiteUrl || "";

  // Kaynak API endpoint'ini belirle (Standart yapı)
  const apiPath = sourceType === "bereketfide" ? "/products" : "/articles";
  const endpoint = `${sourceUrl.replace(/\/$/, "")}${apiPath}?limit=10&locale=tr`;

  let articles: SourceArticle[] = [];
  try {
    const res = await fetch(endpoint, { headers: { Accept: "application/json" } });
    if (!res.ok) {
      console.warn(`[sync:${tenantKey}] API'ye baglanilamadi (${res.status}): ${endpoint}`);
      return;
    }
    const data = (await res.json()) as any;
    articles = data.items || data || [];
  } catch (err) {
    console.warn(`[sync:${tenantKey}] Fetch hatasi:`, (err as Error).message);
    return;
  }

  if (articles.length === 0) {
    console.log(`[sync:${tenantKey}] Yeni makale yok`);
    return;
  }

  let imported = 0;

  for (const article of articles) {
    const sourceRef = `${tenantKey}-article-${article.id}`;

    const existing = await postRepo.getPostBySourceRef(tenantKey, sourceRef);
    if (existing) continue;

    let caption: string;
    let hashtags = defaultHashtags;

    try {
      const aiResult = await generator.generateNewsCaption(
        tenantKey,
        article.title,
        article.excerpt,
        article.source_url || `${websiteUrl}/haberler/${article.slug}`
      );
      caption = aiResult.caption;
      hashtags = aiResult.hashtags;
    } catch {
      caption = `📍 ${sourceLabel} guncellemesi\n\n${article.title}\n\n${article.excerpt || ""}\n\nDetaylar: ${websiteUrl}/haberler/${article.slug}`;
    }

    await postRepo.createPost({
      tenantKey,
      postType: "haber",
      title: article.title,
      caption: `${caption}\n\n${hashtags}`,
      hashtags,
      imageUrl: article.cover_image_url || article.cover_url || article.image_url || undefined,
      linkUrl: `${websiteUrl}/haberler/${article.slug}`,
      platform: "both",
      sourceType: "news",
      sourceRef,
    });

    imported++;
  }

  if (imported > 0) {
    console.log(`[sync:${tenantKey}] ${imported} yeni makale import edildi`);
  }
}

export async function syncSourceNews() {
  try {
    const tenants = await listActiveTenants();
    // Sadece content_source_url tanimlanmis tenant'lari isle
    const syncable = tenants.filter(
      (t) => (t as any).contentSourceUrl && (t as any).contentSourceUrl.trim()
    );

    if (syncable.length === 0) {
      console.log("[sync] Senkronize edilecek tenant yok (content_source_url bos)");
      return;
    }

    for (const tenant of syncable) {
      await syncTenantNews(
        tenant.key,
        (tenant as any).contentSourceUrl as string,
        (tenant as any).contentSourceType as string || "generic"
      );
    }
  } catch (err) {
    console.error("[sync] Senkronizasyon hatasi:", err);
  }
}

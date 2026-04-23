import { generate, parseAIJson } from "./providers";
import { buildSystemPrompt, NEWS_TO_SOCIAL, ENGAGEMENT_POST, PRODUCT_PROMO, WEEKLY_PLAN } from "./prompts";
import * as postRepo from "../posts/repository";
import { getTenantByKey } from "../tenants/service";

interface CaptionResult {
  caption: string;
  hashtags: string;
  suggested_time?: string;
  model: string;
  provider: string;
}

interface EngagementResult {
  caption: string;
  hashtags: string;
  engagement_type: string;
  model: string;
  provider: string;
}

interface WeeklyPlanResult {
  days: Array<{
    date: string;
    posts: Array<{
      time_slot: string;
      post_type: string;
      topic: string;
      caption_idea: string;
    }>;
  }>;
  model: string;
  provider: string;
}

// ─── Haber -> Sosyal Medya ──────────────────────────────────
export async function generateNewsCaption(
  tenantKey: string,
  title: string,
  content?: string,
  url?: string
): Promise<CaptionResult> {
  const tenant = await getTenantByKey(tenantKey);
  const branding = tenant?.branding;
  const prompt = NEWS_TO_SOCIAL
    .replace("{{title}}", title)
    .replace("{{content}}", content || "")
    .replace("{{url}}", url || branding?.defaultLinkUrl || tenant?.websiteUrl || "");

  const response = await generate(
    buildSystemPrompt({
      brandName: branding?.appName || tenant?.name || "Marka",
      sector: branding?.sector,
      audience: branding?.audience,
    }),
    prompt
  );
  const parsed = parseAIJson<{ caption: string; hashtags: string; suggested_time?: string }>(
    response.content
  );

  return {
    ...parsed,
    model: response.model,
    provider: response.provider,
  };
}

// ─── Etkilesim Postu Uret ──────────────────────────────────
export async function generateEngagementPost(
  tenantKey: string,
  type: string = "soru",
  topic?: string
): Promise<EngagementResult> {
  const tenant = await getTenantByKey(tenantKey);
  const branding = tenant?.branding;
  const prompt = ENGAGEMENT_POST
    .replace("{{type}}", type)
    .replace("{{topic}}", topic || "serbest - kendin sec");

  const response = await generate(
    buildSystemPrompt({
      brandName: branding?.appName || tenant?.name || "Marka",
      sector: branding?.sector,
      audience: branding?.audience,
    }),
    prompt
  );
  const parsed = parseAIJson<{ caption: string; hashtags: string; engagement_type: string }>(
    response.content
  );

  return {
    ...parsed,
    model: response.model,
    provider: response.provider,
  };
}

// ─── Ilan Tanitim Postu ────────────────────────────────────
export async function generateListingPromo(listing: {
  tenantKey?: string;
  title: string;
  price?: string;
  category?: string;
  location?: string;
  url?: string;
}): Promise<CaptionResult> {
  const tenant = listing.tenantKey ? await getTenantByKey(listing.tenantKey) : null;
  const branding = tenant?.branding;
  const brandName = branding?.appName || tenant?.name || "Marka";
  const brandTag = brandName.toLowerCase().replace(/[^a-z0-9]+/g, "");
  const prompt = PRODUCT_PROMO
    .replace("{{name}}", listing.title)
    .replace("{{price}}", listing.price || "Belirtilmemis")
    .replace("{{category}}", listing.category || "Genel")
    .replace("{{description}}", listing.location || "")
    .replace("{{url}}", listing.url || branding?.defaultLinkUrl || tenant?.websiteUrl || "")
    .replace("{{brand}}", brandName)
    .replace("{{brand_tag}}", brandTag || "marka");

  const response = await generate(
    buildSystemPrompt({
      brandName,
      sector: branding?.sector,
      audience: branding?.audience,
    }),
    prompt
  );
  const parsed = parseAIJson<{ caption: string; hashtags: string }>(response.content);

  return {
    ...parsed,
    model: response.model,
    provider: response.provider,
  };
}

// ─── Haftalik Plan Uret ────────────────────────────────────
export async function generateWeeklyPlan(
  tenantKey: string,
  startDate: string
): Promise<WeeklyPlanResult> {
  const tenant = await getTenantByKey(tenantKey);
  const branding = tenant?.branding;
  const prompt = WEEKLY_PLAN
    .replace("{{start_date}}", startDate)
    .replace("{{brand}}", branding?.appName || tenant?.name || "Marka")
    .replace("{{sector}}", branding?.sector || "genel");

  const response = await generate(
    buildSystemPrompt({
      brandName: branding?.appName || tenant?.name || "Marka",
      sector: branding?.sector,
      audience: branding?.audience,
    }),
    prompt
  );
  const parsed = parseAIJson<{ days: WeeklyPlanResult["days"] }>(response.content);

  return {
    ...parsed,
    model: response.model,
    provider: response.provider,
  };
}

// ─── AI ile Post Olustur ve Kuyruge Ekle ────────────────────
export async function generateAndQueuePost(
  tenantKey: string,
  type: "haber" | "etkilesim" | "ilan",
  data: Record<string, string>,
  scheduledAt?: string
) {
  let caption: string;
  let hashtags: string;
  let aiModel: string;

  if (type === "haber") {
    const result = await generateNewsCaption(tenantKey, data.title, data.content, data.url);
    caption = result.caption;
    hashtags = result.hashtags;
    aiModel = result.model;
  } else if (type === "etkilesim") {
    const result = await generateEngagementPost(tenantKey, data.type, data.topic);
    caption = result.caption;
    hashtags = result.hashtags;
    aiModel = result.model;
  } else {
    const result = await generateListingPromo({ ...(data as any), tenantKey });
    caption = result.caption;
    hashtags = result.hashtags;
    aiModel = result.model;
  }

  const post = await postRepo.createPost({
    tenantKey,
    postType: type,
    title: data.title || undefined,
    caption: `${caption}\n\n${hashtags}`,
    hashtags,
    platform: "both",
    sourceType: "ai",
    scheduledAt,
  });

  return { post, aiModel };
}

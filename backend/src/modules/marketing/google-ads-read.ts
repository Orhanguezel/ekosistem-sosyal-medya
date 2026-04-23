import { env } from "../../core/env";

type GoogleAdsRow = Record<string, unknown>;

export type GoogleAdsOperation = Record<string, unknown>;

export type GoogleAdsChangeSetPayload = {
  kind: "performance_max_text_asset_plan" | "campaign_update" | "budget_update";
  notes?: string;
  campaignResourceName?: string;
  campaignBudgetResourceName?: string;
  assetGroupResourceName?: string;
  textAssets?: {
    headlines?: string[];
    longHeadlines?: string[];
    descriptions?: string[];
    businessName?: string;
  };
  imageChecklist?: string[];
  operations?: GoogleAdsOperation[];
  manualSteps?: string[];
};

type GoogleAdsContext = {
  customerId: string;
  managerId?: string;
};

export function normalizeCustomerId(id: string): string {
  return id.replace(/-/g, "").trim();
}

function apiVersion() {
  return env.GOOGLE_ADS_API_VERSION || "v22";
}

function assertCredentials() {
  const developerToken = env.GOOGLE_ADS_DEVELOPER_TOKEN?.trim();
  const clientId = env.GOOGLE_ADS_CLIENT_ID?.trim();
  const clientSecret = env.GOOGLE_ADS_CLIENT_SECRET?.trim();
  const refreshToken = env.GOOGLE_ADS_REFRESH_TOKEN?.trim();
  if (!developerToken || !clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "Google Ads API icin GOOGLE_ADS_DEVELOPER_TOKEN, GOOGLE_ADS_CLIENT_ID, GOOGLE_ADS_CLIENT_SECRET, GOOGLE_ADS_REFRESH_TOKEN gerekli"
    );
  }
  return { developerToken, clientId, clientSecret, refreshToken };
}

function makeContext(customerIdRaw: string, managerIdRaw?: string | null): GoogleAdsContext {
  const customerId = normalizeCustomerId(customerIdRaw);
  if (!customerId) throw new Error("Google Ads musteri ID gecersiz");
  const managerId = managerIdRaw?.trim() ? normalizeCustomerId(managerIdRaw) : undefined;
  return { customerId, managerId };
}

async function fetchAccessToken() {
  const { clientId, clientSecret, refreshToken } = assertCredentials();
  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    throw new Error(
      typeof json.error_description === "string"
        ? json.error_description
        : `Google OAuth token hatasi: ${res.status}`
    );
  }
  const accessToken = json.access_token;
  if (typeof accessToken !== "string" || !accessToken) {
    throw new Error("Google OAuth access token alinamadi");
  }
  return accessToken;
}

async function googleAdsRequest<T>(
  ctx: GoogleAdsContext,
  path: string,
  body: Record<string, unknown>
): Promise<T> {
  const { developerToken } = assertCredentials();
  const accessToken = await fetchAccessToken();
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
    "developer-token": developerToken,
  };
  if (ctx.managerId) headers["login-customer-id"] = ctx.managerId;

  const res = await fetch(`https://googleads.googleapis.com/${apiVersion()}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const details = JSON.stringify(json);
    throw new Error(`Google Ads API hatasi (${res.status}): ${details}`);
  }
  return json as T;
}

async function searchGoogleAds(ctx: GoogleAdsContext, query: string): Promise<GoogleAdsRow[]> {
  const payload = await googleAdsRequest<unknown>(
    ctx,
    `/customers/${ctx.customerId}/googleAds:searchStream`,
    { query }
  );
  const chunks = Array.isArray(payload) ? payload : [payload];
  return chunks.flatMap((chunk) => {
    if (!chunk || typeof chunk !== "object") return [];
    const results = (chunk as { results?: unknown }).results;
    return Array.isArray(results) ? (results as GoogleAdsRow[]) : [];
  });
}

export async function mutateGoogleAds(
  customerIdRaw: string,
  managerIdRaw: string | null | undefined,
  operations: GoogleAdsOperation[],
  validateOnly: boolean
) {
  const ctx = makeContext(customerIdRaw, managerIdRaw);
  return googleAdsRequest<Record<string, unknown>>(
    ctx,
    `/customers/${ctx.customerId}/googleAds:mutate`,
    {
      mutateOperations: operations,
      validateOnly,
      partialFailure: false,
      responseContentType: "RESOURCE_NAME_ONLY",
    }
  );
}

function readNestedString(row: GoogleAdsRow, key: string, nestedKey: string) {
  const obj = row[key] as Record<string, unknown> | undefined;
  const value = obj?.[nestedKey];
  return value == null ? null : String(value);
}

function readNestedNumber(row: GoogleAdsRow, key: string, nestedKey: string) {
  const raw = readNestedString(row, key, nestedKey);
  if (raw == null) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export async function fetchGoogleAdsCampaigns(customerIdRaw: string, managerIdRaw?: string | null) {
  const ctx = makeContext(customerIdRaw, managerIdRaw);
  const rows = await searchGoogleAds(
    ctx,
    `
      SELECT
        campaign.resource_name,
        campaign.id,
        campaign.name,
        campaign.status,
        campaign.advertising_channel_type,
        campaign.optimization_score,
        campaign_budget.resource_name,
        campaign_budget.name,
        campaign_budget.amount_micros,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions,
        metrics.conversions_value
      FROM campaign
      WHERE campaign.status != 'REMOVED'
        AND segments.date DURING LAST_30_DAYS
      ORDER BY metrics.cost_micros DESC
      LIMIT 50
    `
  );

  return rows.map((r) => ({
    id: readNestedString(r, "campaign", "id"),
    resourceName: readNestedString(r, "campaign", "resourceName"),
    name: readNestedString(r, "campaign", "name"),
    status: readNestedString(r, "campaign", "status"),
    channelType: readNestedString(r, "campaign", "advertisingChannelType"),
    optimizationScore: readNestedNumber(r, "campaign", "optimizationScore"),
    budget: {
      resourceName: readNestedString(r, "campaignBudget", "resourceName"),
      name: readNestedString(r, "campaignBudget", "name"),
      amountMicros: readNestedNumber(r, "campaignBudget", "amountMicros"),
    },
    metrics: {
      impressions: readNestedNumber(r, "metrics", "impressions"),
      clicks: readNestedNumber(r, "metrics", "clicks"),
      costMicros: readNestedNumber(r, "metrics", "costMicros"),
      conversions: readNestedNumber(r, "metrics", "conversions"),
      conversionsValue: readNestedNumber(r, "metrics", "conversionsValue"),
    },
  }));
}

export async function fetchGoogleAdsRecommendations(customerIdRaw: string, managerIdRaw?: string | null) {
  const ctx = makeContext(customerIdRaw, managerIdRaw);
  const rows = await searchGoogleAds(
    ctx,
    `
      SELECT
        recommendation.resource_name,
        recommendation.type,
        recommendation.campaign,
        recommendation.dismissed,
        recommendation.impact.base_metrics.impressions,
        recommendation.impact.base_metrics.clicks,
        recommendation.impact.base_metrics.cost_micros,
        recommendation.impact.potential_metrics.impressions,
        recommendation.impact.potential_metrics.clicks,
        recommendation.impact.potential_metrics.cost_micros
      FROM recommendation
      LIMIT 50
    `
  );

  return rows.map((r) => ({
    resourceName: readNestedString(r, "recommendation", "resourceName"),
    type: readNestedString(r, "recommendation", "type"),
    campaign: readNestedString(r, "recommendation", "campaign"),
    dismissed: (r.recommendation as Record<string, unknown> | undefined)?.dismissed ?? null,
    impact: (r.recommendation as Record<string, unknown> | undefined)?.impact ?? null,
  }));
}

async function fetchAssetGroups(ctx: GoogleAdsContext, campaignId: string) {
  const rows = await searchGoogleAds(
    ctx,
    `
      SELECT
        campaign.id,
        campaign.name,
        asset_group.resource_name,
        asset_group.id,
        asset_group.name,
        asset_group.status,
        asset_group.ad_strength,
        asset_group.primary_status,
        asset_group.primary_status_reasons,
        asset_group.final_urls
      FROM asset_group
      WHERE campaign.id = ${campaignId}
      LIMIT 50
    `
  );
  return rows.map((r) => ({
    id: readNestedString(r, "assetGroup", "id"),
    resourceName: readNestedString(r, "assetGroup", "resourceName"),
    name: readNestedString(r, "assetGroup", "name"),
    status: readNestedString(r, "assetGroup", "status"),
    adStrength: readNestedString(r, "assetGroup", "adStrength"),
    primaryStatus: readNestedString(r, "assetGroup", "primaryStatus"),
    primaryStatusReasons:
      (r.assetGroup as Record<string, unknown> | undefined)?.primaryStatusReasons ?? [],
    finalUrls: (r.assetGroup as Record<string, unknown> | undefined)?.finalUrls ?? [],
  }));
}

async function fetchAssetGroupAssets(ctx: GoogleAdsContext, assetGroupId: string) {
  const rows = await searchGoogleAds(
    ctx,
    `
      SELECT
        asset_group_asset.asset_group,
        asset_group_asset.field_type,
        asset_group_asset.status,
        asset_group_asset.primary_status,
        asset_group_asset.primary_status_reasons,
        asset_group_asset.performance_label,
        asset.resource_name,
        asset.id,
        asset.name,
        asset.type,
        asset.text_asset.text
      FROM asset_group_asset
      WHERE asset_group.id = ${assetGroupId}
      LIMIT 200
    `
  );
  return rows.map((r) => ({
    assetGroup: readNestedString(r, "assetGroupAsset", "assetGroup"),
    fieldType: readNestedString(r, "assetGroupAsset", "fieldType"),
    status: readNestedString(r, "assetGroupAsset", "status"),
    primaryStatus: readNestedString(r, "assetGroupAsset", "primaryStatus"),
    primaryStatusReasons:
      (r.assetGroupAsset as Record<string, unknown> | undefined)?.primaryStatusReasons ?? [],
    performanceLabel: readNestedString(r, "assetGroupAsset", "performanceLabel"),
    asset: {
      resourceName: readNestedString(r, "asset", "resourceName"),
      id: readNestedString(r, "asset", "id"),
      name: readNestedString(r, "asset", "name"),
      type: readNestedString(r, "asset", "type"),
      text: ((r.asset as Record<string, unknown> | undefined)?.textAsset as
        | Record<string, unknown>
        | undefined)?.text,
    },
  }));
}

function countByFieldType(assets: Array<{ fieldType: string | null }>) {
  const counts: Record<string, number> = {};
  for (const asset of assets) {
    if (!asset.fieldType) continue;
    counts[asset.fieldType] = (counts[asset.fieldType] ?? 0) + 1;
  }
  return counts;
}

function buildAssetGroupFindings(assetGroup: Record<string, unknown>, counts: Record<string, number>) {
  const issues: string[] = [];
  const recommendations: string[] = [];
  const adStrength = String(assetGroup.adStrength ?? "");

  if (!adStrength || ["NO_ADS", "POOR", "PENDING"].includes(adStrength)) {
    issues.push(`Reklam gucu dusuk veya hazir degil: ${adStrength || "BILINMIYOR"}`);
  }
  if ((counts.HEADLINE ?? 0) < 3) issues.push("Minimum 3 kisa baslik eksik");
  if ((counts.HEADLINE ?? 0) < 11) recommendations.push("11+ kisa baslik hedefleyin");
  if ((counts.LONG_HEADLINE ?? 0) < 1) issues.push("Minimum 1 uzun baslik eksik");
  if ((counts.LONG_HEADLINE ?? 0) < 2) recommendations.push("2+ uzun baslik ekleyin");
  if ((counts.DESCRIPTION ?? 0) < 2) issues.push("Minimum 2 aciklama eksik");
  if ((counts.DESCRIPTION ?? 0) < 4) recommendations.push("4+ aciklama ekleyin");
  if ((counts.MARKETING_IMAGE ?? 0) < 1) issues.push("Yatay pazarlama gorseli eksik");
  if ((counts.SQUARE_MARKETING_IMAGE ?? 0) < 1) issues.push("Kare pazarlama gorseli eksik");
  if ((counts.LOGO ?? 0) < 1) recommendations.push("1:1 logo varligini dogrulayin");

  return { issues, recommendations };
}

export async function fetchGoogleAdsAudit(customerIdRaw: string, managerIdRaw?: string | null) {
  const ctx = makeContext(customerIdRaw, managerIdRaw);
  const campaigns = await fetchGoogleAdsCampaigns(customerIdRaw, managerIdRaw);
  const auditedCampaigns: Array<Record<string, unknown>> = [];

  for (const campaign of campaigns) {
    const campaignId = campaign.id;
    const isPerformanceMax = campaign.channelType === "PERFORMANCE_MAX";
    if (!campaignId || !isPerformanceMax) {
      auditedCampaigns.push({ ...campaign, assetGroups: [], audit: { issues: [], recommendations: [] } });
      continue;
    }

    try {
      const assetGroups = await fetchAssetGroups(ctx, campaignId);
      const enrichedAssetGroups: Array<Record<string, unknown> & { audit: { issues: string[]; recommendations: string[] } }> = [];
      for (const assetGroup of assetGroups) {
        const assetGroupId = String(assetGroup.id ?? "");
        const assets = assetGroupId ? await fetchAssetGroupAssets(ctx, assetGroupId) : [];
        const counts = countByFieldType(assets);
        const findings = buildAssetGroupFindings(assetGroup, counts);
        enrichedAssetGroups.push({ ...assetGroup, assets, counts, audit: findings });
      }
      auditedCampaigns.push({
        ...campaign,
        assetGroups: enrichedAssetGroups,
        audit: {
          issues: enrichedAssetGroups.flatMap((g) => g.audit.issues),
          recommendations: enrichedAssetGroups.flatMap((g) => g.audit.recommendations),
        },
      });
    } catch (err) {
      auditedCampaigns.push({
        ...campaign,
        assetGroups: [],
        audit: { issues: [`Asset group okunamadi: ${(err as Error).message}`], recommendations: [] },
      });
    }
  }

  return {
    fetchedAt: new Date().toISOString(),
    customerId: ctx.customerId,
    campaigns: auditedCampaigns,
  };
}

function clip(text: string, max: number) {
  return text.length <= max ? text : text.slice(0, max).trim();
}

function unique(values: string[]) {
  return Array.from(new Set(values.map((v) => v.trim()).filter(Boolean)));
}

function buildTextAssetOperations(
  customerId: string,
  assetGroupResourceName: string,
  textAssets: NonNullable<GoogleAdsChangeSetPayload["textAssets"]>
) {
  let tempId = -1;
  const operations: GoogleAdsOperation[] = [];
  const addTextAsset = (fieldType: string, text: string) => {
    const resourceName = `customers/${customerId}/assets/${tempId--}`;
    operations.push({
      assetOperation: {
        create: {
          resourceName,
          textAsset: { text },
        },
      },
    });
    operations.push({
      assetGroupAssetOperation: {
        create: {
          assetGroup: assetGroupResourceName,
          asset: resourceName,
          fieldType,
        },
      },
    });
  };

  for (const text of textAssets.headlines ?? []) addTextAsset("HEADLINE", clip(text, 30));
  for (const text of textAssets.longHeadlines ?? []) addTextAsset("LONG_HEADLINE", clip(text, 90));
  for (const text of textAssets.descriptions ?? []) addTextAsset("DESCRIPTION", clip(text, 90));
  if (textAssets.businessName) addTextAsset("BUSINESS_NAME", clip(textAssets.businessName, 25));

  return operations;
}

export function buildVistaSeedsPmaxPlan(input: {
  customerId: string;
  campaignResourceName?: string | null;
  campaignName?: string | null;
  assetGroupResourceName?: string | null;
}) {
  const textAssets = {
    headlines: unique([
      "Vista Seeds",
      "Sebze Tohumları",
      "Biber Tohumu",
      "Domates Tohumu",
      "Üreticiye Güven",
      "Yüksek Çimlenme",
      "Kaliteli Sebze Tohumu",
      "Antalya'dan Tohum",
      "Yeni Sezon Tohumları",
      "Tarımda Güçlü Başlangıç",
      "Profesyonel Tohum",
    ]).map((v) => clip(v, 30)),
    longHeadlines: unique([
      "Vista Seeds ile sebze üretiminde güçlü ve verimli bir başlangıç yapın",
      "Profesyonel üreticiler için seçilmiş sebze tohumu çözümleri",
      "Biber ve sebze tohumu ihtiyaçlarınız için Vista Seeds yanınızda",
    ]).map((v) => clip(v, 90)),
    descriptions: unique([
      "Biber ve sebze tohumu çeşitlerini güvenilir Vista Seeds deneyimiyle keşfedin.",
      "Antalya merkezli hizmet, üretici odaklı destek ve kaliteli tohum seçenekleri.",
      "Yeni sezon sebze tohumu ihtiyaçlarınız için Vista Seeds ile iletişime geçin.",
      "Bahçeniz ve üretiminiz için uygun tohum seçeneklerini hemen inceleyin.",
    ]).map((v) => clip(v, 90)),
    businessName: "Vista Seeds",
  };

  const imageChecklist = [
    "4+ yatay urun/sera/tarla gorseli: onerilen 1200x628, minimum 600x314",
    "4+ kare ozgun gorsel: onerilen 1200x1200, minimum 300x300",
    "2+ dikey gorsel: onerilen 960x1200, minimum 480x600",
    "1 adet 1:1 logo ve mumkunse 1 adet 4:1 yatay logo",
    "Stok gorsel, agir metin bindirme ve tekrar eden gorsellerden kacin",
  ];

  const payload: GoogleAdsChangeSetPayload = {
    kind: "performance_max_text_asset_plan",
    campaignResourceName: input.campaignResourceName ?? undefined,
    assetGroupResourceName: input.assetGroupResourceName ?? undefined,
    notes:
      "VistaSeeds Performance Max kampanyasinda reklam gucunu artirmak ve 'yetersiz orijinal icerik' riskini azaltmak icin metin + gorsel plan.",
    textAssets,
    imageChecklist,
    manualSteps: [
      "Landing page icerigini kampanya vaadiyle eslestir",
      "Ozgun VistaSeeds urun, sera ve ambalaj gorsellerini yukle",
      "Politika incelemesi tamamlanana kadar kampanya durumunu takip et",
    ],
  };

  if (input.assetGroupResourceName) {
    payload.operations = buildTextAssetOperations(
      normalizeCustomerId(input.customerId),
      input.assetGroupResourceName,
      textAssets
    );
  }

  return {
    title: `VistaSeeds PMax asset düzeltme planı${input.campaignName ? ` — ${input.campaignName}` : ""}`,
    payload,
  };
}

export function validateChangeSetPayload(payload: GoogleAdsChangeSetPayload) {
  const errors: string[] = [];
  if (!payload.kind) errors.push("payload.kind zorunlu");
  if (payload.kind === "performance_max_text_asset_plan") {
    if (!payload.assetGroupResourceName) {
      errors.push("Metin asset operasyonlari icin assetGroupResourceName zorunlu");
    }
    if (!payload.operations?.length) {
      errors.push("Uygulanabilir Google Ads operasyonu bulunamadi");
    }
  }
  return { ok: errors.length === 0, errors };
}

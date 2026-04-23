import type { FastifyInstance } from "fastify";
import { randomUUID } from "crypto";
import { db } from "../../db/client";
import { googleAdsChangeSets, socialProjects } from "../../db/schema";
import { desc, eq } from "drizzle-orm";
import { fetchGscSearchAnalytics } from "./gsc";
import { fetchRemoteSiteSettingsJson } from "./site-fetch";
import { fetchGa4Summary } from "./ga4";
import {
  buildVistaSeedsPmaxPlan,
  fetchGoogleAdsAudit,
  fetchGoogleAdsCampaigns,
  fetchGoogleAdsRecommendations,
  mutateGoogleAds,
  type GoogleAdsChangeSetPayload,
  validateChangeSetPayload,
} from "./google-ads-read";
import { fetchDataForSeoDomainSummary } from "./dataforseo";
import { hostnameFromWebsiteUrl } from "./domain";
import type { MarketingJsonShape } from "./types";
import { normalizeBranding } from "../tenants/service";

function mergeMarketingJson(
  prev: MarketingJsonShape | null | undefined,
  patch: MarketingJsonShape
): MarketingJsonShape {
  const base = { ...(prev ?? {}) };
  for (const [k, v] of Object.entries(patch)) {
    if (v === undefined) continue;
    (base as Record<string, unknown>)[k] = v;
  }
  return base;
}

function tenantKeyFrom(raw: unknown): string {
  const v = typeof raw === "string" ? raw.trim() : "";
  if (!v) throw new Error("tenantKey zorunlu");
  return v;
}

async function getProject(tenantKey: string) {
  const [row] = await db.select().from(socialProjects).where(eq(socialProjects.key, tenantKey)).limit(1);
  return row ?? null;
}

export async function marketingRoutes(app: FastifyInstance) {
  app.get("/settings", async (req, reply) => {
    const tenantKey = tenantKeyFrom((req.query as { tenantKey?: string })?.tenantKey);
    const row = await getProject(tenantKey);
    if (!row) return reply.status(404).send({ error: "Tenant bulunamadi" });
    return reply.send({
      tenantKey: row.key,
      name: row.name,
      websiteUrl: row.websiteUrl,
      gtmContainerId: row.gtmContainerId,
      ga4MeasurementId: row.ga4MeasurementId,
      ga4PropertyId: row.ga4PropertyId,
      googleAdsCustomerId: row.googleAdsCustomerId,
      googleAdsManagerId: row.googleAdsManagerId,
      searchConsoleSiteUrl: row.searchConsoleSiteUrl,
      siteSettingsApiUrl: row.siteSettingsApiUrl,
      marketingJson: (row.marketingJson as MarketingJsonShape | null) ?? {},
      branding: normalizeBranding((row.marketingJson as MarketingJsonShape | null)?.branding, {
        name: row.name,
        websiteUrl: row.websiteUrl,
      }),
    });
  });

  app.patch("/settings", async (req, reply) => {
    const body = req.body as {
      tenantKey?: string;
      gtmContainerId?: string | null;
      ga4MeasurementId?: string | null;
      ga4PropertyId?: string | null;
      googleAdsCustomerId?: string | null;
      googleAdsManagerId?: string | null;
      searchConsoleSiteUrl?: string | null;
      siteSettingsApiUrl?: string | null;
      marketingJson?: MarketingJsonShape | null;
    };
    const tenantKey = tenantKeyFrom(body.tenantKey);
    const row = await getProject(tenantKey);
    if (!row) return reply.status(404).send({ error: "Tenant bulunamadi" });

    const nextJson =
      body.marketingJson !== undefined
        ? mergeMarketingJson((row.marketingJson as MarketingJsonShape | null) ?? {}, body.marketingJson ?? {})
        : undefined;

    await db
      .update(socialProjects)
      .set({
        gtmContainerId: body.gtmContainerId !== undefined ? body.gtmContainerId : row.gtmContainerId,
        ga4MeasurementId: body.ga4MeasurementId !== undefined ? body.ga4MeasurementId : row.ga4MeasurementId,
        ga4PropertyId: body.ga4PropertyId !== undefined ? body.ga4PropertyId : row.ga4PropertyId,
        googleAdsCustomerId:
          body.googleAdsCustomerId !== undefined ? body.googleAdsCustomerId : row.googleAdsCustomerId,
        googleAdsManagerId:
          body.googleAdsManagerId !== undefined ? body.googleAdsManagerId : row.googleAdsManagerId,
        searchConsoleSiteUrl:
          body.searchConsoleSiteUrl !== undefined ? body.searchConsoleSiteUrl : row.searchConsoleSiteUrl,
        siteSettingsApiUrl:
          body.siteSettingsApiUrl !== undefined ? body.siteSettingsApiUrl : row.siteSettingsApiUrl,
        ...(nextJson !== undefined ? { marketingJson: nextJson } : {}),
      })
      .where(eq(socialProjects.id, row.id));

    return reply.send({ ok: true });
  });

  app.get("/site-settings-fetch", async (req, reply) => {
    const tenantKey = tenantKeyFrom((req.query as { tenantKey?: string })?.tenantKey);
    const row = await getProject(tenantKey);
    if (!row) return reply.status(404).send({ error: "Tenant bulunamadi" });
    const url = row.siteSettingsApiUrl?.trim();
    if (!url) return reply.status(400).send({ error: "siteSettingsApiUrl bos" });
    try {
      const remote = await fetchRemoteSiteSettingsJson(url);
      return reply.send({ ok: true, remote });
    } catch (err) {
      return reply.status(400).send({ error: (err as Error).message });
    }
  });

  app.get("/discover-ids", async (req, reply) => {
    const tenantKey = tenantKeyFrom((req.query as { tenantKey?: string })?.tenantKey);
    const row = await getProject(tenantKey);
    if (!row) return reply.status(404).send({ error: "Tenant bulunamadi" });
    if (!row.websiteUrl) return reply.status(400).send({ error: "websiteUrl tanimli degil" });
    try {
      const { discoverTrackingIds } = await import("./site-fetch");
      const data = await discoverTrackingIds(row.websiteUrl);
      return reply.send({ ok: true, ...data });
    } catch (err) {
      return reply.status(400).send({ error: (err as Error).message });
    }
  });

  app.get("/gsc-summary", async (req, reply) => {
    const tenantKey = tenantKeyFrom((req.query as { tenantKey?: string })?.tenantKey);
    const row = await getProject(tenantKey);
    if (!row) return reply.status(404).send({ error: "Tenant bulunamadi" });
    const siteUrl = row.searchConsoleSiteUrl?.trim();
    if (!siteUrl) {
      return reply.send({
        configured: false,
        message: "Search Console site URL tanimli degil",
      });
    }
    try {
      const data = await fetchGscSearchAnalytics(siteUrl);
      return reply.send({ configured: true, siteUrl, ...data });
    } catch (err) {
      return reply.send({
        configured: true,
        siteUrl,
        error: (err as Error).message,
      });
    }
  });

  app.get("/backlinks", async (req, reply) => {
    const tenantKey = tenantKeyFrom((req.query as { tenantKey?: string })?.tenantKey);
    const row = await getProject(tenantKey);
    if (!row) return reply.status(404).send({ error: "Tenant bulunamadi" });
    const mj = (row.marketingJson as MarketingJsonShape | null) ?? {};
    return reply.send({
      tenantKey,
      backlinks: mj.backlinks ?? { rows: [] },
      backlinksEnriched: mj.backlinksEnriched ?? null,
      hint:
        "GSC tam dis baglanti listesi vermez. DataForSEO (DATAFORSEO_LOGIN/PASSWORD) ile domain ozeti cekilebilir; manuel satirlar marketingJson.backlinks ile saklanir.",
      searchConsoleSiteUrl: row.searchConsoleSiteUrl,
    });
  });

  app.post("/backlinks/sync", async (req, reply) => {
    const { tenantKey } = req.body as { tenantKey?: string };
    const tk = tenantKeyFrom(tenantKey);
    const row = await getProject(tk);
    if (!row) return reply.status(404).send({ error: "Tenant bulunamadi" });
    const host = hostnameFromWebsiteUrl(row.websiteUrl ?? "");
    if (!host) {
      return reply.status(400).send({ error: "websiteUrl uzerinden domain cikarilamadi" });
    }
    try {
      const data = await fetchDataForSeoDomainSummary(host);
      const mj = mergeMarketingJson((row.marketingJson as MarketingJsonShape | null) ?? {}, {
        backlinksEnriched: {
          provider: "dataforseo",
          fetchedAt: new Date().toISOString(),
          data,
        },
      });
      await db.update(socialProjects).set({ marketingJson: mj }).where(eq(socialProjects.id, row.id));
      return reply.send({ ok: true, domain: host, summary: data });
    } catch (err) {
      return reply.status(400).send({ error: (err as Error).message });
    }
  });

  app.get("/ga4-summary", async (req, reply) => {
    const tenantKey = tenantKeyFrom((req.query as { tenantKey?: string })?.tenantKey);
    const row = await getProject(tenantKey);
    if (!row) return reply.status(404).send({ error: "Tenant bulunamadi" });
    const pid = row.ga4PropertyId?.trim();
    if (!pid) {
      return reply.send({
        configured: false,
        message: "GA4 mulk ID (sayisal) tanimli degil — Analytics Data API icin Admin > Mulk Ayarlari",
      });
    }
    try {
      const data = await fetchGa4Summary(pid);
      return reply.send({ configured: true, ...data });
    } catch (err) {
      return reply.send({
        configured: true,
        error: (err as Error).message,
      });
    }
  });

  app.get("/google-ads-campaigns", async (req, reply) => {
    const tenantKey = tenantKeyFrom((req.query as { tenantKey?: string })?.tenantKey);
    const row = await getProject(tenantKey);
    if (!row) return reply.status(404).send({ error: "Tenant bulunamadi" });
    const cid = row.googleAdsCustomerId?.trim();
    if (!cid) {
      return reply.send({
        configured: false,
        message: "Google Ads musteri ID tanimli degil",
      });
    }
    try {
      const campaigns = await fetchGoogleAdsCampaigns(cid, row.googleAdsManagerId);
      return reply.send({ configured: true, customerId: cid, campaigns });
    } catch (err) {
      return reply.send({
        configured: true,
        customerId: cid,
        error: (err as Error).message,
      });
    }
  });

  app.get("/google-ads/audit", async (req, reply) => {
    const tenantKey = tenantKeyFrom((req.query as { tenantKey?: string })?.tenantKey);
    const row = await getProject(tenantKey);
    if (!row) return reply.status(404).send({ error: "Tenant bulunamadi" });
    const cid = row.googleAdsCustomerId?.trim();
    if (!cid) {
      return reply.send({
        configured: false,
        message: "Google Ads musteri ID tanimli degil",
      });
    }
    try {
      const audit = await fetchGoogleAdsAudit(cid, row.googleAdsManagerId);
      return reply.send({ configured: true, tenantKey, ...audit });
    } catch (err) {
      return reply.send({
        configured: true,
        tenantKey,
        customerId: cid,
        error: (err as Error).message,
      });
    }
  });

  app.get("/google-ads/recommendations", async (req, reply) => {
    const tenantKey = tenantKeyFrom((req.query as { tenantKey?: string })?.tenantKey);
    const row = await getProject(tenantKey);
    if (!row) return reply.status(404).send({ error: "Tenant bulunamadi" });
    const cid = row.googleAdsCustomerId?.trim();
    if (!cid) {
      return reply.send({
        configured: false,
        message: "Google Ads musteri ID tanimli degil",
      });
    }
    try {
      const recommendations = await fetchGoogleAdsRecommendations(cid, row.googleAdsManagerId);
      return reply.send({ configured: true, tenantKey, customerId: cid, recommendations });
    } catch (err) {
      return reply.send({
        configured: true,
        tenantKey,
        customerId: cid,
        error: (err as Error).message,
      });
    }
  });

  app.get("/google-ads/change-sets", async (req, reply) => {
    const tenantKey = tenantKeyFrom((req.query as { tenantKey?: string })?.tenantKey);
    const items = await db
      .select()
      .from(googleAdsChangeSets)
      .where(eq(googleAdsChangeSets.tenantKey, tenantKey))
      .orderBy(desc(googleAdsChangeSets.createdAt))
      .limit(50);
    return reply.send({ items });
  });

  app.post("/google-ads/change-sets", async (req, reply) => {
    const body = req.body as {
      tenantKey?: string;
      title?: string;
      campaignId?: string | null;
      campaignName?: string | null;
      payload?: GoogleAdsChangeSetPayload;
      source?: string;
      createdBy?: string;
    };
    const tenantKey = tenantKeyFrom(body.tenantKey);
    const row = await getProject(tenantKey);
    if (!row) return reply.status(404).send({ error: "Tenant bulunamadi" });
    const cid = row.googleAdsCustomerId?.trim();
    if (!cid) return reply.status(400).send({ error: "Google Ads musteri ID tanimli degil" });
    if (!body.payload) return reply.status(400).send({ error: "payload zorunlu" });

    const uuid = randomUUID();
    await db.insert(googleAdsChangeSets).values({
      uuid,
      tenantKey,
      customerId: cid,
      managerId: row.googleAdsManagerId,
      campaignId: body.campaignId ?? null,
      campaignName: body.campaignName ?? null,
      title: body.title?.trim() || "Google Ads degisiklik taslagi",
      source: body.source?.trim() || "manual",
      payload: body.payload,
      createdBy: body.createdBy?.trim() || "system",
    });
    const [created] = await db
      .select()
      .from(googleAdsChangeSets)
      .where(eq(googleAdsChangeSets.uuid, uuid))
      .limit(1);
    return reply.send({ ok: true, item: created });
  });

  app.post("/google-ads/vistaseeds-plan", async (req, reply) => {
    const body = req.body as {
      tenantKey?: string;
      campaignId?: string | null;
      assetGroupResourceName?: string | null;
      createdBy?: string;
    };
    const tenantKey = tenantKeyFrom(body.tenantKey);
    const row = await getProject(tenantKey);
    if (!row) return reply.status(404).send({ error: "Tenant bulunamadi" });
    const cid = row.googleAdsCustomerId?.trim();
    if (!cid) return reply.status(400).send({ error: "Google Ads musteri ID tanimli degil" });

    let campaignId = body.campaignId?.trim() || "";
    let campaignName: string | null = null;
    let campaignResourceName: string | null = null;
    let assetGroupResourceName = body.assetGroupResourceName?.trim() || "";

    try {
      const audit = await fetchGoogleAdsAudit(cid, row.googleAdsManagerId);
      const candidates = audit.campaigns as Array<Record<string, unknown>>;
      const selected =
        candidates.find((c) => campaignId && String(c.id) === campaignId) ??
        candidates.find((c) => String(c.name ?? "").toLowerCase().includes("vista")) ??
        candidates.find((c) => c.channelType === "PERFORMANCE_MAX") ??
        candidates[0];

      if (selected) {
        campaignId = String(selected.id ?? campaignId);
        campaignName = selected.name ? String(selected.name) : null;
        campaignResourceName = selected.resourceName ? String(selected.resourceName) : null;
        const assetGroups = Array.isArray(selected.assetGroups) ? selected.assetGroups : [];
        const firstAssetGroup = assetGroups[0] as Record<string, unknown> | undefined;
        assetGroupResourceName ||= firstAssetGroup?.resourceName ? String(firstAssetGroup.resourceName) : "";
      }
    } catch {
      // Plan yine de olusturulabilir; yalnizca API operasyonlari asset group olmadan pasif kalir.
    }

    const plan = buildVistaSeedsPmaxPlan({
      customerId: cid,
      campaignResourceName,
      campaignName,
      assetGroupResourceName: assetGroupResourceName || null,
    });
    const uuid = randomUUID();
    await db.insert(googleAdsChangeSets).values({
      uuid,
      tenantKey,
      customerId: cid,
      managerId: row.googleAdsManagerId,
      campaignId: campaignId || null,
      campaignName,
      title: plan.title,
      source: "vistaseeds_pmax_audit",
      payload: plan.payload,
      createdBy: body.createdBy?.trim() || "system",
    });
    const [created] = await db
      .select()
      .from(googleAdsChangeSets)
      .where(eq(googleAdsChangeSets.uuid, uuid))
      .limit(1);
    return reply.send({ ok: true, item: created });
  });

  app.post("/google-ads/change-sets/:uuid/validate", async (req, reply) => {
    const { uuid } = req.params as { uuid: string };
    const [item] = await db
      .select()
      .from(googleAdsChangeSets)
      .where(eq(googleAdsChangeSets.uuid, uuid))
      .limit(1);
    if (!item) return reply.status(404).send({ error: "Degisiklik taslagi bulunamadi" });

    const payload = item.payload as GoogleAdsChangeSetPayload;
    const local = validateChangeSetPayload(payload);
    if (!local.ok) {
      await db
        .update(googleAdsChangeSets)
        .set({ status: "validation_failed", validationResult: local })
        .where(eq(googleAdsChangeSets.id, item.id));
      return reply.status(400).send({ ok: false, validation: local });
    }

    try {
      const result = await mutateGoogleAds(
        item.customerId,
        item.managerId,
        payload.operations ?? [],
        true
      );
      await db
        .update(googleAdsChangeSets)
        .set({ status: "validated", validationResult: { ok: true, result } })
        .where(eq(googleAdsChangeSets.id, item.id));
      return reply.send({ ok: true, result });
    } catch (err) {
      const result = { ok: false, error: (err as Error).message };
      await db
        .update(googleAdsChangeSets)
        .set({ status: "validation_failed", validationResult: result })
        .where(eq(googleAdsChangeSets.id, item.id));
      return reply.status(400).send(result);
    }
  });

  app.post("/google-ads/change-sets/:uuid/apply", async (req, reply) => {
    const { uuid } = req.params as { uuid: string };
    const body = req.body as { confirmApply?: boolean };
    if (body.confirmApply !== true) {
      return reply.status(400).send({ error: "Canli Google Ads degisikligi icin confirmApply=true zorunlu" });
    }
    const [item] = await db
      .select()
      .from(googleAdsChangeSets)
      .where(eq(googleAdsChangeSets.uuid, uuid))
      .limit(1);
    if (!item) return reply.status(404).send({ error: "Degisiklik taslagi bulunamadi" });
    if (item.status !== "validated") {
      return reply.status(400).send({ error: "Once validate endpoint'i ile taslagi dogrulayin" });
    }

    const payload = item.payload as GoogleAdsChangeSetPayload;
    try {
      const result = await mutateGoogleAds(
        item.customerId,
        item.managerId,
        payload.operations ?? [],
        false
      );
      await db
        .update(googleAdsChangeSets)
        .set({ status: "applied", appliedResult: { ok: true, result } })
        .where(eq(googleAdsChangeSets.id, item.id));
      return reply.send({ ok: true, result });
    } catch (err) {
      const result = { ok: false, error: (err as Error).message };
      await db
        .update(googleAdsChangeSets)
        .set({ status: "failed", appliedResult: result })
        .where(eq(googleAdsChangeSets.id, item.id));
      return reply.status(400).send(result);
    }
  });

  app.get("/google-ads-links", async (req, reply) => {
    const tenantKey = tenantKeyFrom((req.query as { tenantKey?: string })?.tenantKey);
    const row = await getProject(tenantKey);
    if (!row) return reply.status(404).send({ error: "Tenant bulunamadi" });
    const uiBase = "https://ads.google.com/aw";
    const links = {
      overview: `${uiBase}/overview`,
      campaigns: `${uiBase}/campaigns`,
      googleAdsHome: "https://ads.google.com/",
    };
    const sc = row.searchConsoleSiteUrl?.trim();
    return reply.send({
      tenantKey,
      customerId: row.googleAdsCustomerId,
      managerId: row.googleAdsManagerId,
      links,
      searchConsoleUiUrl: sc
        ? `https://search.google.com/search-console?resource_id=${encodeURIComponent(sc)}`
        : "https://search.google.com/search-console",
      note:
        "Kampanya API icin Google Ads developer token + OAuth gerekir. Musteri ID panelde referans; arayuze genel baglantilar.",
    });
  });
}

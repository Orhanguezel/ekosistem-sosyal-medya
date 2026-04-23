import { db } from "@/db/client";
import { socialProjects } from "@/db/schema";
import { and, asc, eq } from "drizzle-orm";

export interface TenantBranding {
  appName?: string;
  appSubtitle?: string;
  loginTitle?: string;
  loginSubtitle?: string;
  logoUrl?: string;
  faviconUrl?: string;
  faviconIcoUrl?: string;
  primaryColor?: string;
  accentColor?: string;
  defaultLinkUrl?: string;
  defaultHashtags?: string;
  sector?: string;
  audience?: string;
  contentSourceLabel?: string;
}

export interface TenantMarketingJson {
  branding?: TenantBranding;
  [key: string]: unknown;
}

function normalizeText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function mergeDefined<T extends object>(base: T, patch: Partial<T>): T {
  const next = { ...base } as T;
  for (const [key, value] of Object.entries(patch)) {
    if (value !== undefined) {
      (next as Record<string, unknown>)[key] = value;
    }
  }
  return next;
}

export function defaultTenantBranding(input: {
  name: string;
  websiteUrl?: string | null;
}): TenantBranding {
  return {
    appName: input.name,
    appSubtitle: "Sosyal medya yonetim paneli",
    loginTitle: input.name,
    loginSubtitle: "Coklu tenant sosyal medya yonetimi",
    defaultLinkUrl: normalizeText(input.websiteUrl) ?? undefined,
    defaultHashtags: "",
    sector: "genel",
    audience: "hedef kitleniz",
    contentSourceLabel: input.name,
  };
}

export function normalizeBranding(raw: unknown, fallback: { name: string; websiteUrl?: string | null }): TenantBranding {
  const source = (raw ?? {}) as Record<string, unknown>;
  const base = defaultTenantBranding(fallback);

  return mergeDefined(base, {
    appName: normalizeText(source.appName) ?? base.appName,
    appSubtitle: normalizeText(source.appSubtitle) ?? base.appSubtitle,
    loginTitle: normalizeText(source.loginTitle) ?? normalizeText(source.appName) ?? base.loginTitle,
    loginSubtitle: normalizeText(source.loginSubtitle) ?? base.loginSubtitle,
    logoUrl: normalizeText(source.logoUrl) ?? normalizeText(source.logoPath) ?? undefined,
    faviconUrl: normalizeText(source.faviconUrl) ?? normalizeText(source.faviconPath) ?? undefined,
    faviconIcoUrl: normalizeText(source.faviconIcoUrl) ?? normalizeText(source.faviconIcoPath) ?? undefined,
    primaryColor: normalizeText(source.primaryColor) ?? undefined,
    accentColor: normalizeText(source.accentColor) ?? undefined,
    defaultLinkUrl: normalizeText(source.defaultLinkUrl) ?? base.defaultLinkUrl,
    defaultHashtags: normalizeText(source.defaultHashtags) ?? base.defaultHashtags,
    sector: normalizeText(source.sector) ?? base.sector,
    audience: normalizeText(source.audience) ?? base.audience,
    contentSourceLabel: normalizeText(source.contentSourceLabel) ?? base.contentSourceLabel,
  });
}

export function getProjectMarketing(row: typeof socialProjects.$inferSelect): TenantMarketingJson {
  return ((row.marketingJson as TenantMarketingJson | null) ?? {}) as TenantMarketingJson;
}

export function serializeTenant(row: typeof socialProjects.$inferSelect) {
  const marketingJson = getProjectMarketing(row);
  const branding = normalizeBranding(marketingJson.branding, {
    name: row.name,
    websiteUrl: row.websiteUrl,
  });

  return {
    ...row,
    marketingJson,
    branding,
  };
}

export async function getTenantByKey(tenantKey: string) {
  const [row] = await db
    .select()
    .from(socialProjects)
    .where(and(eq(socialProjects.key, tenantKey), eq(socialProjects.isActive, 1)))
    .limit(1);

  return row ? serializeTenant(row) : null;
}

export async function listActiveTenants() {
  const rows = await db
    .select()
    .from(socialProjects)
    .where(eq(socialProjects.isActive, 1))
    .orderBy(asc(socialProjects.name));

  return rows.map(serializeTenant);
}

export async function updateTenantBranding(
  tenantKey: string,
  patch: Partial<TenantBranding>
) {
  const tenant = await getTenantByKey(tenantKey);
  if (!tenant) return null;

  const branding = normalizeBranding(
    mergeDefined(tenant.branding, patch),
    { name: tenant.name, websiteUrl: tenant.websiteUrl }
  );

  const marketingJson = mergeDefined(tenant.marketingJson, { branding });

  await db
    .update(socialProjects)
    .set({ marketingJson })
    .where(eq(socialProjects.id, tenant.id));

  return getTenantByKey(tenantKey);
}

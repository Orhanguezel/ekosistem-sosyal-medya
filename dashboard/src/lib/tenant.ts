import { API_ORIGIN } from "@/lib/api";

export const TENANT_STORAGE_KEY = "social-tenant-key";
const DEFAULT_TENANT_KEY = process.env.NEXT_PUBLIC_DEFAULT_TENANT_KEY?.trim() || "";

function getRequestedTenantKey(): string {
  if (typeof window === "undefined") return "";
  const params = new URLSearchParams(window.location.search);
  return (
    params.get("tenantKey") ||
    params.get("tenant") ||
    params.get("project") ||
    ""
  ).trim();
}

export function getStoredTenantKey(): string {
  if (typeof window === "undefined") return DEFAULT_TENANT_KEY;
  const requested = getRequestedTenantKey();
  if (requested) {
    localStorage.setItem(TENANT_STORAGE_KEY, requested);
    return requested;
  }
  return localStorage.getItem(TENANT_STORAGE_KEY) || DEFAULT_TENANT_KEY;
}

export function setStoredTenantKey(tenantKey: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(TENANT_STORAGE_KEY, tenantKey);
}

export function resolveTenantKey<T extends { key: string }>(
  items: T[],
  preferredTenantKey?: string
): string {
  const preferred = preferredTenantKey?.trim();
  if (preferred && items.some((item) => item.key === preferred)) {
    return preferred;
  }
  if (DEFAULT_TENANT_KEY && items.some((item) => item.key === DEFAULT_TENANT_KEY)) {
    return DEFAULT_TENANT_KEY;
  }
  return items[0]?.key || "";
}

export function resolveTenantAssetUrl(assetUrl?: string | null): string | null {
  if (!assetUrl) return null;
  if (/^https?:\/\//i.test(assetUrl)) return assetUrl;
  return assetUrl.startsWith("/") ? `${API_ORIGIN}${assetUrl}` : `${API_ORIGIN}/${assetUrl}`;
}

export function resolveStorageAssetUrl(assetId?: string | null): string | null {
  if (!assetId) return null;
  return `${API_ORIGIN}/api/v1/storage/asset/${encodeURIComponent(assetId)}`;
}

import { API_ORIGIN } from "@/lib/api";

export const TENANT_STORAGE_KEY = "social-tenant-key";

export function getStoredTenantKey(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(TENANT_STORAGE_KEY) || "";
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

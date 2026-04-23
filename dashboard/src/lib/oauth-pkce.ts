const STORAGE_X = "social_oauth_x_pkce";
const STORAGE_LI = "social_oauth_linkedin_tenant";

function randomBytesUrlSafe(length = 32): string {
  const a = new Uint8Array(length);
  crypto.getRandomValues(a);
  return btoa(String.fromCharCode(...a))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function sha256Base64Url(input: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode(...new Uint8Array(hash)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function prepareXOAuth(): Promise<{ codeVerifier: string; codeChallenge: string }> {
  const codeVerifier = randomBytesUrlSafe(32);
  const codeChallenge = await sha256Base64Url(codeVerifier);
  return { codeVerifier, codeChallenge };
}

export function saveXPkce(tenantKey: string, codeVerifier: string) {
  sessionStorage.setItem(STORAGE_X, JSON.stringify({ tenantKey, codeVerifier }));
}

export function getXPkce(): { tenantKey: string; codeVerifier: string } | null {
  const raw = sessionStorage.getItem(STORAGE_X);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as { tenantKey: string; codeVerifier: string };
  } catch {
    return null;
  }
}

export function clearXPkce() {
  sessionStorage.removeItem(STORAGE_X);
}

export function saveLinkedInTenant(tenantKey: string) {
  sessionStorage.setItem(STORAGE_LI, tenantKey);
}

export function getLinkedInTenant(): string | null {
  return sessionStorage.getItem(STORAGE_LI);
}

export function clearLinkedInTenant() {
  sessionStorage.removeItem(STORAGE_LI);
}

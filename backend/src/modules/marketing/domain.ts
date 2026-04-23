export function hostnameFromWebsiteUrl(raw: string): string | null {
  const t = raw.trim();
  if (!t) return null;
  try {
    const u = new URL(t.includes("://") ? t : `https://${t}`);
    return u.hostname.replace(/^www\./, "") || null;
  } catch {
    return null;
  }
}

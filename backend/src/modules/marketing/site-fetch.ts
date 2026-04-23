export async function fetchRemoteSiteSettingsJson(url: string): Promise<unknown> {
  const res = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(12_000),
  });
  if (!res.ok) {
    throw new Error(`Uzak site ${res.status}: ${res.statusText}`);
  }
  return res.json();
}

export async function discoverTrackingIds(url: string): Promise<{ gtmId?: string; ga4Id?: string }> {
  const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new Error("Siteye erişilemedi");
  const html = await res.text();

  const gtmMatch = html.match(/GTM-[A-Z0-9]+/);
  const ga4Match = html.match(/G-[A-Z0-9]+/);

  return {
    gtmId: gtmMatch ? gtmMatch[0] : undefined,
    ga4Id: ga4Match ? ga4Match[0] : undefined,
  };
}

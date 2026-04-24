const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8089/api/v1";
export const API_ORIGIN = API_URL.replace(/\/api\/v1\/?$/, "");

function normalizeApiError(err: unknown, status: number): string {
  if (typeof err === "string" && err.trim()) return err;
  if (err && typeof err === "object") {
    const maybeError = (err as { error?: unknown }).error;
    if (typeof maybeError === "string" && maybeError.trim()) return maybeError;
    if (maybeError && typeof maybeError === "object") {
      const nestedMessage = (maybeError as { message?: unknown }).message;
      if (typeof nestedMessage === "string" && nestedMessage.trim()) return nestedMessage;
    }
    const maybeMessage = (err as { message?: unknown }).message;
    if (typeof maybeMessage === "string" && maybeMessage.trim()) return maybeMessage;
  }
  return `API hatasi: ${status}`;
}

async function fetcher<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    headers: options?.body instanceof FormData 
      ? { ...options?.headers } 
      : { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });

  // Auto-refresh on 401
  if (res.status === 401 && !path.includes("/auth/")) {
    const refreshRes = await fetch(`${API_URL}/auth/token/refresh`, {
      method: "POST",
      credentials: "include",
    });

    if (refreshRes.ok) {
      // Retry original request
      const retryRes = await fetch(`${API_URL}${path}`, {
        credentials: "include",
        headers: options?.body instanceof FormData 
          ? { ...options?.headers } 
          : { "Content-Type": "application/json", ...options?.headers },
        ...options,
      });
      if (!retryRes.ok) {
        const err = await retryRes.json().catch(() => ({ error: retryRes.statusText }));
        throw new Error(normalizeApiError(err, retryRes.status));
      }
      return retryRes.json();
    } else {
      // Refresh failed, redirect to login
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      throw new Error("Oturum suresi doldu");
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(normalizeApiError(err, res.status));
  }
  return res.json();
}

// ... existing auth, posts, templates, tenants ...
// (I will use multi_replace if needed, but for now let's just append)

export const siteSettings = {
  list: (params?: any) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return fetcher<{ items: any[] }>(`/site-settings${qs}`);
  },
  get: (key: string, locale: string = "tr") => 
    fetcher<any>(`/site-settings/${key}?locale=${locale}`),
  upsert: (data: { key: string; value: any; locale?: string; group?: string }) =>
    fetcher<any>("/admin/site-settings", { method: "POST", body: JSON.stringify(data) }),
  delete: (key: string, locale: string = "tr") =>
    fetcher<any>(`/admin/site-settings/${key}?locale=${locale}`, { method: "DELETE" }),
};

export const storage = {
  upload: (file: File, folder: string = "logo") => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);
    return fetcher<any>("/admin/storage/upload", {
      method: "POST",
      body: formData,
    });
  },
  list: (params?: any) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return fetcher<{ items: any[] }>(`/admin/storage${qs}`);
  },
};

// ─── Auth ────────────────────────────────────────────────────
export const auth = {
  login: (email: string, password: string) =>
    fetcher<{ access_token: string; user: any }>("/auth/token", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  refresh: () =>
    fetcher<{ access_token: string }>("/auth/token/refresh", { method: "POST" }),
  me: () => fetcher<any>("/auth/user"),
  status: () => fetcher<{ authenticated: boolean; user?: any }>("/auth/status"),
  logout: () =>
    fetch(`${API_URL}/auth/logout`, { method: "POST", credentials: "include" }),
  updateProfile: (data: any) =>
    fetcher<any>("/auth/user", { method: "PUT", body: JSON.stringify(data) }),
};

// ─── Posts ───────────────────────────────────────────────────
export const posts = {
  list: (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return fetcher<{ items: any[]; total: number }>(`/posts${qs}`);
  },
  get: (id: number) => fetcher<any>(`/posts/${id}`),
  details: (id: number, refresh = false) =>
    fetcher<any>(`/posts/${id}/details${refresh ? "?refresh=1" : ""}`),
  create: (data: any) =>
    fetcher<any>("/posts", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: any) =>
    fetcher<any>(`/posts/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (id: number) =>
    fetcher<any>(`/posts/${id}`, { method: "DELETE" }),
  schedule: (id: number, scheduledAt: string) =>
    fetcher<any>(`/posts/${id}/schedule`, {
      method: "POST",
      body: JSON.stringify({ scheduledAt }),
    }),
  publishNow: (id: number) =>
    fetcher<any>(`/posts/${id}/publish-now`, { method: "POST" }),
  refreshMetrics: (id: number) =>
    fetcher<any>(`/posts/${id}/refresh-metrics`, { method: "POST" }),
  cancel: (id: number) =>
    fetcher<any>(`/posts/${id}/cancel`, { method: "POST" }),
  duplicate: (id: number) =>
    fetcher<any>(`/posts/${id}/duplicate`, { method: "POST" }),
  queue: () => fetcher<{ items: any[] }>("/posts/queue"),
  stats: (tenantKey?: string) =>
    fetcher<Record<string, number>>(
      `/posts/stats${tenantKey ? `?tenantKey=${encodeURIComponent(tenantKey)}` : ""}`
    ),
};

// ─── Templates ──────────────────────────────────────────────
export const templates = {
  list: (tenantKey?: string) =>
    fetcher<{ items: any[] }>(
      `/templates${tenantKey ? `?tenantKey=${encodeURIComponent(tenantKey)}` : ""}`
    ),
  get: (id: number) => fetcher<any>(`/templates/${id}`),
  create: (data: any) =>
    fetcher<any>("/templates", { method: "POST", body: JSON.stringify(data) }),
  generate: (id: number, variables: Record<string, string>) =>
    fetcher<any>(`/templates/${id}/generate`, {
      method: "POST",
      body: JSON.stringify({ variables }),
    }),
};

export const tenants = {
  list: () => fetcher<{ items: any[] }>("/tenants"),
  get: (tenantKey: string) => fetcher<any>(`/tenants/${encodeURIComponent(tenantKey)}`),
};

export const tenantAdmin = {
  onboard: (data: {
    key: string;
    name: string;
    websiteUrl?: string;
    appName?: string;
    loginSubtitle?: string;
    defaultHashtags?: string;
  }) =>
    fetcher<any>("/tenants/admin/onboard", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateProfile: (tenantKey: string, data: Record<string, unknown>) =>
    fetcher<any>(`/tenants/admin/${encodeURIComponent(tenantKey)}/profile`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
};

export const marketing = {
  settings: (tenantKey: string) =>
    fetcher<any>(`/marketing/settings?tenantKey=${encodeURIComponent(tenantKey)}`),
  updateSettings: (data: Record<string, unknown>) =>
    fetcher<any>("/marketing/settings", { method: "PATCH", body: JSON.stringify(data) }),
  siteSettingsFetch: (tenantKey: string) =>
    fetcher<any>(`/marketing/site-settings-fetch?tenantKey=${encodeURIComponent(tenantKey)}`),
  discoverTrackingIds: (tenantKey: string) =>
    fetcher<any>(`/marketing/discover-ids?tenantKey=${encodeURIComponent(tenantKey)}`),
  gscSummary: (tenantKey: string) =>
    fetcher<any>(`/marketing/gsc-summary?tenantKey=${encodeURIComponent(tenantKey)}`),
  backlinks: (tenantKey: string) =>
    fetcher<any>(`/marketing/backlinks?tenantKey=${encodeURIComponent(tenantKey)}`),
  googleAdsLinks: (tenantKey: string) =>
    fetcher<any>(`/marketing/google-ads-links?tenantKey=${encodeURIComponent(tenantKey)}`),
  ga4Summary: (tenantKey: string) =>
    fetcher<any>(`/marketing/ga4-summary?tenantKey=${encodeURIComponent(tenantKey)}`),
  googleAdsCampaigns: (tenantKey: string) =>
    fetcher<any>(`/marketing/google-ads-campaigns?tenantKey=${encodeURIComponent(tenantKey)}`),
  googleAdsAudit: (tenantKey: string) =>
    fetcher<any>(`/marketing/google-ads/audit?tenantKey=${encodeURIComponent(tenantKey)}`),
  googleAdsRecommendations: (tenantKey: string) =>
    fetcher<any>(`/marketing/google-ads/recommendations?tenantKey=${encodeURIComponent(tenantKey)}`),
  googleAdsChangeSets: (tenantKey: string) =>
    fetcher<any>(`/marketing/google-ads/change-sets?tenantKey=${encodeURIComponent(tenantKey)}`),
  createVistaSeedsPlan: (tenantKey: string, data?: { campaignId?: string; assetGroupResourceName?: string }) =>
    fetcher<any>("/marketing/google-ads/vistaseeds-plan", {
      method: "POST",
      body: JSON.stringify({ tenantKey, ...(data ?? {}) }),
    }),
  validateGoogleAdsChangeSet: (uuid: string) =>
    fetcher<any>(`/marketing/google-ads/change-sets/${encodeURIComponent(uuid)}/validate`, {
      method: "POST",
    }),
  applyGoogleAdsChangeSet: (uuid: string) =>
    fetcher<any>(`/marketing/google-ads/change-sets/${encodeURIComponent(uuid)}/apply`, {
      method: "POST",
      body: JSON.stringify({ confirmApply: true }),
    }),
  backlinksSync: (tenantKey: string) =>
    fetcher<any>("/marketing/backlinks/sync", {
      method: "POST",
      body: JSON.stringify({ tenantKey }),
    }),
};

// ─── Calendar ───────────────────────────────────────────────
export const calendar = {
  list: (from?: string, to?: string, tenantKey?: string) => {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (tenantKey) params.set("tenantKey", tenantKey);
    return fetcher<{ items: any[] }>(`/calendar?${params}`);
  },
  generateWeek: (startDate?: string, tenantKey?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.set("start_date", startDate);
    if (tenantKey) params.set("tenantKey", tenantKey);
    const qs = params.toString() ? `?${params.toString()}` : "";
    return fetcher<{ items: any[] }>(`/calendar/generate-week${qs}`, {
      method: "POST",
    });
  },
};

// ─── Platforms ──────────────────────────────────────────────
export const platforms = {
  status: (tenantKey?: string) =>
    fetcher<any>(
      `/platforms/status${tenantKey ? `?tenantKey=${encodeURIComponent(tenantKey)}` : ""}`
    ),
  list: (tenantKey: string) =>
    fetcher<{ items: any[] }>(`/platforms?tenantKey=${encodeURIComponent(tenantKey)}`),
  testTelegram: () => fetcher<any>("/platforms/telegram/test", { method: "POST" }),
  testLinkedIn: (tenantKey: string) =>
    fetcher<any>("/platforms/linkedin/test", {
      method: "POST",
      body: JSON.stringify({ tenantKey }),
    }),
  testX: (tenantKey: string) =>
    fetcher<any>("/platforms/x/test", {
      method: "POST",
      body: JSON.stringify({ tenantKey }),
    }),
  testFacebook: (tenantKey: string) =>
    fetcher<any>("/platforms/facebook/test", {
      method: "POST",
      body: JSON.stringify({ tenantKey }),
    }),
  testInstagram: (tenantKey: string, imageUrl?: string) =>
    fetcher<any>("/platforms/instagram/test", {
      method: "POST",
      body: JSON.stringify({ tenantKey, ...(imageUrl ? { imageUrl } : {}) }),
    }),
  linkedinAuthUrl: (tenantKey: string) =>
    fetcher<{ url: string }>(
      `/platforms/linkedin/auth-url?tenantKey=${encodeURIComponent(tenantKey)}`
    ),
  linkedinOAuthComplete: (body: { tenantKey: string; code: string; redirectUri?: string }) =>
    fetcher<{ ok: boolean }>("/platforms/linkedin/callback", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  xAuthUrl: (tenantKey: string, codeChallenge: string) =>
    fetcher<{ url: string }>(
      `/platforms/x/auth-url?tenantKey=${encodeURIComponent(tenantKey)}&codeChallenge=${encodeURIComponent(codeChallenge)}`
    ),
  xOAuthComplete: (body: {
    tenantKey: string;
    code: string;
    codeVerifier: string;
    redirectUri?: string;
  }) =>
    fetcher<{ ok: boolean }>("/platforms/x/callback", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  manualConnect: (data: {
    tenantKey: string;
    platform: string;
    accountName: string;
    accountId?: string;
    accessToken?: string;
    refreshToken?: string;
    pageId?: string;
    pageToken?: string;
  }) => fetcher<any>("/platforms/manual/connect", { method: "POST", body: JSON.stringify(data) }),
  delete: (id: string | number) =>
    fetcher<any>(`/platforms/${encodeURIComponent(String(id))}`, { method: "DELETE" }),
};

// ─── E-posta (tenant bazli SMTP / IMAP) ─────────────────────
export const email = {
  settings: (tenantKey: string) =>
    fetcher<{ tenantKey: string; settings: Record<string, unknown> }>(
      `/email/settings?tenantKey=${encodeURIComponent(tenantKey)}`
    ),
  updateSettings: (data: Record<string, unknown>) =>
    fetcher<{ ok: boolean }>("/email/settings", { method: "PATCH", body: JSON.stringify(data) }),
  testSmtp: (tenantKey: string, to?: string) =>
    fetcher<{ ok: boolean; sentTo?: string }>("/email/test-smtp", {
      method: "POST",
      body: JSON.stringify({ tenantKey, ...(to ? { to } : {}) }),
    }),
  inbox: (tenantKey: string, limit?: number) => {
    const q = new URLSearchParams({ tenantKey });
    if (limit) q.set("limit", String(limit));
    return fetcher<{ items: any[] }>(`/email/inbox?${q}`);
  },
  message: (tenantKey: string, uid: number) =>
    fetcher<any>(
      `/email/message?tenantKey=${encodeURIComponent(tenantKey)}&uid=${encodeURIComponent(String(uid))}`
    ),
  reply: (data: {
    tenantKey: string;
    to: string;
    subject?: string;
    text: string;
    inReplyTo?: string;
    references?: string;
  }) =>
    fetcher<{ ok: boolean }>("/email/reply", { method: "POST", body: JSON.stringify(data) }),
};

// ─── AI ─────────────────────────────────────────────────────
export const ai = {
  generateCaption: (data: { tenantKey?: string; title: string; content?: string; url?: string }) =>
    fetcher<any>("/ai/generate-caption", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  generatePost: (data: any) =>
    fetcher<any>("/ai/generate-post", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  engagementPost: (data: { tenantKey?: string; type?: string; topic?: string }) =>
    fetcher<any>("/ai/engagement-post", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  hashtags: (postType?: string) =>
    fetcher<any>("/ai/hashtags", {
      method: "POST",
      body: JSON.stringify({ postType }),
    }),
};

// ─── Analytics ──────────────────────────────────────────────
export const analytics = {
  overview: () => fetcher<any>("/analytics/overview"),
  topPosts: () => fetcher<{ items: any[] }>("/analytics/top-posts"),
  tenantSummary: (tenantKey: string) =>
    fetcher<any>(`/analytics/tenant-summary?tenantKey=${encodeURIComponent(tenantKey)}`),
  tenantReportPdfUrl: (tenantKey: string) =>
    `${API_URL}/analytics/tenant-report.pdf?tenantKey=${encodeURIComponent(tenantKey)}`,
};

// ─── Ekosistem Feed ─────────────────────────────────────────
export const ekosistem = {
  news: (limit?: number) =>
    fetcher<any>(`/ekosistem/news?limit=${limit || 10}`),
  articles: (limit?: number) =>
    fetcher<any>(`/ekosistem/articles?limit=${limit || 10}`),
};

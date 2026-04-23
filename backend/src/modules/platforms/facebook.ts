import { env } from "../../core/env";

const FB_GRAPH_URL = "https://graph.facebook.com/v21.0";

interface FBPostResult {
  id: string;
}

interface FBError {
  error: {
    message: string;
    type: string;
    code: number;
  };
}

// ─── Metin + Link Postu ─────────────────────────────────────
export async function publishTextPost(
  message: string,
  link?: string,
  opts?: { pageId?: string; pageAccessToken?: string }
): Promise<FBPostResult> {
  const pageId = opts?.pageId || env.FB_PAGE_ID;
  const token = opts?.pageAccessToken || env.FB_PAGE_ACCESS_TOKEN;

  if (!pageId || !token) {
    throw new Error("Facebook yapilandirmasi eksik: FB_PAGE_ID ve FB_PAGE_ACCESS_TOKEN gerekli");
  }

  const body: Record<string, string> = { message, access_token: token };
  if (link) body.link = link;

  const res = await fetch(`${FB_GRAPH_URL}/${pageId}/feed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) {
    const err = data as FBError;
    throw new Error(`Facebook API hatasi: ${err.error?.message || res.statusText}`);
  }

  return data as FBPostResult;
}

// ─── Gorsel + Metin Postu ───────────────────────────────────
export async function publishPhotoPost(
  imageUrl: string,
  caption: string,
  opts?: { pageId?: string; pageAccessToken?: string }
): Promise<FBPostResult> {
  const pageId = opts?.pageId || env.FB_PAGE_ID;
  const token = opts?.pageAccessToken || env.FB_PAGE_ACCESS_TOKEN;

  if (!pageId || !token) {
    throw new Error("Facebook yapilandirmasi eksik");
  }

  const res = await fetch(`${FB_GRAPH_URL}/${pageId}/photos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: imageUrl,
      caption,
      access_token: token,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    const err = data as FBError;
    throw new Error(`Facebook API hatasi: ${err.error?.message || res.statusText}`);
  }

  return data as FBPostResult;
}

// ─── Post Metriklerini Cek ──────────────────────────────────
export async function getPostInsights(postId: string) {
  const token = env.FB_PAGE_ACCESS_TOKEN;
  if (!token) throw new Error("FB_PAGE_ACCESS_TOKEN eksik");

  const fields = "likes.summary(true),comments.summary(true),shares";
  const res = await fetch(
    `${FB_GRAPH_URL}/${postId}?fields=${fields}&access_token=${token}`
  );

  const data = (await res.json()) as any;
  if (!res.ok) {
    const err = data as FBError;
    throw new Error(`Facebook API hatasi: ${err.error?.message || res.statusText}`);
  }

  return {
    likes: data.likes?.summary?.total_count ?? 0,
    comments: data.comments?.summary?.total_count ?? 0,
    shares: data.shares?.count ?? 0,
  };
}

// ─── Sayfa Bilgilerini Al ───────────────────────────────────
export async function getPageInfo() {
  const pageId = env.FB_PAGE_ID;
  const token = env.FB_PAGE_ACCESS_TOKEN;
  if (!pageId || !token) throw new Error("Facebook yapilandirmasi eksik");

  const fields = "name,fan_count,followers_count,picture";
  const res = await fetch(
    `${FB_GRAPH_URL}/${pageId}?fields=${fields}&access_token=${token}`
  );

  const data = await res.json();
  if (!res.ok) {
    const err = data as FBError;
    throw new Error(`Facebook API hatasi: ${err.error?.message || res.statusText}`);
  }

  return data;
}

// ─── Long-Lived Token Al ────────────────────────────────────
export async function exchangeForLongLivedToken(
  shortLivedToken: string
): Promise<{ access_token: string; expires_in: number }> {
  const appId = env.FB_APP_ID;
  const appSecret = env.FB_APP_SECRET;
  if (!appId || !appSecret) throw new Error("FB_APP_ID ve FB_APP_SECRET gerekli");

  const res = await fetch(
    `${FB_GRAPH_URL}/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortLivedToken}`
  );

  const data = await res.json();
  if (!res.ok) {
    const err = data as FBError;
    throw new Error(`Token degisim hatasi: ${err.error?.message || res.statusText}`);
  }

  return data as { access_token: string; expires_in: number };
}

// ─── Token Gecerliligi Kontrol ──────────────────────────────
export async function debugToken(token: string) {
  const appToken = `${env.FB_APP_ID}|${env.FB_APP_SECRET}`;
  const res = await fetch(
    `${FB_GRAPH_URL}/debug_token?input_token=${token}&access_token=${appToken}`
  );
  const data = (await res.json()) as any;
  return data.data;
}

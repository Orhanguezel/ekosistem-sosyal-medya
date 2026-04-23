import { env } from "../../core/env";

const FB_GRAPH_URL = "https://graph.facebook.com/v21.0";

interface IGMediaResult {
  id: string;
}

interface IGError {
  error: {
    message: string;
    type: string;
    code: number;
  };
}

// ─── Gorsel Postu Yayinla (2 Adim) ─────────────────────────
export async function publishPhotoPost(
  imageUrl: string,
  caption: string,
  opts?: { accountId?: string; accessToken?: string }
): Promise<IGMediaResult> {
  const accountId = opts?.accountId || env.IG_ACCOUNT_ID;
  const token = opts?.accessToken || env.IG_ACCESS_TOKEN;

  if (!accountId || !token) {
    throw new Error("Instagram yapilandirmasi eksik: IG_ACCOUNT_ID ve IG_ACCESS_TOKEN gerekli");
  }

  // Adim 1: Media container olustur
  const containerRes = await fetch(`${FB_GRAPH_URL}/${accountId}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      image_url: imageUrl,
      caption,
      access_token: token,
    }),
  });

  const containerData = await containerRes.json();
  if (!containerRes.ok) {
    const err = containerData as IGError;
    throw new Error(`Instagram container hatasi: ${err.error?.message || containerRes.statusText}`);
  }

  const containerId = (containerData as IGMediaResult).id;

  // Container hazir olana kadar bekle (max 30 saniye)
  await waitForContainer(containerId, token);

  // Adim 2: Yayinla
  const publishRes = await fetch(`${FB_GRAPH_URL}/${accountId}/media_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      creation_id: containerId,
      access_token: token,
    }),
  });

  const publishData = await publishRes.json();
  if (!publishRes.ok) {
    const err = publishData as IGError;
    throw new Error(`Instagram yayinlama hatasi: ${err.error?.message || publishRes.statusText}`);
  }

  return publishData as IGMediaResult;
}

// ─── Carousel (Coklu Gorsel) Postu ─────────────────────────
export async function publishCarouselPost(
  imageUrls: string[],
  caption: string
): Promise<IGMediaResult> {
  const accountId = env.IG_ACCOUNT_ID;
  const token = env.IG_ACCESS_TOKEN;

  if (!accountId || !token) {
    throw new Error("Instagram yapilandirmasi eksik");
  }

  if (imageUrls.length < 2 || imageUrls.length > 10) {
    throw new Error("Carousel icin 2-10 gorsel gerekli");
  }

  // Her gorsel icin container olustur
  const childIds: string[] = [];
  for (const url of imageUrls) {
    const res = await fetch(`${FB_GRAPH_URL}/${accountId}/media`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image_url: url,
        is_carousel_item: true,
        access_token: token,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      const err = data as IGError;
      throw new Error(`Carousel item hatasi: ${err.error?.message}`);
    }
    childIds.push((data as IGMediaResult).id);
  }

  // Ana carousel container
  const carouselRes = await fetch(`${FB_GRAPH_URL}/${accountId}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      media_type: "CAROUSEL",
      children: childIds.join(","),
      caption,
      access_token: token,
    }),
  });

  const carouselData = await carouselRes.json();
  if (!carouselRes.ok) {
    const err = carouselData as IGError;
    throw new Error(`Carousel container hatasi: ${err.error?.message}`);
  }

  const carouselId = (carouselData as IGMediaResult).id;
  await waitForContainer(carouselId, token);

  // Yayinla
  const publishRes = await fetch(`${FB_GRAPH_URL}/${accountId}/media_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      creation_id: carouselId,
      access_token: token,
    }),
  });

  const publishData = await publishRes.json();
  if (!publishRes.ok) {
    const err = publishData as IGError;
    throw new Error(`Carousel yayinlama hatasi: ${err.error?.message}`);
  }

  return publishData as IGMediaResult;
}

// ─── Post Metriklerini Cek ──────────────────────────────────
export async function getMediaInsights(mediaId: string) {
  const token = env.IG_ACCESS_TOKEN;
  if (!token) throw new Error("IG_ACCESS_TOKEN eksik");

  const metrics = "impressions,reach,likes,comments,saved,shares";
  const res = await fetch(
    `${FB_GRAPH_URL}/${mediaId}/insights?metric=${metrics}&access_token=${token}`
  );

  const data = (await res.json()) as any;
  if (!res.ok) {
    // Fallback: temel metrikleri fields ile cek
    const fallbackRes = await fetch(
      `${FB_GRAPH_URL}/${mediaId}?fields=like_count,comments_count,timestamp&access_token=${token}`
    );
    const fallbackData = (await fallbackRes.json()) as any;
    return {
      likes: fallbackData.like_count ?? 0,
      comments: fallbackData.comments_count ?? 0,
      shares: 0,
      saves: 0,
      reach: 0,
      impressions: 0,
    };
  }

  const metrics_data = data.data || [];
  const result: Record<string, number> = {};
  for (const m of metrics_data) {
    result[m.name] = m.values?.[0]?.value ?? 0;
  }

  return {
    likes: result.likes ?? 0,
    comments: result.comments ?? 0,
    shares: result.shares ?? 0,
    saves: result.saved ?? 0,
    reach: result.reach ?? 0,
    impressions: result.impressions ?? 0,
  };
}

// ─── Hesap Bilgilerini Al ───────────────────────────────────
export async function getAccountInfo() {
  const accountId = env.IG_ACCOUNT_ID;
  const token = env.IG_ACCESS_TOKEN;
  if (!accountId || !token) throw new Error("Instagram yapilandirmasi eksik");

  const fields = "username,name,profile_picture_url,followers_count,media_count";
  const res = await fetch(
    `${FB_GRAPH_URL}/${accountId}?fields=${fields}&access_token=${token}`
  );

  const data = await res.json();
  if (!res.ok) {
    const err = data as IGError;
    throw new Error(`Instagram API hatasi: ${err.error?.message}`);
  }

  return data;
}

// ─── Container Hazir Bekle ──────────────────────────────────
async function waitForContainer(
  containerId: string,
  token: string,
  maxWaitMs = 30000
): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    const res = await fetch(
      `${FB_GRAPH_URL}/${containerId}?fields=status_code&access_token=${token}`
    );
    const data = (await res.json()) as any;

    if (data.status_code === "FINISHED") return;
    if (data.status_code === "ERROR") {
      throw new Error(`Instagram media isleme hatasi: ${data.status || "bilinmeyen hata"}`);
    }

    // 2 saniye bekle
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  throw new Error("Instagram media isleme zaman asimi (30s)");
}

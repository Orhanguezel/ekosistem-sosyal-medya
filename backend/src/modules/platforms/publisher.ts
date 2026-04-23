import * as facebook from "./facebook";
import * as instagram from "./instagram";
import * as linkedin from "./linkedin";
import * as xPlatform from "./x";
import * as telegram from "./telegram";
import * as postRepo from "../posts/repository";
import { db } from "../../db/client";
import { platformAccounts } from "../../db/schema";
import { and, eq } from "drizzle-orm";
import { emitPublishEvent } from "../../core/events";

interface PublishResult {
  success: boolean;
  fbPostId?: string;
  igMediaId?: string;
  errors: string[];
}

// Platform gruplari: hangi platform degerinde hangi kanallar yayinlanir
function resolvePlatforms(platform: string) {
  return {
    facebook: ["facebook", "both", "all"].includes(platform),
    instagram: ["instagram", "both", "all"].includes(platform),
    linkedin: ["linkedin", "all"].includes(platform),
    x: ["x", "all"].includes(platform),
    telegram: ["telegram", "all"].includes(platform),
  };
}

// ─── Post Yayinla (Birlesik) ────────────────────────────────
export async function publishPost(postId: number): Promise<PublishResult> {
  const post = await postRepo.getPostById(postId);
  if (!post) throw new Error("Post bulunamadi");

  const result: PublishResult = { success: true, errors: [] };
  const tenantKey = (post.subType || "").trim();
  if (!tenantKey) {
    throw new Error("Post tenant bilgisi eksik (sub_type/tenantKey)");
  }

  const accounts = await db
    .select()
    .from(platformAccounts)
    .where(and(eq(platformAccounts.tenantKey, tenantKey), eq(platformAccounts.isActive, 1)));

  const byPlatform = new Map(accounts.map((a) => [a.platform, a] as const));
  const targets = resolvePlatforms(post.platform);

  // Status'u publishing'e cevir
  await postRepo.markPostAsPublished(postId);

  // ─── Facebook ───────────────────────────────────────────
  if (targets.facebook) {
    try {
      const caption = buildCaption(post.caption, post.hashtags);
      const fbAccount = byPlatform.get("facebook");
      if (!fbAccount?.accessToken || !fbAccount?.pageId) {
        throw new Error(`Tenant (${tenantKey}) icin Facebook hesabi bagli degil`);
      }
      let fbResult;
      if (post.imageUrl) {
        fbResult = await facebook.publishPhotoPost(post.imageUrl, caption, {
          pageId: fbAccount.pageId,
          pageAccessToken: fbAccount.accessToken,
        });
      } else {
        fbResult = await facebook.publishTextPost(caption, post.linkUrl ?? undefined, {
          pageId: fbAccount.pageId,
          pageAccessToken: fbAccount.accessToken,
        });
      }
      result.fbPostId = fbResult.id;
      await telegram.notifyPostPublished("facebook", post.title || post.caption.substring(0, 50), "success");
    } catch (err) {
      result.errors.push(`Facebook: ${(err as Error).message}`);
      result.success = false;
      await telegram.notifyPostPublished("facebook", post.title || post.caption.substring(0, 50), "failed", (err as Error).message);
    }
  }

  // ─── Instagram ──────────────────────────────────────────
  if (targets.instagram) {
    try {
      if (!post.imageUrl) {
        result.errors.push("Instagram: Gorsel olmadan post paylasilamaz");
        if (!targets.facebook) result.success = false;
      } else {
        const caption = buildCaption(post.caption, post.hashtags);
        const igAccount = byPlatform.get("instagram");
        if (!igAccount?.accessToken || !igAccount?.accountId) {
          throw new Error(`Tenant (${tenantKey}) icin Instagram hesabi bagli degil`);
        }
        const igResult = await instagram.publishPhotoPost(post.imageUrl, caption, {
          accountId: igAccount.accountId,
          accessToken: igAccount.accessToken,
        });
        result.igMediaId = igResult.id;
        await telegram.notifyPostPublished("instagram", post.title || post.caption.substring(0, 50), "success");
      }
    } catch (err) {
      result.errors.push(`Instagram: ${(err as Error).message}`);
      result.success = false;
      await telegram.notifyPostPublished("instagram", post.title || post.caption.substring(0, 50), "failed", (err as Error).message);
    }
  }

  // ─── LinkedIn ───────────────────────────────────────────
  if (targets.linkedin) {
    try {
      const acc = byPlatform.get("linkedin");
      if (!acc?.accessToken || !acc.accountId) {
        throw new Error(`Tenant (${tenantKey}) icin LinkedIn hesabi bagli degil`);
      }
      const text = buildCaption(post.caption, post.hashtags);
      await linkedin.publishTextPost(acc.accessToken, acc.accountId, text);
      await telegram.notifyPostPublished("linkedin", post.title || post.caption.substring(0, 50), "success");
    } catch (err) {
      result.errors.push(`LinkedIn: ${(err as Error).message}`);
      result.success = false;
      await telegram.notifyPostPublished("linkedin", post.title || post.caption.substring(0, 50), "failed", (err as Error).message);
    }
  }

  // ─── X (Twitter) ────────────────────────────────────────
  if (targets.x) {
    try {
      const acc = byPlatform.get("x");
      if (!acc?.accessToken) {
        throw new Error(`Tenant (${tenantKey}) icin X hesabi bagli degil`);
      }
      const text = buildCaption(post.caption, post.hashtags);
      await xPlatform.publishTextPost(acc.accessToken, text);
      await telegram.notifyPostPublished("x", post.title || post.caption.substring(0, 50), "success");
    } catch (err) {
      result.errors.push(`X: ${(err as Error).message}`);
      result.success = false;
      await telegram.notifyPostPublished("x", post.title || post.caption.substring(0, 50), "failed", (err as Error).message);
    }
  }

  // ─── Telegram ───────────────────────────────────────────
  if (targets.telegram) {
    try {
      const acc = byPlatform.get("telegram");
      if (!acc?.accessToken || !acc.accountId) {
        throw new Error(`Tenant (${tenantKey}) icin Telegram hesabi bagli degil`);
      }
      const text = buildCaption(post.caption, post.hashtags);
      // acc.accessToken = bot token, acc.accountId = chat_id
      const tgRes = await fetch(
        `https://api.telegram.org/bot${acc.accessToken}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: acc.accountId, text, parse_mode: "HTML" }),
        }
      );
      if (!tgRes.ok) {
        const err = await tgRes.json();
        throw new Error(JSON.stringify(err));
      }
      await telegram.notifyPostPublished("telegram", post.title || post.caption.substring(0, 50), "success");
    } catch (err) {
      result.errors.push(`Telegram: ${(err as Error).message}`);
      result.success = false;
    }
  }

  // Sonucu DB'ye kaydet
  if (result.success || result.fbPostId || result.igMediaId) {
    await postRepo.markPostAsPublished(postId, result.fbPostId, result.igMediaId);
    await emitPublishEvent({ tenantKey, postId, status: "success", errors: result.errors });
  } else {
    await postRepo.markPostAsFailed(postId, result.errors.join("; "));
    await emitPublishEvent({ tenantKey, postId, status: "failed", errors: result.errors });
  }

  return result;
}

// ─── Caption Birlestir ──────────────────────────────────────
function buildCaption(caption: string, hashtags?: string | null): string {
  if (!hashtags) return caption;
  if (caption.includes("#")) return caption;
  return `${caption}\n\n${hashtags}`;
}

// ─── Platform Durumunu Kontrol Et ───────────────────────────
export async function checkPlatformStatus(tenantKey?: string): Promise<{
  facebook: { connected: boolean; info?: unknown };
  instagram: { connected: boolean; info?: unknown };
  linkedin: { connected: boolean };
  x: { connected: boolean };
  telegram: { connected: boolean };
}> {
  const status = {
    facebook: { connected: false as boolean, info: undefined as unknown },
    instagram: { connected: false as boolean, info: undefined as unknown },
    linkedin: { connected: false as boolean },
    x: { connected: false as boolean },
    telegram: { connected: false as boolean },
  };

  if (tenantKey) {
    const accounts = await db
      .select()
      .from(platformAccounts)
      .where(and(eq(platformAccounts.tenantKey, tenantKey), eq(platformAccounts.isActive, 1)));
    status.facebook.connected = accounts.some((a) => a.platform === "facebook");
    status.instagram.connected = accounts.some((a) => a.platform === "instagram");
    status.linkedin.connected = accounts.some((a) => a.platform === "linkedin");
    status.x.connected = accounts.some((a) => a.platform === "x");
    status.telegram.connected = accounts.some((a) => a.platform === "telegram");
    return status;
  }

  try {
    status.facebook.info = await facebook.getPageInfo();
    status.facebook.connected = true;
  } catch {
    status.facebook.connected = false;
  }

  try {
    status.instagram.info = await instagram.getAccountInfo();
    status.instagram.connected = true;
  } catch {
    status.instagram.connected = false;
  }

  status.telegram.connected = !!(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID);

  return status;
}

export async function publishLinkedInPost(tenantKey: string, text: string) {
  const [acc] = await db
    .select()
    .from(platformAccounts)
    .where(and(eq(platformAccounts.platform, "linkedin"), eq(platformAccounts.tenantKey, tenantKey), eq(platformAccounts.isActive, 1)))
    .limit(1);
  if (!acc?.accessToken || !acc.accountId) throw new Error("LinkedIn hesabi bagli degil");
  return linkedin.publishTextPost(acc.accessToken, acc.accountId, text);
}

export async function publishXPost(tenantKey: string, text: string) {
  const [acc] = await db
    .select()
    .from(platformAccounts)
    .where(and(eq(platformAccounts.platform, "x"), eq(platformAccounts.tenantKey, tenantKey), eq(platformAccounts.isActive, 1)))
    .limit(1);
  if (!acc?.accessToken) throw new Error("X hesabi bagli degil");
  return xPlatform.publishTextPost(acc.accessToken, text);
}

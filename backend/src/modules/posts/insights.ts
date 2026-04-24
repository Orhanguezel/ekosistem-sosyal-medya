import { and, desc, eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { db } from "../../db/client";
import { ensurePostCommentsTable } from "../../db/ensure";
import {
  platformAccounts,
  postAnalytics,
  postComments,
  socialPosts,
} from "../../db/schema";

const GRAPH_URL = "https://graph.facebook.com/v25.0";
const COMMENT_LIMIT = 25;

type Platform = "facebook" | "instagram";
type SocialPost = typeof socialPosts.$inferSelect;
type PlatformAccount = typeof platformAccounts.$inferSelect;

type NormalizedMetric = {
  platform: Platform;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  reach: number;
  impressions: number;
  clicks: number;
  engagementRate: number;
  fetchedAt: Date;
};

type RemoteComment = {
  platform: Platform;
  externalCommentId: string;
  parentCommentId?: string | null;
  authorName?: string | null;
  authorId?: string | null;
  message: string;
  likeCount: number;
  createdTime: Date | null;
};

type RemotePostSnapshot = {
  platform: Platform;
  permalink?: string | null;
  mediaUrl?: string | null;
  message?: string | null;
  createdTime?: string | null;
};

type PlatformRefreshResult = {
  metric: NormalizedMetric;
  comments: RemoteComment[];
  remote: RemotePostSnapshot;
};

function toNumber(value: unknown): number {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function parseDate(value: unknown): Date | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? null : date;
}

function clampEngagementRate(value: number): number {
  if (!Number.isFinite(value) || value < 0) return 0;
  return Math.min(999.99, Number(value.toFixed(2)));
}

function calculateEngagementRate(metric: Omit<NormalizedMetric, "engagementRate" | "fetchedAt">) {
  const interactions =
    metric.likes + metric.comments + metric.shares + metric.saves + metric.clicks;
  const denominator = metric.reach || metric.impressions;
  if (!denominator) return 0;
  return clampEngagementRate((interactions / denominator) * 100);
}

function serializeMetric(row: typeof postAnalytics.$inferSelect) {
  return {
    ...row,
    likes: toNumber(row.likes),
    comments: toNumber(row.comments),
    shares: toNumber(row.shares),
    saves: toNumber(row.saves),
    reach: toNumber(row.reach),
    impressions: toNumber(row.impressions),
    clicks: toNumber(row.clicks),
    engagementRate: toNumber(row.engagementRate),
  };
}

function serializeComment(row: typeof postComments.$inferSelect) {
  return {
    ...row,
    likeCount: toNumber(row.likeCount),
  };
}

function graphErrorMessage(data: unknown, fallback: string) {
  if (data && typeof data === "object") {
    const error = (data as { error?: { message?: unknown } }).error;
    if (typeof error?.message === "string" && error.message.trim()) {
      return error.message;
    }
  }
  return fallback;
}

async function graphGet<T>(
  path: string,
  token: string,
  params: Record<string, string> = {},
): Promise<T> {
  const url = new URL(`${GRAPH_URL}/${path.replace(/^\//, "")}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  url.searchParams.set("access_token", token);

  const res = await fetch(url);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(graphErrorMessage(data, res.statusText));
  }
  return data as T;
}

async function getPost(postId: number) {
  const [post] = await db
    .select()
    .from(socialPosts)
    .where(eq(socialPosts.id, postId))
    .limit(1);
  return post ?? null;
}

async function getActiveAccount(tenantKey: string | null, platform: Platform) {
  const keys = [tenantKey || "default"];
  if (!keys.includes("default")) keys.push("default");

  for (const key of keys) {
    const [account] = await db
      .select()
      .from(platformAccounts)
      .where(
        and(
          eq(platformAccounts.tenantKey, key),
          eq(platformAccounts.platform, platform),
          eq(platformAccounts.isActive, 1),
        ),
      )
      .limit(1);
    if (account) return account;
  }

  return null;
}

function resolveToken(account: PlatformAccount, platform: Platform) {
  if (platform === "facebook") return account.pageToken || account.accessToken || null;
  return account.accessToken || account.pageToken || null;
}

function resolveTargets(post: SocialPost): Platform[] {
  const targets: Platform[] = [];
  if (post.fbPostId) targets.push("facebook");
  if (post.igMediaId) targets.push("instagram");
  return targets;
}

async function fetchFacebookPost(
  post: SocialPost,
  token: string,
): Promise<PlatformRefreshResult> {
  if (!post.fbPostId) throw new Error("Facebook post ID bulunamadi");

  const fields = [
    "id",
    "message",
    "created_time",
    "permalink_url",
    "full_picture",
    "shares",
    "reactions.summary(true).limit(0)",
    `comments.summary(true).limit(${COMMENT_LIMIT}){id,message,created_time,from,like_count}`,
  ].join(",");

  const data = await graphGet<any>(post.fbPostId, token, { fields });
  const baseMetric = {
    platform: "facebook" as const,
    likes: toNumber(data.reactions?.summary?.total_count),
    comments: toNumber(data.comments?.summary?.total_count),
    shares: toNumber(data.shares?.count),
    saves: 0,
    reach: 0,
    impressions: 0,
    clicks: 0,
  };

  const comments = Array.isArray(data.comments?.data)
    ? data.comments.data
        .filter((comment: any) => typeof comment?.id === "string")
        .map((comment: any): RemoteComment => ({
          platform: "facebook",
          externalCommentId: comment.id,
          authorName: typeof comment.from?.name === "string" ? comment.from.name : null,
          authorId: typeof comment.from?.id === "string" ? comment.from.id : null,
          message: typeof comment.message === "string" ? comment.message : "",
          likeCount: toNumber(comment.like_count),
          createdTime: parseDate(comment.created_time),
        }))
    : [];

  return {
    metric: {
      ...baseMetric,
      engagementRate: calculateEngagementRate(baseMetric),
      fetchedAt: new Date(),
    },
    comments,
    remote: {
      platform: "facebook",
      permalink: data.permalink_url ?? null,
      mediaUrl: data.full_picture ?? null,
      message: data.message ?? null,
      createdTime: data.created_time ?? null,
    },
  };
}

async function fetchInstagramPost(
  post: SocialPost,
  token: string,
): Promise<PlatformRefreshResult> {
  if (!post.igMediaId) throw new Error("Instagram medya ID bulunamadi");

  const fieldsWithComments = [
    "id",
    "caption",
    "media_type",
    "media_url",
    "permalink",
    "timestamp",
    "like_count",
    "comments_count",
    `comments.limit(${COMMENT_LIMIT}){id,text,timestamp,username,like_count}`,
  ].join(",");

  let data: any;
  try {
    data = await graphGet<any>(post.igMediaId, token, { fields: fieldsWithComments });
  } catch {
    data = await graphGet<any>(post.igMediaId, token, {
      fields: "id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count",
    });
  }

  const insightValues = await fetchInstagramInsightValues(post.igMediaId, token);
  const baseMetric = {
    platform: "instagram" as const,
    likes: toNumber(data.like_count),
    comments: toNumber(data.comments_count),
    shares: toNumber(insightValues.shares),
    saves: toNumber(insightValues.saved),
    reach: toNumber(insightValues.reach),
    impressions: toNumber(insightValues.impressions),
    clicks: 0,
  };

  const comments = Array.isArray(data.comments?.data)
    ? data.comments.data
        .filter((comment: any) => typeof comment?.id === "string")
        .map((comment: any): RemoteComment => ({
          platform: "instagram",
          externalCommentId: comment.id,
          authorName: typeof comment.username === "string" ? comment.username : null,
          message: typeof comment.text === "string" ? comment.text : "",
          likeCount: toNumber(comment.like_count),
          createdTime: parseDate(comment.timestamp),
        }))
    : [];

  return {
    metric: {
      ...baseMetric,
      engagementRate: calculateEngagementRate(baseMetric),
      fetchedAt: new Date(),
    },
    comments,
    remote: {
      platform: "instagram",
      permalink: data.permalink ?? null,
      mediaUrl: data.media_url ?? null,
      message: data.caption ?? null,
      createdTime: data.timestamp ?? null,
    },
  };
}

async function fetchInstagramInsightValues(mediaId: string, token: string) {
  try {
    const data = await graphGet<any>(`${mediaId}/insights`, token, {
      metric: "impressions,reach,saved,shares",
    });
    const result: Record<string, number> = {};
    for (const item of data.data || []) {
      if (typeof item?.name === "string") {
        result[item.name] = toNumber(item.values?.[0]?.value);
      }
    }
    return result;
  } catch {
    return {};
  }
}

async function saveMetric(postId: number, metric: NormalizedMetric) {
  await db.insert(postAnalytics).values({
    postId,
    platform: metric.platform,
    likes: metric.likes,
    comments: metric.comments,
    shares: metric.shares,
    saves: metric.saves,
    reach: metric.reach,
    impressions: metric.impressions,
    clicks: metric.clicks,
    engagementRate: metric.engagementRate.toFixed(2),
    fetchedAt: metric.fetchedAt,
  });
}

async function upsertComment(postId: number, comment: RemoteComment, fetchedAt: Date) {
  const [existing] = await db
    .select({ id: postComments.id })
    .from(postComments)
    .where(
      and(
        eq(postComments.postId, postId),
        eq(postComments.platform, comment.platform),
        eq(postComments.externalCommentId, comment.externalCommentId),
      ),
    )
    .limit(1);

  const values = {
    parentCommentId: comment.parentCommentId ?? null,
    authorName: comment.authorName ?? null,
    authorId: comment.authorId ?? null,
    message: comment.message,
    likeCount: comment.likeCount,
    createdTime: comment.createdTime,
    fetchedAt,
  };

  if (existing) {
    await db
      .update(postComments)
      .set(values)
      .where(eq(postComments.id, existing.id));
    return;
  }

  await db.insert(postComments).values({
    uuid: uuidv4(),
    postId,
    platform: comment.platform,
    externalCommentId: comment.externalCommentId,
    ...values,
  });
}

export async function refreshPostMetrics(postId: number) {
  await ensurePostCommentsTable();

  const post = await getPost(postId);
  if (!post) throw new Error("Post bulunamadi");

  const targets = resolveTargets(post);
  const analytics: NormalizedMetric[] = [];
  const remotes: RemotePostSnapshot[] = [];
  const errors: string[] = [];
  const fetchedAt = new Date();

  if (targets.length === 0) {
    errors.push("Bu kayitta Meta yayin ID'si bulunamadi");
  }

  for (const platform of targets) {
    const account = await getActiveAccount(post.subType, platform);
    const token = account ? resolveToken(account, platform) : null;
    if (!token) {
      errors.push(`${platform}: bagli hesap tokeni bulunamadi`);
      continue;
    }

    try {
      const result =
        platform === "facebook"
          ? await fetchFacebookPost(post, token)
          : await fetchInstagramPost(post, token);

      await saveMetric(post.id, { ...result.metric, fetchedAt });
      for (const comment of result.comments) {
        await upsertComment(post.id, comment, fetchedAt);
      }

      analytics.push({ ...result.metric, fetchedAt });
      remotes.push(result.remote);
    } catch (err) {
      errors.push(`${platform}: ${(err as Error).message}`);
    }
  }

  return {
    ok: analytics.length > 0 && errors.length === 0,
    postId,
    refreshedAt: fetchedAt,
    analytics,
    remotes,
    errors,
  };
}

export async function getPostDetails(postId: number, opts: { refresh?: boolean } = {}) {
  await ensurePostCommentsTable();

  let refreshResult: Awaited<ReturnType<typeof refreshPostMetrics>> | null = null;
  if (opts.refresh) {
    refreshResult = await refreshPostMetrics(postId);
  }

  const post = await getPost(postId);
  if (!post) throw new Error("Post bulunamadi");

  const analyticsRows = await db
    .select()
    .from(postAnalytics)
    .where(eq(postAnalytics.postId, postId))
    .orderBy(desc(postAnalytics.fetchedAt))
    .limit(40);

  const commentsRows = await db
    .select()
    .from(postComments)
    .where(eq(postComments.postId, postId))
    .orderBy(desc(postComments.createdTime), desc(postComments.fetchedAt))
    .limit(50);

  const latestByPlatform = new Map<Platform, ReturnType<typeof serializeMetric>>();
  for (const row of analyticsRows) {
    const platform = row.platform as Platform;
    if (!latestByPlatform.has(platform)) {
      latestByPlatform.set(platform, serializeMetric(row));
    }
  }

  return {
    post,
    analytics: Array.from(latestByPlatform.values()),
    analyticsHistory: analyticsRows.map(serializeMetric),
    comments: commentsRows.map(serializeComment),
    refreshed: refreshResult,
  };
}

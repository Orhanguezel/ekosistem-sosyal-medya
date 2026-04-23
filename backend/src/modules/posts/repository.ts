import { db } from "../../db/client";
import { socialPosts } from "../../db/schema";
import { eq, desc, asc, and, gte, lte, sql, type SQL } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import type { CreatePostInput, UpdatePostInput, ListPostsQuery } from "./validation";

export async function createPost(input: CreatePostInput) {
  const uuid = uuidv4();
  await db.insert(socialPosts).values({
    uuid,
    postType: input.postType,
    subType: input.tenantKey ?? null,
    title: input.title,
    caption: input.caption,
    hashtags: input.hashtags,
    imageUrl: input.imageUrl,
    imageLocal: input.imageLocal,
    linkUrl: input.linkUrl,
    linkText: input.linkText,
    platform: input.platform,
    scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
    status: input.scheduledAt ? "scheduled" : "draft",
    sourceType: input.sourceType,
    sourceRef: input.sourceRef,
    notes: input.notes,
  });

  return getPostByUuid(uuid);
}

export async function getPostById(id: number) {
  const rows = await db
    .select()
    .from(socialPosts)
    .where(eq(socialPosts.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function getPostByUuid(uuid: string) {
  const rows = await db
    .select()
    .from(socialPosts)
    .where(eq(socialPosts.uuid, uuid))
    .limit(1);
  return rows[0] ?? null;
}

export async function getPostBySourceRef(tenantKey: string, sourceRef: string) {
  const rows = await db
    .select()
    .from(socialPosts)
    .where(and(eq(socialPosts.subType, tenantKey), eq(socialPosts.sourceRef, sourceRef)))
    .limit(1);
  return rows[0] ?? null;
}

export async function listPosts(query: ListPostsQuery) {
  const conditions: SQL<unknown>[] = [];

  if (query.status) {
    conditions.push(eq(socialPosts.status, query.status));
  }
  if (query.platform) {
    conditions.push(eq(socialPosts.platform, query.platform));
  }
  if (query.postType) {
    conditions.push(eq(socialPosts.postType, query.postType));
  }
  if (query.tenantKey) {
    conditions.push(eq(socialPosts.subType, query.tenantKey));
  }
  if (query.from) {
    conditions.push(gte(socialPosts.createdAt, new Date(query.from)));
  }
  if (query.to) {
    conditions.push(lte(socialPosts.createdAt, new Date(query.to)));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const sortColumn =
    query.sort === "scheduled_at"
      ? socialPosts.scheduledAt
      : query.sort === "posted_at"
        ? socialPosts.postedAt
        : socialPosts.createdAt;

  const orderFn = query.order === "asc" ? asc : desc;

  const [rows, countResult] = await Promise.all([
    db
      .select()
      .from(socialPosts)
      .where(where)
      .orderBy(orderFn(sortColumn))
      .limit(query.limit)
      .offset(query.offset),
    db
      .select({ count: sql<number>`COUNT(*)` })
      .from(socialPosts)
      .where(where),
  ]);

  return {
    items: rows,
    total: Number(countResult[0]?.count ?? 0),
    limit: query.limit,
    offset: query.offset,
  };
}

export async function updatePost(id: number, input: UpdatePostInput) {
  const { scheduledAt, ...rest } = input;
  await db.update(socialPosts).set({
    ...rest,
    ...(scheduledAt !== undefined ? { scheduledAt: new Date(scheduledAt) } : {}),
  }).where(eq(socialPosts.id, id));
  return getPostById(id);
}

export async function deletePost(id: number) {
  await db.delete(socialPosts).where(eq(socialPosts.id, id));
}

export async function schedulePost(id: number, scheduledAt: string) {
  await db
    .update(socialPosts)
    .set({
      scheduledAt: new Date(scheduledAt),
      status: "scheduled",
    })
    .where(eq(socialPosts.id, id));
  return getPostById(id);
}

export async function cancelPost(id: number) {
  await db
    .update(socialPosts)
    .set({ status: "cancelled" })
    .where(eq(socialPosts.id, id));
  return getPostById(id);
}

export async function duplicatePost(id: number) {
  const original = await getPostById(id);
  if (!original) return null;

  return createPost({
    tenantKey: original.subType || "default",
    postType: original.postType,
    title: original.title ? `${original.title} (kopya)` : undefined,
    caption: original.caption,
    hashtags: original.hashtags ?? undefined,
    imageUrl: original.imageUrl ?? undefined,
    imageLocal: original.imageLocal ?? undefined,
    linkUrl: original.linkUrl ?? undefined,
    linkText: original.linkText ?? undefined,
    platform: original.platform,
    sourceType: original.sourceType,
    sourceRef: original.sourceRef ?? undefined,
    notes: original.notes ?? undefined,
  });
}

export async function getPostQueue(limit = 10) {
  return db
    .select()
    .from(socialPosts)
    .where(eq(socialPosts.status, "scheduled"))
    .orderBy(asc(socialPosts.scheduledAt))
    .limit(limit);
}

export async function getPostsDueForPublishing() {
  return db
    .select()
    .from(socialPosts)
    .where(
      and(
        eq(socialPosts.status, "scheduled"),
        lte(socialPosts.scheduledAt, new Date())
      )
    )
    .orderBy(asc(socialPosts.scheduledAt));
}

export async function markPostAsPublished(
  id: number,
  fbPostId?: string,
  igMediaId?: string
) {
  await db
    .update(socialPosts)
    .set({
      status: "posted",
      postedAt: new Date(),
      fbPostId: fbPostId ?? null,
      igMediaId: igMediaId ?? null,
    })
    .where(eq(socialPosts.id, id));
}

export async function markPostAsFailed(id: number, errorMessage: string) {
  await db
    .update(socialPosts)
    .set({
      status: "failed",
      errorMessage,
    })
    .where(eq(socialPosts.id, id));
}

export async function getPostStats(tenantKey?: string) {
  const result = await db
    .select({
      status: socialPosts.status,
      count: sql<number>`COUNT(*)`,
    })
    .from(socialPosts)
    .where(tenantKey ? eq(socialPosts.subType, tenantKey) : undefined)
    .groupBy(socialPosts.status);

  const stats: Record<string, number> = {};
  for (const row of result) {
    stats[row.status] = Number(row.count);
  }
  return stats;
}

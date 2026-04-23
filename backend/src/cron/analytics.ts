import { db } from "../db/client";
import { socialPosts, postAnalytics } from "../db/schema";
import { eq, and, gte, isNotNull } from "drizzle-orm";
import * as facebook from "../modules/platforms/facebook";
import * as instagram from "../modules/platforms/instagram";
import * as telegram from "../modules/platforms/telegram";

export async function collectAnalytics() {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Son 7 gundeki yayinlanmis postlari al
  const posts = await db
    .select()
    .from(socialPosts)
    .where(
      and(
        eq(socialPosts.status, "posted"),
        gte(socialPosts.postedAt, sevenDaysAgo)
      )
    );

  if (posts.length === 0) {
    console.log("[analytics] Analiz edilecek post yok");
    return;
  }

  console.log(`[analytics] ${posts.length} post icin metrik toplanıyor`);

  let totalLikes = 0;
  let totalComments = 0;

  for (const post of posts) {
    // Facebook metrikleri
    if (post.fbPostId) {
      try {
        const fbMetrics = await facebook.getPostInsights(post.fbPostId);
        await db.insert(postAnalytics).values({
          postId: post.id,
          platform: "facebook",
          likes: fbMetrics.likes,
          comments: fbMetrics.comments,
          shares: fbMetrics.shares,
          fetchedAt: new Date(),
        });
        totalLikes += fbMetrics.likes;
        totalComments += fbMetrics.comments;
      } catch (err) {
        console.warn(
          `[analytics] FB Post #${post.id} metrik hatasi:`,
          (err as Error).message
        );
      }
    }

    // Instagram metrikleri
    if (post.igMediaId) {
      try {
        const igMetrics = await instagram.getMediaInsights(post.igMediaId);
        await db.insert(postAnalytics).values({
          postId: post.id,
          platform: "instagram",
          likes: igMetrics.likes,
          comments: igMetrics.comments,
          saves: igMetrics.saves,
          reach: igMetrics.reach,
          impressions: igMetrics.impressions,
          fetchedAt: new Date(),
        });
        totalLikes += igMetrics.likes;
        totalComments += igMetrics.comments;
      } catch (err) {
        console.warn(
          `[analytics] IG Post #${post.id} metrik hatasi:`,
          (err as Error).message
        );
      }
    }
  }

  // Ozet bildirimi gonder
  const stats = await getQuickStats();
  await telegram.notifyDailySummary({
    ...stats,
    totalLikes,
    totalComments,
  });

  console.log(
    `[analytics] Tamamlandi. Toplam begeni: ${totalLikes}, yorum: ${totalComments}`
  );
}

async function getQuickStats() {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const allPosts = await db.select().from(socialPosts);

  const posted = allPosts.filter(
    (p) => p.status === "posted" && p.postedAt && p.postedAt >= todayStart
  ).length;

  const failed = allPosts.filter(
    (p) => p.status === "failed" && p.createdAt && p.createdAt >= todayStart
  ).length;

  const scheduled = allPosts.filter((p) => p.status === "scheduled").length;

  return { posted, failed, scheduled };
}

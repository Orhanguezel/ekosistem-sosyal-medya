import { db } from "../db/client";
import { socialPosts } from "../db/schema";
import { eq, and, gte } from "drizzle-orm";
import * as telegram from "../modules/platforms/telegram";
import { refreshPostMetrics } from "../modules/posts/insights";

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
    try {
      const result = await refreshPostMetrics(post.id);
      for (const metric of result.analytics) {
        totalLikes += metric.likes;
        totalComments += metric.comments;
      }
      if (result.errors.length > 0) {
        console.warn(`[analytics] Post #${post.id} kismi metrik uyarisi:`, result.errors.join("; "));
      }
    } catch (err) {
      console.warn(
        `[analytics] Post #${post.id} metrik hatasi:`,
        (err as Error).message
      );
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

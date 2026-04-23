import type { FastifyInstance } from "fastify";
import { db } from "../../db/client";
import { postAnalytics, socialPosts } from "../../db/schema";
import { eq, desc, sql, and, gte } from "drizzle-orm";

function buildSimplePdf(lines: string[]): Buffer {
  const escapePdf = (s: string) =>
    s.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");

  const content = [
    "BT /F1 12 Tf 50 780 Td",
    ...lines.flatMap((line, idx) =>
      idx === 0 ? [`(${escapePdf(line)}) Tj`] : ["0 -18 Td", `(${escapePdf(line)}) Tj`]
    ),
    "ET",
  ].join("\n");

  const objects: string[] = [];
  objects.push("1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj");
  objects.push("2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj");
  objects.push(
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj"
  );
  objects.push("4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj");
  objects.push(`5 0 obj << /Length ${content.length} >> stream\n${content}\nendstream endobj`);

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];
  for (const obj of objects) {
    offsets.push(pdf.length);
    pdf += `${obj}\n`;
  }
  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let i = 1; i < offsets.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  return Buffer.from(pdf, "utf-8");
}

export async function analyticsRoutes(app: FastifyInstance) {
  // Genel bakis
  app.get("/overview", async (_req, reply) => {
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [totalPosts, weekPosts, topPosts] = await Promise.all([
      db
        .select({ count: sql<number>`COUNT(*)` })
        .from(socialPosts)
        .where(eq(socialPosts.status, "posted")),
      db
        .select({ count: sql<number>`COUNT(*)` })
        .from(socialPosts)
        .where(
          and(
            eq(socialPosts.status, "posted"),
            gte(socialPosts.postedAt, sevenDaysAgo)
          )
        ),
      db
        .select()
        .from(postAnalytics)
        .orderBy(desc(postAnalytics.likes))
        .limit(5),
    ]);

    return reply.send({
      totalPosted: Number(totalPosts[0]?.count ?? 0),
      postedThisWeek: Number(weekPosts[0]?.count ?? 0),
      topPosts,
    });
  });

  // Post bazli metrikler
  app.get("/posts/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const metrics = await db
      .select()
      .from(postAnalytics)
      .where(eq(postAnalytics.postId, Number(id)))
      .orderBy(desc(postAnalytics.fetchedAt));
    return reply.send({ items: metrics });
  });

  // Platform bazli
  app.get("/platform/:platform", async (req, reply) => {
    const { platform } = req.params as { platform: string };
    const metrics = await db
      .select({
        totalLikes: sql<number>`SUM(${postAnalytics.likes})`,
        totalComments: sql<number>`SUM(${postAnalytics.comments})`,
        totalShares: sql<number>`SUM(${postAnalytics.shares})`,
        totalReach: sql<number>`SUM(${postAnalytics.reach})`,
        avgEngagement: sql<number>`AVG(${postAnalytics.engagementRate})`,
      })
      .from(postAnalytics)
      .where(
        eq(
          postAnalytics.platform,
          platform as "facebook" | "instagram"
        )
      );
    return reply.send(metrics[0] ?? {});
  });

  // En basarili postlar
  app.get("/top-posts", async (req, reply) => {
    const { limit = "10" } = req.query as { limit?: string };
    const topPosts = await db
      .select({
        postId: postAnalytics.postId,
        platform: postAnalytics.platform,
        likes: postAnalytics.likes,
        comments: postAnalytics.comments,
        shares: postAnalytics.shares,
        reach: postAnalytics.reach,
        engagementRate: postAnalytics.engagementRate,
      })
      .from(postAnalytics)
      .orderBy(desc(postAnalytics.engagementRate))
      .limit(Number(limit));
    return reply.send({ items: topPosts });
  });

  // Metrikleri guncelle (manuel tetikleme)
  app.post("/fetch", async (_req, reply) => {
    // TODO: FB/IG Insights API'den metrik cek
    return reply.send({
      message: "Analitik veri cekme henuz uygulanmadi",
    });
  });

  // Tenant bazli ozet
  app.get("/tenant-summary", async (req, reply) => {
    const tenantKey = String((req.query as any)?.tenantKey || "").trim();
    if (!tenantKey) return reply.status(400).send({ error: "tenantKey zorunlu" });

    const last30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [postCounts, analytics] = await Promise.all([
      db
        .select({
          status: socialPosts.status,
          count: sql<number>`COUNT(*)`,
        })
        .from(socialPosts)
        .where(and(eq(socialPosts.subType, tenantKey), gte(socialPosts.createdAt, last30)))
        .groupBy(socialPosts.status),
      db
        .select({
          likes: sql<number>`COALESCE(SUM(${postAnalytics.likes}),0)`,
          comments: sql<number>`COALESCE(SUM(${postAnalytics.comments}),0)`,
          shares: sql<number>`COALESCE(SUM(${postAnalytics.shares}),0)`,
          reach: sql<number>`COALESCE(SUM(${postAnalytics.reach}),0)`,
        })
        .from(postAnalytics)
        .innerJoin(socialPosts, eq(postAnalytics.postId, socialPosts.id))
        .where(eq(socialPosts.subType, tenantKey)),
    ]);

    return reply.send({ tenantKey, postCounts, analytics: analytics[0] ?? {} });
  });

  // Tenant bazli aylik rapor (CSV)
  app.get("/tenant-report.csv", async (req, reply) => {
    const tenantKey = String((req.query as any)?.tenantKey || "").trim();
    if (!tenantKey) return reply.status(400).send({ error: "tenantKey zorunlu" });

    const rows = await db
      .select({
        postId: socialPosts.id,
        status: socialPosts.status,
        platform: socialPosts.platform,
        createdAt: socialPosts.createdAt,
        likes: sql<number>`COALESCE(SUM(${postAnalytics.likes}),0)`,
        comments: sql<number>`COALESCE(SUM(${postAnalytics.comments}),0)`,
        reach: sql<number>`COALESCE(SUM(${postAnalytics.reach}),0)`,
      })
      .from(socialPosts)
      .leftJoin(postAnalytics, eq(postAnalytics.postId, socialPosts.id))
      .where(eq(socialPosts.subType, tenantKey))
      .groupBy(socialPosts.id);

    const header = "post_id,status,platform,created_at,likes,comments,reach";
    const lines = rows.map((r) =>
      [r.postId, r.status, r.platform, r.createdAt?.toISOString?.() ?? "", r.likes, r.comments, r.reach].join(",")
    );
    const csv = [header, ...lines].join("\n");

    reply.header("Content-Type", "text/csv; charset=utf-8");
    return reply.send(csv);
  });

  // Tenant bazli aylik rapor (PDF)
  app.get("/tenant-report.pdf", async (req, reply) => {
    const tenantKey = String((req.query as any)?.tenantKey || "").trim();
    if (!tenantKey) return reply.status(400).send({ error: "tenantKey zorunlu" });

    const summaryRows = await db
      .select({
        status: socialPosts.status,
        count: sql<number>`COUNT(*)`,
      })
      .from(socialPosts)
      .where(eq(socialPosts.subType, tenantKey))
      .groupBy(socialPosts.status);

    const analytics = await db
      .select({
        likes: sql<number>`COALESCE(SUM(${postAnalytics.likes}),0)`,
        comments: sql<number>`COALESCE(SUM(${postAnalytics.comments}),0)`,
        shares: sql<number>`COALESCE(SUM(${postAnalytics.shares}),0)`,
        reach: sql<number>`COALESCE(SUM(${postAnalytics.reach}),0)`,
      })
      .from(postAnalytics)
      .innerJoin(socialPosts, eq(postAnalytics.postId, socialPosts.id))
      .where(eq(socialPosts.subType, tenantKey));

    const lines = [
      `Tenant Report: ${tenantKey}`,
      `Date: ${new Date().toISOString()}`,
      " ",
      "Post Status Summary",
      ...summaryRows.map((r) => `- ${r.status}: ${r.count}`),
      " ",
      "Engagement Summary",
      `- Likes: ${analytics[0]?.likes ?? 0}`,
      `- Comments: ${analytics[0]?.comments ?? 0}`,
      `- Shares: ${analytics[0]?.shares ?? 0}`,
      `- Reach: ${analytics[0]?.reach ?? 0}`,
    ];

    const pdf = buildSimplePdf(lines);
    reply.header("Content-Type", "application/pdf");
    reply.header("Content-Disposition", `attachment; filename=\"tenant-report-${tenantKey}.pdf\"`);
    return reply.send(pdf);
  });
}

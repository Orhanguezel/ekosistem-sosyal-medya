import type { FastifyInstance } from "fastify";
import { z } from "zod";
import * as generator from "./generator";
import { HASHTAG_GROUPS } from "../../core/constants";

const generateCaptionSchema = z.object({
  tenantKey: z.string().trim().min(1).max(100).default("default"),
  title: z.string(),
  content: z.string().optional(),
  url: z.string().optional(),
});

const generatePostSchema = z.object({
  tenantKey: z.string().trim().min(1).max(100).default("default"),
  topic: z.string().optional(),
  postType: z.enum(["haber", "etkilesim", "ilan"]),
  data: z.record(z.string()).optional(),
  scheduledAt: z.string().datetime().optional(),
});

const engagementSchema = z.object({
  tenantKey: z.string().trim().min(1).max(100).default("default"),
  type: z.enum(["soru", "anket", "nostalji", "tartisma"]).default("soru"),
  topic: z.string().optional(),
});

export async function aiRoutes(app: FastifyInstance) {
  // Haber -> Caption uret
  app.post("/generate-caption", async (req, reply) => {
    const input = generateCaptionSchema.parse(req.body);
    try {
      const result = await generator.generateNewsCaption(
        input.tenantKey,
        input.title,
        input.content,
        input.url
      );
      return reply.send(result);
    } catch (err) {
      return reply.status(500).send({ error: (err as Error).message });
    }
  });

  // AI ile post uret ve kuyruge ekle
  app.post("/generate-post", async (req, reply) => {
    const input = generatePostSchema.parse(req.body);
    try {
      const result = await generator.generateAndQueuePost(
        input.tenantKey,
        input.postType,
        input.data || {},
        input.scheduledAt
      );
      return reply.send(result);
    } catch (err) {
      return reply.status(500).send({ error: (err as Error).message });
    }
  });

  // Haberi sosyal medya icerigine donustur
  app.post("/rewrite", async (req, reply) => {
    const { tenantKey, title, content, url } = req.body as {
      tenantKey?: string;
      title: string;
      content?: string;
      url?: string;
    };
    try {
      const result = await generator.generateNewsCaption(tenantKey || "default", title, content, url);
      return reply.send(result);
    } catch (err) {
      return reply.status(500).send({ error: (err as Error).message });
    }
  });

  // Hashtag onerisi
  app.post("/hashtags", async (req, reply) => {
    const { postType } = req.body as { postType?: string };
    const base = HASHTAG_GROUPS.temel;
    const specific =
      HASHTAG_GROUPS[postType as keyof typeof HASHTAG_GROUPS] || "";
    return reply.send({
      hashtags: `${base} ${specific}`.trim(),
      groups: HASHTAG_GROUPS,
    });
  });

  // Etkilesim postu uret
  app.post("/engagement-post", async (req, reply) => {
    const input = engagementSchema.parse(req.body);
    try {
      const result = await generator.generateEngagementPost(
        input.tenantKey,
        input.type,
        input.topic
      );
      return reply.send(result);
    } catch (err) {
      return reply.status(500).send({ error: (err as Error).message });
    }
  });

  // Ilan tanitim postu uret
  app.post("/listing-promo", async (req, reply) => {
    const { title, price, category, location, url } = req.body as {
      tenantKey?: string;
      title: string;
      price?: string;
      category?: string;
      location?: string;
      url?: string;
    };
    try {
      const result = await generator.generateListingPromo({
        tenantKey: (req.body as { tenantKey?: string }).tenantKey,
        title,
        price,
        category,
        location,
        url,
      });
      return reply.send(result);
    } catch (err) {
      return reply.status(500).send({ error: (err as Error).message });
    }
  });

  // Haftalik plan olustur
  app.post("/weekly-plan", async (req, reply) => {
    const { startDate, tenantKey } = req.body as { startDate?: string; tenantKey?: string };
    const start = startDate || new Date().toISOString().split("T")[0];
    try {
      const result = await generator.generateWeeklyPlan(tenantKey || "default", start);
      return reply.send(result);
    } catch (err) {
      return reply.status(500).send({ error: (err as Error).message });
    }
  });
}

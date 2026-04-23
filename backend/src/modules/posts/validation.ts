import { z } from "zod";

export const createPostSchema = z.object({
  tenantKey: z.string().trim().min(1).max(100),
  postType: z.enum([
    "haber",
    "etkilesim",
    "ilan",
    "nostalji",
    "tanitim",
    "kampanya",
  ]),
  title: z.string().max(255).optional(),
  caption: z.string().min(1).max(5000),
  hashtags: z.string().max(500).optional(),
  imageUrl: z.string().url().max(1000).optional(),
  imageLocal: z.string().max(500).optional(),
  linkUrl: z.string().url().max(1000).optional(),
  linkText: z.string().max(255).optional(),
  platform: z
    .enum(["facebook", "instagram", "both", "linkedin", "x", "telegram", "all"])
    .default("both"),
  scheduledAt: z.string().datetime().optional(),
  sourceType: z.enum(["manual", "news", "ai", "template"]).default("manual"),
  sourceRef: z.string().max(255).optional(),
  notes: z.string().optional(),
});

export const updatePostSchema = createPostSchema.partial();

export const schedulePostSchema = z.object({
  scheduledAt: z.string().datetime(),
});

export const listPostsSchema = z.object({
  tenantKey: z.string().trim().min(1).max(100).optional(),
  status: z
    .enum(["draft", "scheduled", "publishing", "posted", "failed", "cancelled"])
    .optional(),
  platform: z
    .enum(["facebook", "instagram", "both", "linkedin", "x", "telegram", "all"])
    .optional(),
  postType: z
    .enum([
      "haber",
      "etkilesim",
      "ilan",
      "nostalji",
      "tanitim",
      "kampanya",
    ])
    .optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
  sort: z
    .enum(["created_at", "scheduled_at", "posted_at"])
    .default("created_at"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
export type ListPostsQuery = z.infer<typeof listPostsSchema>;

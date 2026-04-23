import { z } from "zod";

export const createTemplateSchema = z.object({
  name: z.string().min(1).max(255),
  postType: z.enum([
    "haber",
    "etkilesim",
    "ilan",
    "nostalji",
    "tanitim",
    "kampanya",
  ]),
  platform: z
    .enum(["facebook", "instagram", "both", "linkedin", "x", "telegram", "all"])
    .default("both"),
  captionTemplate: z.string().min(1),
  hashtags: z.string().max(500).optional(),
  imagePrompt: z.string().max(500).optional(),
  variables: z.array(z.string()).optional(),
});

export const updateTemplateSchema = createTemplateSchema.partial();

export const generateFromTemplateSchema = z.object({
  variables: z.record(z.string()),
  platform: z
    .enum(["facebook", "instagram", "both", "linkedin", "x", "telegram", "all"])
    .optional(),
  scheduledAt: z.string().datetime().optional(),
});

export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;

import { z } from "zod";

export const createCalendarEntrySchema = z.object({
  tenantKey: z.string().min(1).max(100).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  timeSlot: z.enum(["morning", "afternoon", "evening"]).default("morning"),
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
  notes: z.string().optional(),
  templateId: z.number().optional(),
});

export const updateCalendarEntrySchema = createCalendarEntrySchema.partial();

export type CreateCalendarInput = z.infer<typeof createCalendarEntrySchema>;
export type UpdateCalendarInput = z.infer<typeof updateCalendarEntrySchema>;

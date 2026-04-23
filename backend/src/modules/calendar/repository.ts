import { db } from "../../db/client";
import { campaignCalendar } from "../../db/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { WEEKLY_VARIETY_MATRIX } from "../../core/constants";
import type { CreateCalendarInput, UpdateCalendarInput } from "./validation";

function parseDateValue(value: string): Date {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Gecersiz tarih");
  }
  return date;
}

export async function createEntry(input: CreateCalendarInput & { tenantKey?: string }) {
  const uuid = uuidv4();
  await db.insert(campaignCalendar).values({
    uuid,
    tenantKey: input.tenantKey ?? "default",
    date: parseDateValue(input.date),
    timeSlot: input.timeSlot,
    postType: input.postType,
    platform: input.platform,
    notes: input.notes,
    templateId: input.templateId,
  });
  return getEntryByUuid(uuid);
}

export async function getEntryById(id: number) {
  const rows = await db
    .select()
    .from(campaignCalendar)
    .where(eq(campaignCalendar.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function getEntryByUuid(uuid: string) {
  const rows = await db
    .select()
    .from(campaignCalendar)
    .where(eq(campaignCalendar.uuid, uuid))
    .limit(1);
  return rows[0] ?? null;
}

export async function listByDateRange(from: string, to: string, tenantKey?: string) {
  const normalizedTenantKey = typeof tenantKey === "string" ? tenantKey.trim() || undefined : undefined;
  const conditions = [
    gte(campaignCalendar.date, parseDateValue(from)),
    lte(campaignCalendar.date, parseDateValue(to)),
    ...(normalizedTenantKey ? [eq(campaignCalendar.tenantKey, normalizedTenantKey)] : []),
  ];
  return db
    .select()
    .from(campaignCalendar)
    .where(and(...conditions))
    .orderBy(campaignCalendar.date);
}

export async function getByDate(date: string, tenantKey?: string) {
  const normalizedTenantKey = typeof tenantKey === "string" ? tenantKey.trim() || undefined : undefined;
  const conditions = [
    eq(campaignCalendar.date, parseDateValue(date)),
    ...(normalizedTenantKey ? [eq(campaignCalendar.tenantKey, normalizedTenantKey)] : []),
  ];
  return db
    .select()
    .from(campaignCalendar)
    .where(and(...conditions))
    .orderBy(
      sql`FIELD(${campaignCalendar.timeSlot}, 'morning', 'afternoon', 'evening')`
    );
}

export async function updateEntry(id: number, input: UpdateCalendarInput) {
  const { date, ...rest } = input;
  await db
    .update(campaignCalendar)
    .set({
      ...rest,
      ...(date !== undefined ? { date: parseDateValue(date) } : {}),
    })
    .where(eq(campaignCalendar.id, id));
  return getEntryById(id);
}

export async function deleteEntry(id: number) {
  await db.delete(campaignCalendar).where(eq(campaignCalendar.id, id));
}

export async function linkPost(id: number, postId: number) {
  await db
    .update(campaignCalendar)
    .set({ postId, status: "content_ready" })
    .where(eq(campaignCalendar.id, id));
  return getEntryById(id);
}

export async function generateWeekPlan(startDate: string, tenantKey: string = "default") {
  const entries: (CreateCalendarInput & { tenantKey: string })[] = [];
  const start = new Date(startDate);

  for (let i = 0; i < 7; i++) {
    const date = new Date(start);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split("T")[0];

    const dow = date.getDay();
    const matrixIdx = dow === 0 ? 6 : dow - 1;
    const dayPlan = WEEKLY_VARIETY_MATRIX[matrixIdx];

    entries.push({
      tenantKey,
      date: dateStr,
      timeSlot: "morning",
      postType: dayPlan.morning.type as any,
      platform: "both",
      notes: `sub_type: ${dayPlan.morning.sub}`,
    });

    entries.push({
      tenantKey,
      date: dateStr,
      timeSlot: "afternoon",
      postType: dayPlan.afternoon.type as any,
      platform: "both",
      notes: `sub_type: ${dayPlan.afternoon.sub}`,
    });

    entries.push({
      tenantKey,
      date: dateStr,
      timeSlot: "evening",
      postType: dayPlan.evening.type as any,
      platform: "both",
      notes: `sub_type: ${dayPlan.evening.sub}`,
    });
  }

  const results: NonNullable<Awaited<ReturnType<typeof createEntry>>>[] = [];
  for (const entry of entries) {
    try {
      const created = await createEntry(entry);
      if (created) results.push(created);
    } catch {
      // uk_tenant_date_slot constraint — slot zaten dolu, atla
    }
  }

  return results;
}

import { db } from "../../db/client";
import { contentTemplates } from "../../db/schema";
import { eq, sql, and, isNull, or } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import type { CreateTemplateInput, UpdateTemplateInput } from "./validation";

export async function createTemplate(input: CreateTemplateInput & { tenantKey?: string }) {
  const uuid = uuidv4();
  await db.insert(contentTemplates).values({
    uuid,
    tenantKey: input.tenantKey ?? null,
    name: input.name,
    postType: input.postType,
    platform: input.platform,
    captionTemplate: input.captionTemplate,
    hashtags: input.hashtags,
    imagePrompt: input.imagePrompt,
    variables: input.variables ?? [],
  });
  return getTemplateByUuid(uuid);
}

export async function getTemplateById(id: number) {
  const rows = await db
    .select()
    .from(contentTemplates)
    .where(eq(contentTemplates.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function getTemplateByUuid(uuid: string) {
  const rows = await db
    .select()
    .from(contentTemplates)
    .where(eq(contentTemplates.uuid, uuid))
    .limit(1);
  return rows[0] ?? null;
}

export async function listTemplates(postType?: string, tenantKey?: string) {
  const normalizedTenantKey = typeof tenantKey === "string" ? tenantKey.trim() || undefined : undefined;

  // Tenant filtresi: tenantKey'e ait + global (tenant_key IS NULL) sablonlari goster
  const tenantCondition = normalizedTenantKey
    ? or(eq(contentTemplates.tenantKey, normalizedTenantKey), isNull(contentTemplates.tenantKey))
    : undefined;

  if (postType) {
    const postTypeCondition = eq(
      contentTemplates.postType,
      postType as typeof contentTemplates.postType.enumValues[number]
    );
    return db
      .select()
      .from(contentTemplates)
      .where(tenantCondition ? and(postTypeCondition, tenantCondition) : postTypeCondition);
  }
  if (tenantCondition) {
    return db.select().from(contentTemplates).where(tenantCondition);
  }
  return db.select().from(contentTemplates);
}

export async function updateTemplate(id: number, input: UpdateTemplateInput) {
  await db.update(contentTemplates).set(input).where(eq(contentTemplates.id, id));
  return getTemplateById(id);
}

export async function deleteTemplate(id: number) {
  await db.delete(contentTemplates).where(eq(contentTemplates.id, id));
}

export async function incrementUsageCount(id: number) {
  await db
    .update(contentTemplates)
    .set({
      usageCount: sql`${contentTemplates.usageCount} + 1`,
      lastUsedAt: new Date(),
    })
    .where(eq(contentTemplates.id, id));
}

export function renderTemplate(
  template: string,
  variables: Record<string, string>
): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replaceAll(`{{${key}}}`, value);
  }
  return result;
}

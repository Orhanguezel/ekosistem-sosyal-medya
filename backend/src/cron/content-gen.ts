import { db } from "../db/client";
import { campaignCalendar } from "../db/schema";
import { eq, and } from "drizzle-orm";
import * as generator from "../modules/ai/generator";
import * as postRepo from "../modules/posts/repository";
import { listActiveTenants } from "../modules/tenants/service";
import { SLOT_TIMES } from "../core/constants";

async function generateForTenant(tenantKey: string, today: string) {
  const entries = await db
    .select()
    .from(campaignCalendar)
    .where(
      and(
        eq(campaignCalendar.tenantKey, tenantKey),
        eq(campaignCalendar.date, new Date(today)),
        eq(campaignCalendar.status, "planned")
      )
    );

  if (entries.length === 0) return;

  console.log(`[content-gen:${tenantKey}] ${entries.length} slot icin icerik uretiliyor`);

  for (const entry of entries) {
    try {
      const postType = entry.postType as "haber" | "etkilesim" | "ilan";
      if (!["haber", "etkilesim", "ilan"].includes(postType)) {
        console.log(`[content-gen:${tenantKey}] ${postType} tipi icin AI uretimi atlanıyor`);
        continue;
      }

      const data: Record<string, string> = {};
      if (postType === "etkilesim") {
        data.type = "soru";
      }

      const slotTime = SLOT_TIMES[entry.timeSlot] || "09:00";
      const scheduledAt = `${today}T${slotTime}:00.000Z`;

      const result = await generator.generateAndQueuePost(tenantKey, postType, data, scheduledAt);

      if (result.post) {
        await db
          .update(campaignCalendar)
          .set({ postId: result.post.id, status: "content_ready" })
          .where(eq(campaignCalendar.id, entry.id));

        console.log(`[content-gen:${tenantKey}] ${entry.timeSlot} slotu icin post #${result.post.id} olusturuldu`);
      }
    } catch (err) {
      console.error(
        `[content-gen:${tenantKey}] Slot ${entry.timeSlot} icin hata:`,
        (err as Error).message
      );
    }
  }
}

export async function generateDailyContent() {
  const today = new Date().toISOString().split("T")[0];

  try {
    const tenants = await listActiveTenants();
    if (tenants.length === 0) {
      console.log("[content-gen] Aktif tenant yok");
      return;
    }

    for (const tenant of tenants) {
      await generateForTenant(tenant.key, today!);
    }
  } catch (err) {
    console.error("[content-gen] Genel hata:", (err as Error).message);
  }
}

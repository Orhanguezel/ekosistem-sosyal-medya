import { db } from "../db/client";
import { platformAccounts } from "../db/schema";
import { and, eq, lte } from "drizzle-orm";

export async function checkPlatformTokenHealth() {
  const in7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const expiring = await db
    .select()
    .from(platformAccounts)
    .where(and(eq(platformAccounts.isActive, 1), lte(platformAccounts.tokenExpires, in7Days)));

  for (const acc of expiring) {
    await db
      .update(platformAccounts)
      .set({
        lastError: "Token expiry yaklasiyor",
        errorCount: (acc.errorCount ?? 0) + 1,
      })
      .where(eq(platformAccounts.id, acc.id));
  }
}

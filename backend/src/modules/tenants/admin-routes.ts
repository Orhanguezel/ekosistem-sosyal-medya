import type { FastifyInstance } from "fastify";
import { randomUUID } from "crypto";
import { db } from "@/db/client";
import { socialProjects, tenantUserRoles } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { defaultTenantBranding, getTenantByKey, updateTenantBranding } from "./service";

export async function tenantAdminRoutes(app: FastifyInstance) {
  app.post("/onboard", async (req, reply) => {
    const body = req.body as {
      key?: string;
      name?: string;
      websiteUrl?: string;
      appName?: string;
      loginSubtitle?: string;
      defaultHashtags?: string;
    };
    if (!body?.key || !body?.name) {
      return reply.status(400).send({ error: "key ve name zorunlu" });
    }

    const branding = {
      ...defaultTenantBranding({
        name: body.appName?.trim() || body.name,
        websiteUrl: body.websiteUrl || null,
      }),
      ...(body.loginSubtitle?.trim() ? { loginSubtitle: body.loginSubtitle.trim() } : {}),
      ...(body.defaultHashtags?.trim() ? { defaultHashtags: body.defaultHashtags.trim() } : {}),
    };

    await db.insert(socialProjects).values({
      uuid: randomUUID(),
      key: body.key,
      name: body.name,
      websiteUrl: body.websiteUrl || null,
      marketingJson: {
        branding,
      },
      isActive: 1,
    });

    return reply.send({ ok: true });
  });

  app.patch("/:tenantKey/profile", async (req, reply) => {
    const { tenantKey } = req.params as { tenantKey: string };
    const body = req.body as {
      name?: string | null;
      websiteUrl?: string | null;
      appName?: string | null;
      appSubtitle?: string | null;
      loginTitle?: string | null;
      loginSubtitle?: string | null;
      logoUrl?: string | null;
      faviconUrl?: string | null;
      faviconIcoUrl?: string | null;
      primaryColor?: string | null;
      accentColor?: string | null;
      defaultLinkUrl?: string | null;
      defaultHashtags?: string | null;
      sector?: string | null;
      audience?: string | null;
      contentSourceLabel?: string | null;
    };

    const tenant = await getTenantByKey(tenantKey);
    if (!tenant) return reply.status(404).send({ error: "Tenant bulunamadi" });

    if (body.name !== undefined || body.websiteUrl !== undefined) {
      await db
        .update(socialProjects)
        .set({
          name: body.name !== undefined ? body.name || tenant.name : tenant.name,
          websiteUrl:
            body.websiteUrl !== undefined ? body.websiteUrl || null : tenant.websiteUrl,
        })
        .where(eq(socialProjects.id, tenant.id));
    }

    const updated = await updateTenantBranding(tenantKey, {
      appName: body.appName ?? undefined,
      appSubtitle: body.appSubtitle ?? undefined,
      loginTitle: body.loginTitle ?? undefined,
      loginSubtitle: body.loginSubtitle ?? undefined,
      logoUrl: body.logoUrl ?? undefined,
      faviconUrl: body.faviconUrl ?? undefined,
      faviconIcoUrl: body.faviconIcoUrl ?? undefined,
      primaryColor: body.primaryColor ?? undefined,
      accentColor: body.accentColor ?? undefined,
      defaultLinkUrl: body.defaultLinkUrl ?? undefined,
      defaultHashtags: body.defaultHashtags ?? undefined,
      sector: body.sector ?? undefined,
      audience: body.audience ?? undefined,
      contentSourceLabel: body.contentSourceLabel ?? undefined,
    });

    return reply.send({ ok: true, item: updated });
  });

  app.get("/:tenantKey/roles", async (req, reply) => {
    const { tenantKey } = req.params as { tenantKey: string };
    const items = await db
      .select()
      .from(tenantUserRoles)
      .where(eq(tenantUserRoles.tenantKey, tenantKey));
    return reply.send({ items });
  });

  app.post("/:tenantKey/roles", async (req, reply) => {
    const { tenantKey } = req.params as { tenantKey: string };
    const { userId, role } = req.body as { userId?: string; role?: "tenant_admin" | "tenant_editor" };
    if (!userId || !role) return reply.status(400).send({ error: "userId ve role zorunlu" });

    const [existing] = await db
      .select()
      .from(tenantUserRoles)
      .where(and(eq(tenantUserRoles.userId, userId), eq(tenantUserRoles.tenantKey, tenantKey)))
      .limit(1);

    if (existing) {
      await db
        .update(tenantUserRoles)
        .set({ role })
        .where(eq(tenantUserRoles.id, existing.id));
    } else {
      await db.insert(tenantUserRoles).values({
        id: randomUUID(),
        userId,
        tenantKey,
        role,
      });
    }

    return reply.send({ ok: true });
  });
}

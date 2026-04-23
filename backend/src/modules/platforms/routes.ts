import type { FastifyInstance } from "fastify";
import { db } from "../../db/client";
import { platformAccounts, socialPosts } from "../../db/schema";
import { and, eq, desc } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { env } from "../../core/env";
import * as facebook from "./facebook";
import * as instagram from "./instagram";
import * as linkedin from "./linkedin";
import * as xPlatform from "./x";
import * as telegram from "./telegram";
import * as publisher from "./publisher";

export async function platformsRoutes(app: FastifyInstance) {
  const tenantKeyFrom = (raw: unknown): string => {
    const v = typeof raw === "string" ? raw.trim() : "";
    if (!v) throw new Error("tenantKey zorunlu");
    return v;
  };

  const upsertPlatformAccount = async (params: {
    tenantKey: string;
    platform: "facebook" | "instagram" | "telegram" | "linkedin" | "x";
    accountName: string;
    accountId?: string | null;
    accessToken?: string | null;
    refreshToken?: string | null;
    pageId?: string | null;
    pageToken?: string | null;
    tokenExpires?: Date | null;
  }) => {
    const [existing] = await db
      .select()
      .from(platformAccounts)
      .where(and(eq(platformAccounts.tenantKey, params.tenantKey), eq(platformAccounts.platform, params.platform)))
      .limit(1);

    if (existing) {
      await db
        .update(platformAccounts)
        .set({
          accountName: params.accountName,
          accountId: params.accountId ?? null,
          accessToken: params.accessToken ?? null,
          refreshToken: params.refreshToken ?? null,
          pageId: params.pageId ?? null,
          pageToken: params.pageToken ?? null,
          tokenExpires: params.tokenExpires ?? null,
          isActive: 1,
        })
        .where(eq(platformAccounts.id, existing.id));
      return;
    }

    await db.insert(platformAccounts).values({
      uuid: uuidv4(),
      tenantKey: params.tenantKey,
      platform: params.platform,
      accountName: params.accountName,
      accountId: params.accountId ?? null,
      accessToken: params.accessToken ?? null,
      refreshToken: params.refreshToken ?? null,
      pageId: params.pageId ?? null,
      pageToken: params.pageToken ?? null,
      tokenExpires: params.tokenExpires ?? null,
      isActive: 1,
    });
  };

  app.get("/", async (req, reply) => {
    const tenantKey = tenantKeyFrom((req.query as any)?.tenantKey);
    const items = await db.select().from(platformAccounts).where(eq(platformAccounts.tenantKey, tenantKey));
    return reply.send({ items });
  });

  app.get("/status", async (req, reply) => {
    const tenantKey = typeof (req.query as any)?.tenantKey === "string" ? (req.query as any).tenantKey : undefined;
    return reply.send(await publisher.checkPlatformStatus(tenantKey));
  });

  app.get("/errors", async (req, reply) => {
    const tenantKey = tenantKeyFrom((req.query as any)?.tenantKey);
    const items = await db
      .select()
      .from(socialPosts)
      .where(and(eq(socialPosts.subType, tenantKey), eq(socialPosts.status, "failed")))
      .orderBy(desc(socialPosts.updatedAt))
      .limit(50);
    return reply.send({ items });
  });

  app.get("/:id/status", async (req, reply) => {
    const { id } = req.params as { id: string };
    const [row] = await db.select().from(platformAccounts).where(eq(platformAccounts.id, Number(id))).limit(1);
    if (!row) return reply.status(404).send({ error: "Platform bulunamadi" });
    return reply.send({ ...row, tokenValid: row.tokenExpires ? new Date(row.tokenExpires) > new Date() : false });
  });

  app.post("/facebook/connect", async (req, reply) => {
    const { tenantKey, pageAccessToken, pageName, pageId } = req.body as any;
    if (!pageAccessToken) return reply.status(400).send({ error: "pageAccessToken gerekli" });

    let finalToken = pageAccessToken;
    try {
      finalToken = (await facebook.exchangeForLongLivedToken(pageAccessToken)).access_token;
    } catch {}

    await upsertPlatformAccount({
      tenantKey: tenantKeyFrom(tenantKey),
      platform: "facebook",
      accountName: pageName || "Facebook",
      accountId: pageId || null,
      pageId: pageId || null,
      pageToken: finalToken,
      accessToken: finalToken,
    });
    return reply.send({ ok: true });
  });

  app.post("/instagram/connect", async (req, reply) => {
    const { tenantKey, accessToken, accountId, accountName } = req.body as any;
    if (!accessToken || !accountId) return reply.status(400).send({ error: "accessToken ve accountId gerekli" });
    await upsertPlatformAccount({
      tenantKey: tenantKeyFrom(tenantKey),
      platform: "instagram",
      accountName: accountName || "Instagram",
      accountId,
      accessToken,
    });
    return reply.send({ ok: true });
  });

  app.post("/linkedin/connect", async (req, reply) => {
    const { tenantKey, accessToken, authorUrn, accountName } = req.body as any;
    if (!accessToken || !authorUrn) return reply.status(400).send({ error: "accessToken ve authorUrn gerekli" });
    await upsertPlatformAccount({
      tenantKey: tenantKeyFrom(tenantKey),
      platform: "linkedin",
      accountName: accountName || "LinkedIn",
      accountId: authorUrn,
      accessToken,
    });
    return reply.send({ ok: true });
  });

  app.post("/x/connect", async (req, reply) => {
    const { tenantKey, bearerToken, userId, accountName } = req.body as any;
    if (!bearerToken) return reply.status(400).send({ error: "bearerToken gerekli" });
    await upsertPlatformAccount({
      tenantKey: tenantKeyFrom(tenantKey),
      platform: "x",
      accountName: accountName || "X",
      accountId: userId || null,
      accessToken: bearerToken,
    });
    return reply.send({ ok: true });
  });

  app.post("/manual/connect", async (req, reply) => {
    const { tenantKey, platform, accountName, accountId, accessToken, refreshToken, pageId, pageToken } = req.body as any;
    if (!platform) return reply.status(400).send({ error: "platform gerekli" });
    await upsertPlatformAccount({
      tenantKey: tenantKeyFrom(tenantKey),
      platform,
      accountName: accountName || platform,
      accountId: accountId || null,
      accessToken: accessToken || null,
      refreshToken: refreshToken || null,
      pageId: pageId || null,
      pageToken: pageToken || null,
    });
    return reply.send({ ok: true });
  });

  app.get("/linkedin/auth-url", async (req, reply) => {
    const tenantKey = tenantKeyFrom((req.query as any)?.tenantKey);
    if (!env.LINKEDIN_CLIENT_ID || !env.LINKEDIN_REDIRECT_URI) return reply.status(400).send({ error: "LinkedIn OAuth env eksik" });
    const url = linkedin.buildLinkedInAuthUrl({
      clientId: env.LINKEDIN_CLIENT_ID,
      redirectUri: env.LINKEDIN_REDIRECT_URI,
      state: tenantKey,
    });
    return reply.send({ url });
  });

  app.post("/linkedin/callback", async (req, reply) => {
    const { tenantKey, code, authorUrn, accountName, redirectUri } = req.body as any;
    if (!code) return reply.status(400).send({ error: "code gerekli" });
    if (!env.LINKEDIN_CLIENT_ID || !env.LINKEDIN_CLIENT_SECRET) return reply.status(400).send({ error: "LinkedIn OAuth env eksik" });
    const token = await linkedin.exchangeCodeForToken({
      clientId: env.LINKEDIN_CLIENT_ID,
      clientSecret: env.LINKEDIN_CLIENT_SECRET,
      code,
      redirectUri: redirectUri || env.LINKEDIN_REDIRECT_URI,
    });
    let urn = typeof authorUrn === "string" ? authorUrn.trim() : "";
    let displayName = typeof accountName === "string" ? accountName.trim() : "";
    if (!urn) {
      const id = await linkedin.getLinkedInUserIdentity(token.access_token);
      urn = id.urn;
      if (!displayName) displayName = id.name;
    }
    await upsertPlatformAccount({
      tenantKey: tenantKeyFrom(tenantKey),
      platform: "linkedin",
      accountName: displayName || "LinkedIn",
      accountId: urn,
      accessToken: token.access_token,
      refreshToken: token.refresh_token ?? null,
      tokenExpires: token.expires_in ? new Date(Date.now() + token.expires_in * 1000) : null,
    });
    return reply.send({ ok: true });
  });

  app.get("/x/auth-url", async (req, reply) => {
    const tenantKey = tenantKeyFrom((req.query as any)?.tenantKey);
    const codeChallenge = String((req.query as any)?.codeChallenge || "").trim();
    if (!env.X_CLIENT_ID || !env.X_REDIRECT_URI) return reply.status(400).send({ error: "X OAuth env eksik" });
    if (!codeChallenge) return reply.status(400).send({ error: "codeChallenge gerekli" });
    const url = xPlatform.buildXAuthUrl({
      clientId: env.X_CLIENT_ID,
      redirectUri: env.X_REDIRECT_URI,
      state: tenantKey,
      codeChallenge,
    });
    return reply.send({ url });
  });

  app.post("/x/callback", async (req, reply) => {
    const { tenantKey, code, codeVerifier, userId, accountName, redirectUri } = req.body as any;
    if (!code || !codeVerifier) return reply.status(400).send({ error: "code ve codeVerifier gerekli" });
    if (!env.X_CLIENT_ID || !env.X_CLIENT_SECRET) return reply.status(400).send({ error: "X OAuth env eksik" });
    const token = await xPlatform.exchangeCodeForToken({
      clientId: env.X_CLIENT_ID,
      clientSecret: env.X_CLIENT_SECRET,
      code,
      codeVerifier,
      redirectUri: redirectUri || env.X_REDIRECT_URI,
    });
    let uid = typeof userId === "string" ? userId.trim() : "";
    let displayName = typeof accountName === "string" ? accountName.trim() : "";
    if (!uid) {
      const me = await xPlatform.getOAuth2Me(token.access_token);
      uid = me.id;
      if (!displayName) {
        displayName = me.name ?? (me.username ? `@${me.username}` : "X");
      }
    }
    await upsertPlatformAccount({
      tenantKey: tenantKeyFrom(tenantKey),
      platform: "x",
      accountName: displayName || "X",
      accountId: uid,
      accessToken: token.access_token,
      refreshToken: token.refresh_token ?? null,
      tokenExpires: token.expires_in ? new Date(Date.now() + token.expires_in * 1000) : null,
    });
    return reply.send({ ok: true });
  });

  app.post("/facebook/test", async (req, reply) => {
    try {
      const tenantKey = tenantKeyFrom((req.body as any)?.tenantKey);
      const accounts = await db.select().from(platformAccounts).where(eq(platformAccounts.tenantKey, tenantKey));
      const fb = accounts.find((a) => a.platform === "facebook");
      if (!fb?.pageId || !fb.accessToken) return reply.status(400).send({ error: "Tenant icin Facebook hesabi bulunamadi" });
      const result = await facebook.publishTextPost("🧪 Test", undefined, { pageId: fb.pageId, pageAccessToken: fb.accessToken });
      return reply.send({ ok: true, postId: result.id });
    } catch (err) {
      return reply.status(400).send({ error: (err as Error).message });
    }
  });

  app.post("/instagram/test", async (req, reply) => {
    const { tenantKey, imageUrl } = req.body as any;
    const img = (typeof imageUrl === "string" && imageUrl.trim()) || env.IG_TEST_IMAGE_URL?.trim();
    if (!img) return reply.status(400).send({ error: "imageUrl gerekli veya IG_TEST_IMAGE_URL .env ile tanimlayin" });
    try {
      const tk = tenantKeyFrom(tenantKey);
      const accounts = await db.select().from(platformAccounts).where(eq(platformAccounts.tenantKey, tk));
      const ig = accounts.find((a) => a.platform === "instagram");
      if (!ig?.accountId || !ig.accessToken) return reply.status(400).send({ error: "Tenant icin Instagram hesabi bulunamadi" });
      const result = await instagram.publishPhotoPost(img, "🧪 Test", { accountId: ig.accountId, accessToken: ig.accessToken });
      return reply.send({ ok: true, mediaId: result.id });
    } catch (err) {
      return reply.status(400).send({ error: (err as Error).message });
    }
  });

  app.post("/linkedin/test", async (req, reply) => {
    try {
      const tenantKey = tenantKeyFrom((req.body as any)?.tenantKey);
      const result = await publisher.publishLinkedInPost(tenantKey, "Ekosistem SaaS LinkedIn test postu");
      return reply.send({ ok: true, postId: result.id });
    } catch (err) {
      return reply.status(400).send({ error: (err as Error).message });
    }
  });

  app.post("/x/test", async (req, reply) => {
    try {
      const tenantKey = tenantKeyFrom((req.body as any)?.tenantKey);
      const result = await publisher.publishXPost(tenantKey, "Ekosistem SaaS X test postu");
      return reply.send({ ok: true, postId: result.id });
    } catch (err) {
      return reply.status(400).send({ error: (err as Error).message });
    }
  });

  app.post("/telegram/test", async (_req, reply) => {
    const ok = await telegram.sendMessage("🧪 <b>Sosyal Medya Paneli Test</b>");
    return reply.send({ ok });
  });

  app.get("/facebook/info", async (_req, reply) => {
    try {
      return reply.send(await facebook.getPageInfo());
    } catch (err) {
      return reply.status(400).send({ error: (err as Error).message });
    }
  });

  app.get("/instagram/info", async (_req, reply) => {
    try {
      return reply.send(await instagram.getAccountInfo());
    } catch (err) {
      return reply.status(400).send({ error: (err as Error).message });
    }
  });

  app.get("/linkedin/info", async (req, reply) => {
    try {
      const tenantKey = tenantKeyFrom((req.query as any)?.tenantKey);
      const accounts = await db.select().from(platformAccounts).where(eq(platformAccounts.tenantKey, tenantKey));
      const acc = accounts.find((a) => a.platform === "linkedin");
      if (!acc?.accessToken) return reply.status(404).send({ error: "LinkedIn hesabi yok" });
      return reply.send(await linkedin.getAccountInfo(acc.accessToken));
    } catch (err) {
      return reply.status(400).send({ error: (err as Error).message });
    }
  });

  app.get("/x/info", async (req, reply) => {
    try {
      const tenantKey = tenantKeyFrom((req.query as any)?.tenantKey);
      const accounts = await db.select().from(platformAccounts).where(eq(platformAccounts.tenantKey, tenantKey));
      const acc = accounts.find((a) => a.platform === "x");
      if (!acc?.accessToken || !acc.accountId) return reply.status(404).send({ error: "X hesabi yok veya userId eksik" });
      return reply.send(await xPlatform.getAccountInfo(acc.accessToken, acc.accountId));
    } catch (err) {
      return reply.status(400).send({ error: (err as Error).message });
    }
  });

  app.post("/facebook/refresh-token", async (req, reply) => {
    const { token } = req.body as { token?: string };
    if (!token) return reply.status(400).send({ error: "token gerekli" });
    try {
      return reply.send(await facebook.exchangeForLongLivedToken(token));
    } catch (err) {
      return reply.status(400).send({ error: (err as Error).message });
    }
  });

  app.delete("/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    await db.delete(platformAccounts).where(eq(platformAccounts.id, Number(id)));
    return reply.send({ ok: true });
  });
}

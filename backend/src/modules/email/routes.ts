import type { FastifyInstance } from "fastify";
import { db } from "../../db/client";
import { socialProjects } from "../../db/schema";
import { eq } from "drizzle-orm";
import {
  getInboxMessage,
  listInboxMessages,
  maskSettings,
  mergeEmailSettings,
  sendSmtpMail,
} from "./service";
import type { TenantEmailSettings } from "./types";
import { getProjectMarketing, normalizeBranding } from "../tenants/service";

function tenantKeyFrom(raw: unknown): string {
  const v = typeof raw === "string" ? raw.trim() : "";
  return v;
}

function requireTenantKey(reply: { status: (code: number) => { send: (body: unknown) => unknown } }, raw: unknown) {
  const tenantKey = tenantKeyFrom(raw);
  if (!tenantKey) {
    reply.status(400).send({ error: "tenantKey zorunlu" });
    return null;
  }
  return tenantKey;
}

async function loadSettings(tenantKey: string): Promise<TenantEmailSettings | null> {
  const [row] = await db.select().from(socialProjects).where(eq(socialProjects.key, tenantKey)).limit(1);
  if (!row) return null;
  return (row.emailSettings as TenantEmailSettings | null) ?? null;
}

export async function emailRoutes(app: FastifyInstance) {
  app.get("/settings", async (req, reply) => {
    const tenantKey = requireTenantKey(reply, (req.query as { tenantKey?: string })?.tenantKey);
    if (!tenantKey) return;
    const s = await loadSettings(tenantKey);
    if (!(await db.select().from(socialProjects).where(eq(socialProjects.key, tenantKey)).limit(1))[0]) {
      return reply.status(404).send({ error: "Tenant bulunamadi" });
    }
    return reply.send({ tenantKey, settings: maskSettings(s) });
  });

  app.patch("/settings", async (req, reply) => {
    const body = req.body as {
      tenantKey?: string;
      smtp?: { host?: string; port?: number; secure?: boolean; user?: string; pass?: string };
      imap?: { host?: string; port?: number; secure?: boolean; user?: string; pass?: string };
      fromEmail?: string | null;
      fromName?: string | null;
      clearSmtpPassword?: boolean;
      clearImapPassword?: boolean;
    };
    const tenantKey = requireTenantKey(reply, body.tenantKey);
    if (!tenantKey) return;
    const [row] = await db.select().from(socialProjects).where(eq(socialProjects.key, tenantKey)).limit(1);
    if (!row) return reply.status(404).send({ error: "Tenant bulunamadi" });

    const prev = (row.emailSettings as TenantEmailSettings | null) ?? null;
    const next = mergeEmailSettings(prev, {
      smtp: body.smtp,
      imap: body.imap,
      fromEmail: body.fromEmail,
      fromName: body.fromName,
      clearSmtpPassword: body.clearSmtpPassword,
      clearImapPassword: body.clearImapPassword,
    });

    await db
      .update(socialProjects)
      .set({ emailSettings: next })
      .where(eq(socialProjects.id, row.id));

    return reply.send({ ok: true, settings: maskSettings(next) });
  });

  app.post("/test-smtp", async (req, reply) => {
    const { tenantKey, to } = req.body as { tenantKey?: string; to?: string };
    const tk = requireTenantKey(reply, tenantKey);
    if (!tk) return;
    const settings = await loadSettings(tk);
    if (!settings) return reply.status(400).send({ error: "E-posta ayarlari yok" });
    const target = (to || settings.fromEmail || settings.smtp?.user || "").trim();
    if (!target) return reply.status(400).send({ error: "Alici (to) veya fromEmail / smtp.user gerekli" });
    try {
      const [tenantRow] = await db.select().from(socialProjects).where(eq(socialProjects.key, tk)).limit(1);
      const branding = tenantRow
        ? normalizeBranding(getProjectMarketing(tenantRow).branding, {
            name: tenantRow.name,
            websiteUrl: tenantRow.websiteUrl,
          })
        : null;
      await sendSmtpMail(settings, {
        to: target,
        subject: `${branding?.appName || "Tenant"} - SMTP test`,
        text: "Bu bir test mesajidir. SMTP ayarlari calisiyor.",
      });
      return reply.send({ ok: true, sentTo: target });
    } catch (err) {
      return reply.status(400).send({ error: (err as Error).message });
    }
  });

  app.get("/inbox", async (req, reply) => {
    const tenantKey = requireTenantKey(reply, (req.query as { tenantKey?: string })?.tenantKey);
    if (!tenantKey) return;
    const limit = Math.min(50, Math.max(1, Number((req.query as { limit?: string })?.limit) || 20));
    const settings = await loadSettings(tenantKey);
    if (!settings) return reply.status(400).send({ error: "E-posta ayarlari yok" });
    try {
      const items = await listInboxMessages(settings, limit);
      return reply.send({ items });
    } catch (err) {
      return reply.status(400).send({ error: (err as Error).message });
    }
  });

  app.get("/message", async (req, reply) => {
    const tenantKey = requireTenantKey(reply, (req.query as { tenantKey?: string })?.tenantKey);
    if (!tenantKey) return;
    const uid = Number((req.query as { uid?: string })?.uid);
    if (!Number.isFinite(uid)) return reply.status(400).send({ error: "uid gerekli" });
    const settings = await loadSettings(tenantKey);
    if (!settings) return reply.status(400).send({ error: "E-posta ayarlari yok" });
    try {
      const msg = await getInboxMessage(settings, uid);
      return reply.send(msg);
    } catch (err) {
      return reply.status(400).send({ error: (err as Error).message });
    }
  });

  app.post("/reply", async (req, reply) => {
    const body = req.body as {
      tenantKey?: string;
      to?: string;
      subject?: string;
      text?: string;
      inReplyTo?: string;
      references?: string;
    };
    const tenantKey = requireTenantKey(reply, body.tenantKey);
    if (!tenantKey) return;
    const settings = await loadSettings(tenantKey);
    if (!settings) return reply.status(400).send({ error: "E-posta ayarlari yok" });
    const to = (body.to || "").trim();
    const text = (body.text || "").trim();
    if (!to || !text) return reply.status(400).send({ error: "to ve text zorunlu" });
    try {
      await sendSmtpMail(settings, {
        to,
        subject: body.subject || "Re:",
        text,
        inReplyTo: body.inReplyTo,
        references: body.references,
      });
      return reply.send({ ok: true });
    } catch (err) {
      return reply.status(400).send({ error: (err as Error).message });
    }
  });
}

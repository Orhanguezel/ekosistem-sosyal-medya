import nodemailer from "nodemailer";
import { ImapFlow } from "imapflow";
import type { TenantEmailSettings } from "./types";

export function maskSettings(raw: TenantEmailSettings | null | undefined): Record<string, unknown> {
  if (!raw) return {};
  const smtp = raw.smtp
    ? {
        host: raw.smtp.host,
        port: raw.smtp.port,
        secure: raw.smtp.secure,
        user: raw.smtp.user,
        hasPassword: Boolean(raw.smtp.pass),
      }
    : undefined;
  const imap = raw.imap
    ? {
        host: raw.imap.host,
        port: raw.imap.port,
        secure: raw.imap.secure,
        user: raw.imap.user,
        hasPassword: Boolean(raw.imap.pass),
      }
    : undefined;
  return {
    smtp,
    imap,
    fromEmail: raw.fromEmail,
    fromName: raw.fromName,
  };
}

export function mergeEmailSettings(
  prev: TenantEmailSettings | null | undefined,
  patch: {
    smtp?: Partial<{ host: string; port: number; secure: boolean; user: string; pass: string }>;
    imap?: Partial<{ host: string; port: number; secure: boolean; user: string; pass: string }>;
    fromEmail?: string | null;
    fromName?: string | null;
    clearSmtpPassword?: boolean;
    clearImapPassword?: boolean;
  }
): TenantEmailSettings {
  const base: TenantEmailSettings = { ...(prev ?? {}) };

  if (patch.clearSmtpPassword && base.smtp) {
    const { pass: _p, ...rest } = base.smtp;
    base.smtp = rest as typeof base.smtp;
  }
  if (patch.clearImapPassword && base.imap) {
    const { pass: _p, ...rest } = base.imap;
    base.imap = rest as typeof base.imap;
  }

  if (patch.smtp) {
    const oldPass = base.smtp?.pass;
    base.smtp = {
      ...base.smtp,
      ...patch.smtp,
      host: patch.smtp.host ?? base.smtp?.host ?? "",
      port: patch.smtp.port ?? base.smtp?.port ?? 587,
      user: patch.smtp.user ?? base.smtp?.user ?? "",
    };
    if (patch.smtp.pass === undefined) {
      base.smtp.pass = oldPass;
    } else if (patch.smtp.pass === "") {
      base.smtp.pass = oldPass;
    } else {
      base.smtp.pass = patch.smtp.pass;
    }
  }

  if (patch.imap) {
    const oldPass = base.imap?.pass;
    base.imap = {
      ...base.imap,
      ...patch.imap,
      host: patch.imap.host ?? base.imap?.host ?? "",
      port: patch.imap.port ?? base.imap?.port ?? 993,
      user: patch.imap.user ?? base.imap?.user ?? "",
    };
    if (patch.imap.pass === undefined) {
      base.imap.pass = oldPass;
    } else if (patch.imap.pass === "") {
      base.imap.pass = oldPass;
    } else {
      base.imap.pass = patch.imap.pass;
    }
  }

  if (patch.fromEmail !== undefined) base.fromEmail = patch.fromEmail ?? undefined;
  if (patch.fromName !== undefined) base.fromName = patch.fromName ?? undefined;

  return base;
}

export async function sendSmtpMail(
  settings: TenantEmailSettings,
  opts: { to: string; subject: string; text: string; html?: string; inReplyTo?: string; references?: string }
) {
  const s = settings.smtp;
  if (!s?.host || !s.user || !s.pass) {
    throw new Error("SMTP host, kullanici ve sifre tanimli olmali");
  }
  const port = s.port ?? 587;
  const transporter = nodemailer.createTransport({
    host: s.host,
    port,
    secure: s.secure ?? port === 465,
    auth: { user: s.user, pass: s.pass },
  });
  const fromAddr = settings.fromEmail || s.user;
  const fromName = settings.fromName;
  const from = fromName ? `"${fromName.replace(/"/g, "")}" <${fromAddr}>` : fromAddr;
  await transporter.sendMail({
    from,
    to: opts.to,
    subject: opts.subject,
    text: opts.text,
    html: opts.html,
    headers: {
      ...(opts.inReplyTo ? { "In-Reply-To": opts.inReplyTo } : {}),
      ...(opts.references ? { References: opts.references } : {}),
    },
  });
}

export async function listInboxMessages(settings: TenantEmailSettings, limit: number) {
  const im = settings.imap;
  if (!im?.host || !im.user || !im.pass) {
    throw new Error("IMAP host, kullanici ve sifre tanimli olmali");
  }
  const client = new ImapFlow({
    host: im.host,
    port: im.port ?? 993,
    secure: im.secure !== false,
    auth: { user: im.user, pass: im.pass },
    logger: false,
  });
  await client.connect();
  try {
    await client.mailboxOpen("INBOX");
    const found = await client.search({ all: true });
    const uids = found === false ? [] : found;
    const slice = uids.length <= limit ? uids : uids.slice(-limit);
    const ordered = [...slice].reverse();
    const rows: Array<{
      uid: number;
      subject: string;
      from: string;
      date?: string;
      messageId?: string;
    }> = [];
    if (!ordered.length) return rows;
    for await (const msg of client.fetch(ordered, { envelope: true, uid: true })) {
      const env = msg.envelope;
      const fromAddr = env?.from?.[0]?.address ?? "";
      const subjRaw = env?.subject;
      const subj =
        typeof subjRaw === "string"
          ? subjRaw
          : Array.isArray(subjRaw) && subjRaw[0] && typeof (subjRaw[0] as { value?: string }).value === "string"
            ? (subjRaw[0] as { value: string }).value
            : "";
      const mid = env?.messageId ?? undefined;
      rows.push({
        uid: msg.uid,
        subject: subj,
        from: fromAddr,
        date: env?.date?.toISOString?.(),
        messageId: mid,
      });
    }
    return rows;
  } finally {
    await client.logout();
  }
}

export async function getInboxMessage(settings: TenantEmailSettings, uid: number) {
  const im = settings.imap;
  if (!im?.host || !im.user || !im.pass) {
    throw new Error("IMAP host, kullanici ve sifre tanimli olmali");
  }
  const client = new ImapFlow({
    host: im.host,
    port: im.port ?? 993,
    secure: im.secure !== false,
    auth: { user: im.user, pass: im.pass },
    logger: false,
  });
  await client.connect();
  try {
    await client.mailboxOpen("INBOX");
    for await (const msg of client.fetch([uid], { envelope: true, uid: true, source: true })) {
      const text = msg.source?.toString("utf8") ?? "";
      const env = msg.envelope;
      const subjRaw = env?.subject;
      const subject =
        typeof subjRaw === "string"
          ? subjRaw
          : Array.isArray(subjRaw) && subjRaw[0] && typeof (subjRaw[0] as { value?: string }).value === "string"
            ? (subjRaw[0] as { value: string }).value
            : "";
      return {
        uid: msg.uid,
        subject,
        from: env?.from?.[0]?.address ?? "",
        date: env?.date?.toISOString?.(),
        messageId: env?.messageId,
        rawPreview: text.slice(0, 8000),
      };
    }
    throw new Error("Mesaj bulunamadi");
  } finally {
    await client.logout();
  }
}

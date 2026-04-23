import type { FastifyInstance } from 'fastify';
import { and, eq, inArray } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { db } from '@/db/client';
import { siteSettings } from '@/db/schema';

function normalizeLocale(value: unknown): string {
  return typeof value === 'string' && value.trim() ? value.trim() : 'tr';
}

function normalizeKeys(value: unknown): string[] {
  if (typeof value !== 'string') return [];
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export async function siteSettingsRoutes(app: FastifyInstance) {
  app.get('/', async (req) => {
    const locale = normalizeLocale((req.query as Record<string, unknown> | undefined)?.locale);
    const keys = normalizeKeys((req.query as Record<string, unknown> | undefined)?.keys);

    const rows = keys.length
      ? await db
          .select()
          .from(siteSettings)
          .where(and(eq(siteSettings.locale, locale), inArray(siteSettings.key, keys)))
      : await db.select().from(siteSettings).where(eq(siteSettings.locale, locale));

    return { items: rows };
  });

  app.get('/:key', async (req, reply) => {
    const locale = normalizeLocale((req.query as Record<string, unknown> | undefined)?.locale);
    const key = String((req.params as { key: string }).key || '').trim();

    const [row] = await db
      .select()
      .from(siteSettings)
      .where(and(eq(siteSettings.key, key), eq(siteSettings.locale, locale)))
      .limit(1);

    if (!row) {
      return reply.status(404).send({ error: 'Site setting bulunamadi' });
    }

    return row;
  });
}

export async function siteSettingsAdminRoutes(app: FastifyInstance) {
  app.get('/', async (req) => {
    const locale = normalizeLocale((req.query as Record<string, unknown> | undefined)?.locale);
    const keys = normalizeKeys((req.query as Record<string, unknown> | undefined)?.keys);

    const rows = keys.length
      ? await db
          .select()
          .from(siteSettings)
          .where(and(eq(siteSettings.locale, locale), inArray(siteSettings.key, keys)))
      : await db.select().from(siteSettings).where(eq(siteSettings.locale, locale));

    return { items: rows };
  });

  app.get('/:key', async (req, reply) => {
    const locale = normalizeLocale((req.query as Record<string, unknown> | undefined)?.locale);
    const key = String((req.params as { key: string }).key || '').trim();

    const [row] = await db
      .select()
      .from(siteSettings)
      .where(and(eq(siteSettings.key, key), eq(siteSettings.locale, locale)))
      .limit(1);

    if (!row) {
      return reply.status(404).send({ error: 'Site setting bulunamadi' });
    }

    return row;
  });

  app.post('/', async (req, reply) => {
    const body = (req.body as Record<string, unknown> | undefined) || {};
    const key = typeof body.key === 'string' ? body.key.trim() : '';
    const locale = normalizeLocale(body.locale);

    if (!key) {
      return reply.status(400).send({ error: 'key zorunludur' });
    }

    const value =
      typeof body.value === 'string'
        ? body.value
        : body.value == null
          ? ''
          : JSON.stringify(body.value);

    const [existing] = await db
      .select()
      .from(siteSettings)
      .where(and(eq(siteSettings.key, key), eq(siteSettings.locale, locale)))
      .limit(1);

    if (existing) {
      await db
        .update(siteSettings)
        .set({ value })
        .where(eq(siteSettings.id, existing.id));

      const [updated] = await db
        .select()
        .from(siteSettings)
        .where(eq(siteSettings.id, existing.id))
        .limit(1);

      return updated;
    }

    const id = randomUUID();
    await db.insert(siteSettings).values({ id, key, locale, value });

    const [created] = await db.select().from(siteSettings).where(eq(siteSettings.id, id)).limit(1);
    return reply.status(201).send(created);
  });

  app.delete('/:key', async (req, reply) => {
    const locale = normalizeLocale((req.query as Record<string, unknown> | undefined)?.locale);
    const key = String((req.params as { key: string }).key || '').trim();

    await db.delete(siteSettings).where(and(eq(siteSettings.key, key), eq(siteSettings.locale, locale)));
    return { ok: true };
  });
}

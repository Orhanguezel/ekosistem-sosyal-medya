import type { FastifyRequest, FastifyReply } from "fastify";
import * as repo from "./repository";
import {
  createCalendarEntrySchema,
  updateCalendarEntrySchema,
} from "./validation";

export async function list(req: FastifyRequest, reply: FastifyReply) {
  const { from, to, tenantKey } = req.query as { from?: string; to?: string; tenantKey?: string };
  const normalizedTenantKey = typeof tenantKey === "string" ? tenantKey.trim() || undefined : undefined;

  if (!from || !to) {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const entries = await repo.listByDateRange(
      start.toISOString().split("T")[0],
      end.toISOString().split("T")[0],
      normalizedTenantKey
    );
    return reply.send({ items: entries });
  }

  const entries = await repo.listByDateRange(from, to, normalizedTenantKey);
  return reply.send({ items: entries });
}

export async function getByDate(
  req: FastifyRequest<{ Params: { date: string } }>,
  reply: FastifyReply
) {
  const { tenantKey } = req.query as { tenantKey?: string };
  const normalizedTenantKey = typeof tenantKey === "string" ? tenantKey.trim() || undefined : undefined;
  const entries = await repo.getByDate(req.params.date, normalizedTenantKey);
  return reply.send({ items: entries });
}

export async function create(req: FastifyRequest, reply: FastifyReply) {
  const body = req.body as Record<string, unknown>;
  const tenantKey = typeof body?.tenantKey === "string" ? body.tenantKey : undefined;
  const input = createCalendarEntrySchema.parse(body);
  const entry = await repo.createEntry({ ...input, tenantKey });
  return reply.status(201).send(entry);
}

export async function update(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const existing = await repo.getEntryById(Number(req.params.id));
  if (!existing) return reply.status(404).send({ error: "Kayit bulunamadi" });

  const input = updateCalendarEntrySchema.parse(req.body);
  const entry = await repo.updateEntry(existing.id, input);
  return reply.send(entry);
}

export async function remove(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const existing = await repo.getEntryById(Number(req.params.id));
  if (!existing) return reply.status(404).send({ error: "Kayit bulunamadi" });

  await repo.deleteEntry(existing.id);
  return reply.send({ ok: true });
}

export async function generateWeek(req: FastifyRequest, reply: FastifyReply) {
  const { start_date, tenantKey } = req.query as { start_date?: string; tenantKey?: string };
  const startDate = start_date || new Date().toISOString().split("T")[0];
  const normalizedTenantKey = typeof tenantKey === "string" ? tenantKey.trim() : "";

  if (!normalizedTenantKey) {
    return reply.status(400).send({ error: "tenantKey zorunludur" });
  }

  const entries = await repo.generateWeekPlan(startDate, normalizedTenantKey);
  return reply.send({
    items: entries,
    message: `${entries.length} takvim kaydi olusturuldu`,
  });
}

export async function createPost(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const entry = await repo.getEntryById(Number(req.params.id));
  if (!entry) return reply.status(404).send({ error: "Kayit bulunamadi" });

  return reply.send({
    message: "Henuz uygulanmadi - AI/template entegrasyonu gerekli",
    entry,
  });
}

import type { FastifyRequest, FastifyReply } from "fastify";
import * as repo from "./repository";
import * as postRepo from "../posts/repository";
import {
  createTemplateSchema,
  updateTemplateSchema,
  generateFromTemplateSchema,
} from "./validation";

export async function list(req: FastifyRequest, reply: FastifyReply) {
  const { post_type, tenantKey } = req.query as { post_type?: string; tenantKey?: string };
  const normalizedTenantKey = typeof tenantKey === "string" ? tenantKey.trim() || undefined : undefined;
  const templates = await repo.listTemplates(post_type, normalizedTenantKey);
  return reply.send({ items: templates });
}

export async function getById(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const template = await repo.getTemplateById(Number(req.params.id));
  if (!template) return reply.status(404).send({ error: "Sablon bulunamadi" });
  return reply.send(template);
}

export async function create(req: FastifyRequest, reply: FastifyReply) {
  const parsed = createTemplateSchema.parse(req.body);
  const tenantKey =
    typeof (req.body as Record<string, unknown> | null)?.tenantKey === "string"
      ? ((req.body as Record<string, unknown>).tenantKey as string)
      : undefined;
  const template = await repo.createTemplate({ ...parsed, tenantKey });
  return reply.status(201).send(template);
}

export async function update(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const existing = await repo.getTemplateById(Number(req.params.id));
  if (!existing) return reply.status(404).send({ error: "Sablon bulunamadi" });

  const input = updateTemplateSchema.parse(req.body);
  const template = await repo.updateTemplate(existing.id, input);
  return reply.send(template);
}

export async function remove(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const existing = await repo.getTemplateById(Number(req.params.id));
  if (!existing) return reply.status(404).send({ error: "Sablon bulunamadi" });

  await repo.deleteTemplate(existing.id);
  return reply.send({ ok: true });
}

export async function generate(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const template = await repo.getTemplateById(Number(req.params.id));
  if (!template) return reply.status(404).send({ error: "Sablon bulunamadi" });

  const { variables, platform, scheduledAt } =
    generateFromTemplateSchema.parse(req.body);

  const caption = repo.renderTemplate(template.captionTemplate, variables);
  const hashtags = template.hashtags || "";

  const post = await postRepo.createPost({
    tenantKey: template.tenantKey || "default",
    postType: template.postType,
    title: variables.baslik || template.name,
    caption: `${caption}\n\n${hashtags}`.trim(),
    hashtags,
    platform: platform || template.platform,
    sourceType: "template",
    sourceRef: String(template.id),
    scheduledAt,
  });

  await repo.incrementUsageCount(template.id);

  return reply.status(201).send(post);
}

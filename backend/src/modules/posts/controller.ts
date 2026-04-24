import type { FastifyRequest, FastifyReply } from "fastify";
import * as repo from "./repository";
import * as insights from "./insights";
import {
  createPostSchema,
  updatePostSchema,
  schedulePostSchema,
  listPostsSchema,
} from "./validation";
import * as publisher from "../platforms/publisher";

export async function list(req: FastifyRequest, reply: FastifyReply) {
  const query = listPostsSchema.parse(req.query);
  const result = await repo.listPosts(query);
  return reply.send(result);
}

export async function getById(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const post = await repo.getPostById(Number(req.params.id));
  if (!post) return reply.status(404).send({ error: "Post bulunamadi" });
  return reply.send(post);
}

export async function create(req: FastifyRequest, reply: FastifyReply) {
  const input = createPostSchema.parse(req.body);
  const post = await repo.createPost(input);
  return reply.status(201).send(post);
}

export async function update(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const existing = await repo.getPostById(Number(req.params.id));
  if (!existing) return reply.status(404).send({ error: "Post bulunamadi" });

  const input = updatePostSchema.parse(req.body);
  const post = await repo.updatePost(existing.id, input);
  return reply.send(post);
}

export async function remove(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const existing = await repo.getPostById(Number(req.params.id));
  if (!existing) return reply.status(404).send({ error: "Post bulunamadi" });

  await repo.deletePost(existing.id);
  return reply.send({ ok: true });
}

export async function schedule(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const existing = await repo.getPostById(Number(req.params.id));
  if (!existing) return reply.status(404).send({ error: "Post bulunamadi" });

  const { scheduledAt } = schedulePostSchema.parse(req.body);
  const post = await repo.schedulePost(existing.id, scheduledAt);
  return reply.send(post);
}

export async function publishNow(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const existing = await repo.getPostById(Number(req.params.id));
  if (!existing) return reply.status(404).send({ error: "Post bulunamadi" });

  try {
    const result = await publisher.publishPost(existing.id);
    return reply.send({
      ok: result.success,
      fbPostId: result.fbPostId,
      igMediaId: result.igMediaId,
      errors: result.errors,
    });
  } catch (err) {
    return reply.status(500).send({ error: (err as Error).message });
  }
}

export async function cancel(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const existing = await repo.getPostById(Number(req.params.id));
  if (!existing) return reply.status(404).send({ error: "Post bulunamadi" });

  const post = await repo.cancelPost(existing.id);
  return reply.send(post);
}

export async function duplicate(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const post = await repo.duplicatePost(Number(req.params.id));
  if (!post) return reply.status(404).send({ error: "Post bulunamadi" });
  return reply.status(201).send(post);
}

export async function details(
  req: FastifyRequest<{ Params: { id: string }; Querystring: { refresh?: string } }>,
  reply: FastifyReply
) {
  try {
    const result = await insights.getPostDetails(Number(req.params.id), {
      refresh: req.query.refresh === "1" || req.query.refresh === "true",
    });
    return reply.send(result);
  } catch (err) {
    if ((err as Error).message === "Post bulunamadi") {
      return reply.status(404).send({ error: "Post bulunamadi" });
    }
    return reply.status(500).send({ error: (err as Error).message });
  }
}

export async function refreshMetrics(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const result = await insights.refreshPostMetrics(Number(req.params.id));
    return reply.send(result);
  } catch (err) {
    if ((err as Error).message === "Post bulunamadi") {
      return reply.status(404).send({ error: "Post bulunamadi" });
    }
    return reply.status(500).send({ error: (err as Error).message });
  }
}

export async function queue(req: FastifyRequest, reply: FastifyReply) {
  const posts = await repo.getPostQueue();
  return reply.send({ items: posts });
}

export async function history(req: FastifyRequest, reply: FastifyReply) {
  const query = listPostsSchema.parse({ ...req.query as object, status: "posted" });
  const result = await repo.listPosts(query);
  return reply.send(result);
}

export async function stats(req: FastifyRequest, reply: FastifyReply) {
  const tenantKey =
    typeof (req.query as Record<string, unknown> | null)?.tenantKey === "string"
      ? ((req.query as Record<string, unknown>).tenantKey as string)
      : undefined;
  const s = await repo.getPostStats(tenantKey);
  return reply.send(s);
}

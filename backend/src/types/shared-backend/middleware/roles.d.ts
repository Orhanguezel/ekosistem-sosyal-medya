import type { FastifyReply, FastifyRequest } from 'fastify';

export function requireAdmin(req: FastifyRequest, reply: FastifyReply): Promise<void>;

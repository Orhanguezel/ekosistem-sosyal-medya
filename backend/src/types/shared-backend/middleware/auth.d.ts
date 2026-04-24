import type { FastifyReply, FastifyRequest } from 'fastify';

export function requireAuth(req: FastifyRequest, reply: FastifyReply): Promise<void>;

import type { FastifyInstance } from 'fastify';

export function registerAuth(app: FastifyInstance): Promise<void>;
export function registerUserAdmin(app: FastifyInstance): Promise<void>;

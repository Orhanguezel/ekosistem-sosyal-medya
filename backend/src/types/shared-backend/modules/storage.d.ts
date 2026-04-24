import type { FastifyInstance } from 'fastify';

export function registerStorage(app: FastifyInstance): Promise<void>;
export function registerStorageAdmin(app: FastifyInstance): Promise<void>;

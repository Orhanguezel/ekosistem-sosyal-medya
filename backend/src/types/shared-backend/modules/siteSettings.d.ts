import type { FastifyInstance } from 'fastify';

export function registerSiteSettings(app: FastifyInstance): Promise<void>;
export function registerSiteSettingsAdmin(app: FastifyInstance): Promise<void>;

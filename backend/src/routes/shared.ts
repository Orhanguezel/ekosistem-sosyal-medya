import type { FastifyInstance } from 'fastify';
import { registerAuth, registerUserAdmin } from '@vps/shared-backend/modules/auth';
import { registerStorage, registerStorageAdmin } from '@vps/shared-backend/modules/storage';
import { registerSiteSettings, registerSiteSettingsAdmin } from '@vps/shared-backend/modules/siteSettings';
import { registerHealth } from '@vps/shared-backend/modules/health';
import { registerAudit } from '@vps/shared-backend/modules/audit';

export async function registerSharedPublic(api: FastifyInstance) {
  await registerAuth(api);
  await registerHealth(api);
  await registerStorage(api);
  await registerSiteSettings(api);
  await registerAudit(api);
}

export async function registerSharedAdmin(adminApi: FastifyInstance) {
  await registerUserAdmin(adminApi);
  await registerStorageAdmin(adminApi);
  await registerSiteSettingsAdmin(adminApi);
}

import type { FastifyInstance } from 'fastify';
import { requireAuth } from '@vps/shared-backend/middleware/auth';
import { requireAdmin } from '@vps/shared-backend/middleware/roles';
import { registerSharedPublic, registerSharedAdmin } from './routes/shared';
import { registerSocialRoutes } from './routes/social';

export async function registerAllRoutes(app: FastifyInstance) {
  await app.register(async (api) => {
    api.get('/health', async () => ({ ok: true, service: 'ekosistem-sosyal-medya' }));

    await api.register(async (v1) => {
      // Admin routes — auth + admin role required
      await v1.register(async (adminApi) => {
        adminApi.addHook('onRequest', requireAuth);
        adminApi.addHook('onRequest', requireAdmin);
        await registerSharedAdmin(adminApi);
      }, { prefix: '/admin' });

      // Public + shared routes
      await registerSharedPublic(v1);

      // Project-specific social media routes
      await registerSocialRoutes(v1);
    }, { prefix: '/v1' });
  }, { prefix: '/api' });
}

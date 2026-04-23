import type { FastifyInstance } from 'fastify';
import { postsRoutes } from '@/modules/posts/routes';
import { templatesRoutes } from '@/modules/templates/routes';
import { calendarRoutes } from '@/modules/calendar/routes';
import { platformsRoutes } from '@/modules/platforms/routes';
import { ekosistemFeedRoutes } from '@/modules/ekosistem-feed/routes';
import { aiRoutes } from '@/modules/ai/routes';
import { analyticsRoutes } from '@/modules/analytics/routes';
import { tenantsRoutes } from '@/modules/tenants/routes';
import { tenantAdminRoutes } from '@/modules/tenants/admin-routes';
import { marketingRoutes } from '@/modules/marketing/routes';
import { emailRoutes } from '@/modules/email/routes';
import { siteSettingsRoutes } from '@/modules/site-settings/routes';

export async function registerSocialRoutes(api: FastifyInstance) {
  await api.register(postsRoutes, { prefix: '/posts' });
  await api.register(templatesRoutes, { prefix: '/templates' });
  await api.register(calendarRoutes, { prefix: '/calendar' });
  await api.register(platformsRoutes, { prefix: '/platforms' });
  await api.register(ekosistemFeedRoutes, { prefix: '/ekosistem' });
  await api.register(aiRoutes, { prefix: '/ai' });
  await api.register(analyticsRoutes, { prefix: '/analytics' });
  await api.register(tenantsRoutes, { prefix: '/tenants' });
  await api.register(tenantAdminRoutes, { prefix: '/tenants/admin' });
  await api.register(marketingRoutes, { prefix: '/marketing' });
  await api.register(emailRoutes, { prefix: '/email' });
  await api.register(siteSettingsRoutes, { prefix: '/site-settings' });
}

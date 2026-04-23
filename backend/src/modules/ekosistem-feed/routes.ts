// src/modules/ekosistem-feed/routes.ts
// Ekosistem projelerinden dinamik içerik çekme
import type { FastifyInstance } from 'fastify';
import { db } from '../../db/client';
import { socialProjects } from '../../db/schema';
import { eq, and } from 'drizzle-orm';

async function fetchApi(baseUrl: string, path: string, params?: Record<string, string>) {
  if (!baseUrl) throw new Error('API Base URL tanımlı değil');
  
  const url = new URL(`${baseUrl.replace(/\/$/, '')}${path}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  }
  
  const res = await fetch(url.toString(), { 
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(5000) // 5 sn timeout
  });
  
  if (!res.ok) throw new Error(`API hatası (${url.hostname}): ${res.status}`);
  return res.json();
}

export async function ekosistemFeedRoutes(app: FastifyInstance) {
  // Belirli bir kaynaktan veri çekme (Dinamik)
  // GET /ekosistem/source/:projectKey/:resource (resource: urunler, haberler, makaleler vb.)
  app.get('/source/:projectKey/:resource', async (req, reply) => {
    const { projectKey, resource } = req.params as { projectKey: string; resource: string };
    const { limit = '10', locale = 'tr' } = req.query as Record<string, string>;

    try {
      // Veritabanından proje konfigürasyonunu çek
      const [project] = await db
        .select()
        .from(socialProjects)
        .where(and(eq(socialProjects.key, projectKey), eq(socialProjects.isActive, 1)))
        .limit(1);

      if (!project || !project.contentSourceUrl) {
        return reply.status(404).send({ error: 'Kaynak bulunamadı veya konfigüre edilmemiş' });
      }

      // Kaynak tipine göre path eşleme
      let apiPath = '/articles'; // varsayılan
      if (resource === 'urunler') apiPath = '/products';
      if (resource === 'haberler' || resource === 'makaleler') apiPath = '/articles';

      const data = await fetchApi(project.contentSourceUrl, apiPath, { limit, locale, is_published: '1' });
      return reply.send(data);
    } catch (err) {
      app.log.error(err);
      return reply.status(502).send({ 
        error: 'Kaynak API bağlantı hatası', 
        detail: (err as Error).message,
        projectKey 
      });
    }
  });

  // Tüm aktif kaynaklardan özet feed (Dinamik)
  app.get('/feed', async (req, reply) => {
    const { limit = '5' } = req.query as Record<string, string>;
    
    const activeProjects = await db
      .select()
      .from(socialProjects)
      .where(eq(socialProjects.isActive, 1));

    const results: Record<string, unknown> = {};
    
    await Promise.allSettled(
      activeProjects
        .filter(p => p.contentSourceUrl)
        .map(async (p) => {
          try {
            // Her kaynak için ürünleri çekmeye çalış
            const path = p.contentSourceType === 'bereketfide' ? '/products' : '/articles';
            const data = await fetchApi(p.contentSourceUrl!, path, { limit, is_published: '1' });
            results[p.key] = data;
          } catch (err) {
            results[p.key] = { error: 'bağlantı hatası' };
          }
        })
    );

    return reply.send(results);
  });

  // Manuel senkronizasyon (Tetikleme)
  app.post('/sync/:projectKey', async (req, reply) => {
    const { projectKey } = req.params as { projectKey: string };
    return reply.send({ 
      message: 'Senkronizasyon tetiklendi', 
      projectKey,
      status: 'pending' 
    });
  });
}

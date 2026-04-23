import type { FastifyInstance } from "fastify";
import { getTenantByKey, listActiveTenants } from "./service";

export async function tenantsRoutes(app: FastifyInstance) {
  app.get("/", async (_req, reply) => {
    const items = await listActiveTenants();
    return reply.send({ items });
  });

  app.get("/:tenantKey", async (req, reply) => {
    const { tenantKey } = req.params as { tenantKey: string };
    const item = await getTenantByKey(tenantKey);
    if (!item) return reply.status(404).send({ error: "Tenant bulunamadi" });
    return reply.send(item);
  });
}

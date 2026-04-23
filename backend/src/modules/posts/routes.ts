import type { FastifyInstance } from "fastify";
import * as ctrl from "./controller";

export async function postsRoutes(app: FastifyInstance) {
  app.get("/", ctrl.list);
  app.get("/queue", ctrl.queue);
  app.get("/history", ctrl.history);
  app.get("/stats", ctrl.stats);
  app.get("/:id", ctrl.getById);
  app.post("/", ctrl.create);
  app.patch("/:id", ctrl.update);
  app.delete("/:id", ctrl.remove);
  app.post("/:id/schedule", ctrl.schedule);
  app.post("/:id/publish-now", ctrl.publishNow);
  app.post("/:id/cancel", ctrl.cancel);
  app.post("/:id/duplicate", ctrl.duplicate);
}

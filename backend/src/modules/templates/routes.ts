import type { FastifyInstance } from "fastify";
import * as ctrl from "./controller";

export async function templatesRoutes(app: FastifyInstance) {
  app.get("/", ctrl.list);
  app.get("/:id", ctrl.getById);
  app.post("/", ctrl.create);
  app.patch("/:id", ctrl.update);
  app.delete("/:id", ctrl.remove);
  app.post("/:id/generate", ctrl.generate);
}

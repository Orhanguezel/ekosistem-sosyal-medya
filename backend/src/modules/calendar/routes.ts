import type { FastifyInstance } from "fastify";
import * as ctrl from "./controller";

export async function calendarRoutes(app: FastifyInstance) {
  app.get("/", ctrl.list);
  app.get("/:date", ctrl.getByDate);
  app.post("/", ctrl.create);
  app.patch("/:id", ctrl.update);
  app.delete("/:id", ctrl.remove);
  app.post("/generate-week", ctrl.generateWeek);
  app.post("/:id/create-post", ctrl.createPost);
}

import type { FastifyInstance } from "fastify";
import { requireAdmin } from "../../middleware/requireAdmin.js";
import { verifyAuth } from "../../middleware/verifyAuth.js";
import { lessonSchema, updateWorldSchema, worldSchema } from "../../schemas/admin.schema.js";
import { createLesson, listLessonsByWorld } from "../../services/admin/lessons.service.js";
import { createWorld, deleteWorld, listWorlds, updateWorld } from "../../services/admin/worlds.service.js";

export async function adminWorldsRoutes(app: FastifyInstance) {
  app.addHook("preHandler", verifyAuth);
  app.addHook("preHandler", requireAdmin);

  app.get("/", async (_request, reply) => {
    const worlds = await listWorlds();
    return reply.send({ worlds });
  });

  app.post("/", async (request, reply) => {
    const input = worldSchema.parse(request.body);
    const world = await createWorld(input);
    return reply.status(201).send({ world });
  });

  app.patch<{ Params: { id: string } }>("/:id", async (request, reply) => {
    const input = updateWorldSchema.parse(request.body);
    const world = await updateWorld(request.params.id, input);
    return reply.send({ world });
  });

  app.delete<{ Params: { id: string } }>("/:id", async (request, reply) => {
    await deleteWorld(request.params.id);
    return reply.status(204).send();
  });

  // Lessons are nested under their world.
  app.get<{ Params: { id: string } }>("/:id/lessons", async (request, reply) => {
    const lessons = await listLessonsByWorld(request.params.id);
    return reply.send({ lessons });
  });

  app.post<{ Params: { id: string } }>("/:id/lessons", async (request, reply) => {
    const input = lessonSchema.parse(request.body);
    const lesson = await createLesson(request.params.id, input);
    return reply.status(201).send({ lesson });
  });
}

import type { FastifyInstance } from "fastify";
import { requireAdmin } from "../../middleware/requireAdmin.js";
import { verifyAuth } from "../../middleware/verifyAuth.js";
import { miniGameTopicSchema, miniGameWordSchema, updateMiniGameTopicSchema } from "../../schemas/admin.schema.js";
import { createMiniGameTopic, deleteMiniGameTopic, listMiniGameTopics, updateMiniGameTopic } from "../../services/admin/miniGameTopics.service.js";
import { createWord, listWordsByTopic } from "../../services/admin/miniGameWords.service.js";

export async function adminMiniGameTopicsRoutes(app: FastifyInstance) {
  app.addHook("preHandler", verifyAuth);
  app.addHook("preHandler", requireAdmin);

  app.get("/", async (_request, reply) => {
    const topics = await listMiniGameTopics();
    return reply.send({ topics });
  });

  app.post("/", async (request, reply) => {
    const input = miniGameTopicSchema.parse(request.body);
    const topic = await createMiniGameTopic(input);
    return reply.status(201).send({ topic });
  });

  app.patch<{ Params: { id: string } }>("/:id", async (request, reply) => {
    const input = updateMiniGameTopicSchema.parse(request.body);
    const topic = await updateMiniGameTopic(request.params.id, input);
    return reply.send({ topic });
  });

  app.delete<{ Params: { id: string } }>("/:id", async (request, reply) => {
    await deleteMiniGameTopic(request.params.id);
    return reply.status(204).send();
  });

  // Words are nested under their topic.
  app.get<{ Params: { id: string } }>("/:id/words", async (request, reply) => {
    const words = await listWordsByTopic(request.params.id);
    return reply.send({ words });
  });

  app.post<{ Params: { id: string } }>("/:id/words", async (request, reply) => {
    const input = miniGameWordSchema.parse(request.body);
    const word = await createWord(request.params.id, input);
    return reply.status(201).send({ word });
  });
}

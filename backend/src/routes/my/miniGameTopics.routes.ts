import type { FastifyInstance } from "fastify";
import { verifyAuth } from "../../middleware/verifyAuth.js";
import { miniGameWordSchema } from "../../schemas/admin.schema.js";
import { myMiniGameTopicSchema, myUpdateMiniGameTopicSchema } from "../../schemas/my.schema.js";
import { createOwnMiniGameTopic, deleteMiniGameTopic, listMiniGameTopics, updateMiniGameTopic } from "../../services/admin/miniGameTopics.service.js";
import { createWord, listWordsByTopic } from "../../services/admin/miniGameWords.service.js";
import { assertCanCreateOwnContent } from "../../services/premium.service.js";

export async function myMiniGameTopicsRoutes(app: FastifyInstance) {
  app.addHook("preHandler", verifyAuth);

  app.get("/", async (request, reply) => {
    const topics = await listMiniGameTopics(request.parentId);
    return reply.send({ topics });
  });

  app.post("/", async (request, reply) => {
    const input = myMiniGameTopicSchema.parse(request.body);
    await assertCanCreateOwnContent(request.parentId, "miniGameTopic");
    const topic = await createOwnMiniGameTopic(request.parentId, input);
    return reply.status(201).send({ topic });
  });

  app.patch<{ Params: { id: string } }>("/:id", async (request, reply) => {
    const input = myUpdateMiniGameTopicSchema.parse(request.body);
    const topic = await updateMiniGameTopic(request.params.id, input, request.parentId);
    return reply.send({ topic });
  });

  app.delete<{ Params: { id: string } }>("/:id", async (request, reply) => {
    await deleteMiniGameTopic(request.params.id, request.parentId);
    return reply.status(204).send();
  });

  app.get<{ Params: { id: string } }>("/:id/words", async (request, reply) => {
    const words = await listWordsByTopic(request.params.id, request.parentId);
    return reply.send({ words });
  });

  app.post<{ Params: { id: string } }>("/:id/words", async (request, reply) => {
    const input = miniGameWordSchema.parse(request.body);
    const word = await createWord(request.params.id, input, request.parentId);
    return reply.status(201).send({ word });
  });
}

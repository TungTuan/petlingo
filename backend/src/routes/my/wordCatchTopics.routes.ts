import type { FastifyInstance } from "fastify";
import { verifyAuth } from "../../middleware/verifyAuth.js";
import { wordCatchRoundSchema } from "../../schemas/admin.schema.js";
import { myUpdateWordCatchTopicSchema, myWordCatchTopicSchema } from "../../schemas/my.schema.js";
import { createOwnWordCatchTopic, deleteWordCatchTopic, listWordCatchTopics, updateWordCatchTopic } from "../../services/admin/wordCatchTopics.service.js";
import { createRound, listRoundsByTopic } from "../../services/admin/wordCatchRounds.service.js";
import { assertCanCreateOwnContent } from "../../services/premium.service.js";

export async function myWordCatchTopicsRoutes(app: FastifyInstance) {
  app.addHook("preHandler", verifyAuth);

  app.get("/", async (request, reply) => {
    const topics = await listWordCatchTopics(request.parentId);
    return reply.send({ topics });
  });

  app.post("/", async (request, reply) => {
    const input = myWordCatchTopicSchema.parse(request.body);
    await assertCanCreateOwnContent(request.parentId, "wordCatchTopic");
    const topic = await createOwnWordCatchTopic(request.parentId, input);
    return reply.status(201).send({ topic });
  });

  app.patch<{ Params: { id: string } }>("/:id", async (request, reply) => {
    const input = myUpdateWordCatchTopicSchema.parse(request.body);
    const topic = await updateWordCatchTopic(request.params.id, input, request.parentId);
    return reply.send({ topic });
  });

  app.delete<{ Params: { id: string } }>("/:id", async (request, reply) => {
    await deleteWordCatchTopic(request.params.id, request.parentId);
    return reply.status(204).send();
  });

  app.get<{ Params: { id: string } }>("/:id/rounds", async (request, reply) => {
    const rounds = await listRoundsByTopic(request.params.id, request.parentId);
    return reply.send({ rounds });
  });

  app.post<{ Params: { id: string } }>("/:id/rounds", async (request, reply) => {
    const input = wordCatchRoundSchema.parse(request.body);
    const round = await createRound(request.params.id, input, request.parentId);
    return reply.status(201).send({ round });
  });
}

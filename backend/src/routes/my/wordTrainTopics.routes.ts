import type { FastifyInstance } from "fastify";
import { verifyAuth } from "../../middleware/verifyAuth.js";
import { wordTrainRoundSchema } from "../../schemas/admin.schema.js";
import { myUpdateWordTrainTopicSchema, myWordTrainTopicSchema } from "../../schemas/my.schema.js";
import { createOwnWordTrainTopic, deleteWordTrainTopic, listWordTrainTopics, updateWordTrainTopic } from "../../services/admin/wordTrainTopics.service.js";
import { createRound, listRoundsByTopic } from "../../services/admin/wordTrainRounds.service.js";
import { assertCanCreateOwnContent } from "../../services/premium.service.js";

export async function myWordTrainTopicsRoutes(app: FastifyInstance) {
  app.addHook("preHandler", verifyAuth);

  app.get("/", async (request, reply) => {
    const topics = await listWordTrainTopics(request.parentId);
    return reply.send({ topics });
  });

  app.post("/", async (request, reply) => {
    const input = myWordTrainTopicSchema.parse(request.body);
    await assertCanCreateOwnContent(request.parentId, "wordTrainTopic");
    const topic = await createOwnWordTrainTopic(request.parentId, input);
    return reply.status(201).send({ topic });
  });

  app.patch<{ Params: { id: string } }>("/:id", async (request, reply) => {
    const input = myUpdateWordTrainTopicSchema.parse(request.body);
    const topic = await updateWordTrainTopic(request.params.id, input, request.parentId);
    return reply.send({ topic });
  });

  app.delete<{ Params: { id: string } }>("/:id", async (request, reply) => {
    await deleteWordTrainTopic(request.params.id, request.parentId);
    return reply.status(204).send();
  });

  app.get<{ Params: { id: string } }>("/:id/rounds", async (request, reply) => {
    const rounds = await listRoundsByTopic(request.params.id, request.parentId);
    return reply.send({ rounds });
  });

  app.post<{ Params: { id: string } }>("/:id/rounds", async (request, reply) => {
    const input = wordTrainRoundSchema.parse(request.body);
    const round = await createRound(request.params.id, input, request.parentId);
    return reply.status(201).send({ round });
  });
}

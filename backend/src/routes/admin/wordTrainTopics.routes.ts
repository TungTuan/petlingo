import type { FastifyInstance } from "fastify";
import { requireAdmin } from "../../middleware/requireAdmin.js";
import { verifyAuth } from "../../middleware/verifyAuth.js";
import { updateWordTrainTopicSchema, wordTrainRoundSchema, wordTrainTopicSchema } from "../../schemas/admin.schema.js";
import { createWordTrainTopic, deleteWordTrainTopic, listWordTrainTopics, updateWordTrainTopic } from "../../services/admin/wordTrainTopics.service.js";
import { createRound, listRoundsByTopic } from "../../services/admin/wordTrainRounds.service.js";

export async function adminWordTrainTopicsRoutes(app: FastifyInstance) {
  app.addHook("preHandler", verifyAuth);
  app.addHook("preHandler", requireAdmin);

  app.get("/", async (_request, reply) => {
    const topics = await listWordTrainTopics();
    return reply.send({ topics });
  });

  app.post("/", async (request, reply) => {
    const input = wordTrainTopicSchema.parse(request.body);
    const topic = await createWordTrainTopic(input);
    return reply.status(201).send({ topic });
  });

  app.patch<{ Params: { id: string } }>("/:id", async (request, reply) => {
    const input = updateWordTrainTopicSchema.parse(request.body);
    const topic = await updateWordTrainTopic(request.params.id, input);
    return reply.send({ topic });
  });

  app.delete<{ Params: { id: string } }>("/:id", async (request, reply) => {
    await deleteWordTrainTopic(request.params.id);
    return reply.status(204).send();
  });

  // Rounds are nested under their topic.
  app.get<{ Params: { id: string } }>("/:id/rounds", async (request, reply) => {
    const rounds = await listRoundsByTopic(request.params.id);
    return reply.send({ rounds });
  });

  app.post<{ Params: { id: string } }>("/:id/rounds", async (request, reply) => {
    const input = wordTrainRoundSchema.parse(request.body);
    const round = await createRound(request.params.id, input);
    return reply.status(201).send({ round });
  });
}

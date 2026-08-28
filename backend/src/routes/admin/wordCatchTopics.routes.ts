import type { FastifyInstance } from "fastify";
import { requireAdmin } from "../../middleware/requireAdmin.js";
import { verifyAuth } from "../../middleware/verifyAuth.js";
import { updateWordCatchTopicSchema, wordCatchRoundSchema, wordCatchTopicSchema } from "../../schemas/admin.schema.js";
import { createWordCatchTopic, deleteWordCatchTopic, listWordCatchTopics, updateWordCatchTopic } from "../../services/admin/wordCatchTopics.service.js";
import { createRound, listRoundsByTopic } from "../../services/admin/wordCatchRounds.service.js";

export async function adminWordCatchTopicsRoutes(app: FastifyInstance) {
  app.addHook("preHandler", verifyAuth);
  app.addHook("preHandler", requireAdmin);

  app.get("/", async (_request, reply) => {
    const topics = await listWordCatchTopics();
    return reply.send({ topics });
  });

  app.post("/", async (request, reply) => {
    const input = wordCatchTopicSchema.parse(request.body);
    const topic = await createWordCatchTopic(input);
    return reply.status(201).send({ topic });
  });

  app.patch<{ Params: { id: string } }>("/:id", async (request, reply) => {
    const input = updateWordCatchTopicSchema.parse(request.body);
    const topic = await updateWordCatchTopic(request.params.id, input);
    return reply.send({ topic });
  });

  app.delete<{ Params: { id: string } }>("/:id", async (request, reply) => {
    await deleteWordCatchTopic(request.params.id);
    return reply.status(204).send();
  });

  // Rounds are nested under their topic.
  app.get<{ Params: { id: string } }>("/:id/rounds", async (request, reply) => {
    const rounds = await listRoundsByTopic(request.params.id);
    return reply.send({ rounds });
  });

  app.post<{ Params: { id: string } }>("/:id/rounds", async (request, reply) => {
    const input = wordCatchRoundSchema.parse(request.body);
    const round = await createRound(request.params.id, input);
    return reply.status(201).send({ round });
  });
}

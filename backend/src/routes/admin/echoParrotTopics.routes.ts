import type { FastifyInstance } from "fastify";
import { requireAdmin } from "../../middleware/requireAdmin.js";
import { verifyAuth } from "../../middleware/verifyAuth.js";
import { echoParrotRoundSchema, echoParrotTopicSchema, updateEchoParrotTopicSchema } from "../../schemas/admin.schema.js";
import { createEchoParrotTopic, deleteEchoParrotTopic, listEchoParrotTopics, updateEchoParrotTopic } from "../../services/admin/echoParrotTopics.service.js";
import { createRound, listRoundsByTopic } from "../../services/admin/echoParrotRounds.service.js";

export async function adminEchoParrotTopicsRoutes(app: FastifyInstance) {
  app.addHook("preHandler", verifyAuth);
  app.addHook("preHandler", requireAdmin);

  app.get("/", async (_request, reply) => {
    const topics = await listEchoParrotTopics();
    return reply.send({ topics });
  });

  app.post("/", async (request, reply) => {
    const input = echoParrotTopicSchema.parse(request.body);
    const topic = await createEchoParrotTopic(input);
    return reply.status(201).send({ topic });
  });

  app.patch<{ Params: { id: string } }>("/:id", async (request, reply) => {
    const input = updateEchoParrotTopicSchema.parse(request.body);
    const topic = await updateEchoParrotTopic(request.params.id, input);
    return reply.send({ topic });
  });

  app.delete<{ Params: { id: string } }>("/:id", async (request, reply) => {
    await deleteEchoParrotTopic(request.params.id);
    return reply.status(204).send();
  });

  // Rounds are nested under their topic.
  app.get<{ Params: { id: string } }>("/:id/rounds", async (request, reply) => {
    const rounds = await listRoundsByTopic(request.params.id);
    return reply.send({ rounds });
  });

  app.post<{ Params: { id: string } }>("/:id/rounds", async (request, reply) => {
    const input = echoParrotRoundSchema.parse(request.body);
    const round = await createRound(request.params.id, input);
    return reply.status(201).send({ round });
  });
}

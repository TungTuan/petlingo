import type { FastifyInstance } from "fastify";
import { requireAdmin } from "../../middleware/requireAdmin.js";
import { verifyAuth } from "../../middleware/verifyAuth.js";
import { homeRoundSchema, homeTopicSchema, updateHomeTopicSchema } from "../../schemas/admin.schema.js";
import { createHomeTopic, deleteHomeTopic, listHomeTopics, updateHomeTopic } from "../../services/admin/homeTopics.service.js";
import { createRound, listRoundsByTopic } from "../../services/admin/homeRounds.service.js";

export async function adminHomeTopicsRoutes(app: FastifyInstance) {
  app.addHook("preHandler", verifyAuth);
  app.addHook("preHandler", requireAdmin);

  app.get("/", async (_request, reply) => {
    const topics = await listHomeTopics();
    return reply.send({ topics });
  });

  app.post("/", async (request, reply) => {
    const input = homeTopicSchema.parse(request.body);
    const topic = await createHomeTopic(input);
    return reply.status(201).send({ topic });
  });

  app.patch<{ Params: { id: string } }>("/:id", async (request, reply) => {
    const input = updateHomeTopicSchema.parse(request.body);
    const topic = await updateHomeTopic(request.params.id, input);
    return reply.send({ topic });
  });

  app.delete<{ Params: { id: string } }>("/:id", async (request, reply) => {
    await deleteHomeTopic(request.params.id);
    return reply.status(204).send();
  });

  // Rounds are nested under their topic.
  app.get<{ Params: { id: string } }>("/:id/rounds", async (request, reply) => {
    const rounds = await listRoundsByTopic(request.params.id);
    return reply.send({ rounds });
  });

  app.post<{ Params: { id: string } }>("/:id/rounds", async (request, reply) => {
    const input = homeRoundSchema.parse(request.body);
    const round = await createRound(request.params.id, input);
    return reply.status(201).send({ round });
  });
}

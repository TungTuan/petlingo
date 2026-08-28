import type { FastifyInstance } from "fastify";
import { requireAdmin } from "../../middleware/requireAdmin.js";
import { verifyAuth } from "../../middleware/verifyAuth.js";
import { shopRoundSchema, shopTopicSchema, updateShopTopicSchema } from "../../schemas/admin.schema.js";
import { createShopTopic, deleteShopTopic, listShopTopics, updateShopTopic } from "../../services/admin/shopTopics.service.js";
import { createRound, listRoundsByTopic } from "../../services/admin/shopRounds.service.js";

export async function adminShopTopicsRoutes(app: FastifyInstance) {
  app.addHook("preHandler", verifyAuth);
  app.addHook("preHandler", requireAdmin);

  app.get("/", async (_request, reply) => {
    const topics = await listShopTopics();
    return reply.send({ topics });
  });

  app.post("/", async (request, reply) => {
    const input = shopTopicSchema.parse(request.body);
    const topic = await createShopTopic(input);
    return reply.status(201).send({ topic });
  });

  app.patch<{ Params: { id: string } }>("/:id", async (request, reply) => {
    const input = updateShopTopicSchema.parse(request.body);
    const topic = await updateShopTopic(request.params.id, input);
    return reply.send({ topic });
  });

  app.delete<{ Params: { id: string } }>("/:id", async (request, reply) => {
    await deleteShopTopic(request.params.id);
    return reply.status(204).send();
  });

  // Rounds are nested under their topic.
  app.get<{ Params: { id: string } }>("/:id/rounds", async (request, reply) => {
    const rounds = await listRoundsByTopic(request.params.id);
    return reply.send({ rounds });
  });

  app.post<{ Params: { id: string } }>("/:id/rounds", async (request, reply) => {
    const input = shopRoundSchema.parse(request.body);
    const round = await createRound(request.params.id, input);
    return reply.status(201).send({ round });
  });
}

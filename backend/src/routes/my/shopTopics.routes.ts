import type { FastifyInstance } from "fastify";
import { verifyAuth } from "../../middleware/verifyAuth.js";
import { shopRoundSchema } from "../../schemas/admin.schema.js";
import { myShopTopicSchema, myUpdateShopTopicSchema } from "../../schemas/my.schema.js";
import { createOwnShopTopic, deleteShopTopic, listShopTopics, updateShopTopic } from "../../services/admin/shopTopics.service.js";
import { createRound, listRoundsByTopic } from "../../services/admin/shopRounds.service.js";
import { assertCanCreateOwnContent } from "../../services/premium.service.js";

export async function myShopTopicsRoutes(app: FastifyInstance) {
  app.addHook("preHandler", verifyAuth);

  app.get("/", async (request, reply) => {
    const topics = await listShopTopics(request.parentId);
    return reply.send({ topics });
  });

  app.post("/", async (request, reply) => {
    const input = myShopTopicSchema.parse(request.body);
    await assertCanCreateOwnContent(request.parentId, "shopTopic");
    const topic = await createOwnShopTopic(request.parentId, input);
    return reply.status(201).send({ topic });
  });

  app.patch<{ Params: { id: string } }>("/:id", async (request, reply) => {
    const input = myUpdateShopTopicSchema.parse(request.body);
    const topic = await updateShopTopic(request.params.id, input, request.parentId);
    return reply.send({ topic });
  });

  app.delete<{ Params: { id: string } }>("/:id", async (request, reply) => {
    await deleteShopTopic(request.params.id, request.parentId);
    return reply.status(204).send();
  });

  app.get<{ Params: { id: string } }>("/:id/rounds", async (request, reply) => {
    const rounds = await listRoundsByTopic(request.params.id, request.parentId);
    return reply.send({ rounds });
  });

  app.post<{ Params: { id: string } }>("/:id/rounds", async (request, reply) => {
    const input = shopRoundSchema.parse(request.body);
    const round = await createRound(request.params.id, input, request.parentId);
    return reply.status(201).send({ round });
  });
}

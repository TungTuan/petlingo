import type { FastifyInstance } from "fastify";
import { verifyAuth } from "../../middleware/verifyAuth.js";
import { homeRoundSchema } from "../../schemas/admin.schema.js";
import { myHomeTopicSchema, myUpdateHomeTopicSchema } from "../../schemas/my.schema.js";
import { createOwnHomeTopic, deleteHomeTopic, listHomeTopics, updateHomeTopic } from "../../services/admin/homeTopics.service.js";
import { createRound, listRoundsByTopic } from "../../services/admin/homeRounds.service.js";
import { assertCanCreateOwnContent } from "../../services/premium.service.js";

export async function myHomeTopicsRoutes(app: FastifyInstance) {
  app.addHook("preHandler", verifyAuth);

  app.get("/", async (request, reply) => {
    const topics = await listHomeTopics(request.parentId);
    return reply.send({ topics });
  });

  app.post("/", async (request, reply) => {
    const input = myHomeTopicSchema.parse(request.body);
    await assertCanCreateOwnContent(request.parentId, "homeTopic");
    const topic = await createOwnHomeTopic(request.parentId, input);
    return reply.status(201).send({ topic });
  });

  app.patch<{ Params: { id: string } }>("/:id", async (request, reply) => {
    const input = myUpdateHomeTopicSchema.parse(request.body);
    const topic = await updateHomeTopic(request.params.id, input, request.parentId);
    return reply.send({ topic });
  });

  app.delete<{ Params: { id: string } }>("/:id", async (request, reply) => {
    await deleteHomeTopic(request.params.id, request.parentId);
    return reply.status(204).send();
  });

  app.get<{ Params: { id: string } }>("/:id/rounds", async (request, reply) => {
    const rounds = await listRoundsByTopic(request.params.id, request.parentId);
    return reply.send({ rounds });
  });

  app.post<{ Params: { id: string } }>("/:id/rounds", async (request, reply) => {
    const input = homeRoundSchema.parse(request.body);
    const round = await createRound(request.params.id, input, request.parentId);
    return reply.status(201).send({ round });
  });
}

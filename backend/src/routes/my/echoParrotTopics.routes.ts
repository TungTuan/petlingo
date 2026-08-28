import type { FastifyInstance } from "fastify";
import { verifyAuth } from "../../middleware/verifyAuth.js";
import { echoParrotRoundSchema } from "../../schemas/admin.schema.js";
import { myEchoParrotTopicSchema, myUpdateEchoParrotTopicSchema } from "../../schemas/my.schema.js";
import { createOwnEchoParrotTopic, deleteEchoParrotTopic, listEchoParrotTopics, updateEchoParrotTopic } from "../../services/admin/echoParrotTopics.service.js";
import { createRound, listRoundsByTopic } from "../../services/admin/echoParrotRounds.service.js";
import { assertCanCreateOwnContent } from "../../services/premium.service.js";

export async function myEchoParrotTopicsRoutes(app: FastifyInstance) {
  app.addHook("preHandler", verifyAuth);

  app.get("/", async (request, reply) => {
    const topics = await listEchoParrotTopics(request.parentId);
    return reply.send({ topics });
  });

  app.post("/", async (request, reply) => {
    const input = myEchoParrotTopicSchema.parse(request.body);
    await assertCanCreateOwnContent(request.parentId, "echoParrotTopic");
    const topic = await createOwnEchoParrotTopic(request.parentId, input);
    return reply.status(201).send({ topic });
  });

  app.patch<{ Params: { id: string } }>("/:id", async (request, reply) => {
    const input = myUpdateEchoParrotTopicSchema.parse(request.body);
    const topic = await updateEchoParrotTopic(request.params.id, input, request.parentId);
    return reply.send({ topic });
  });

  app.delete<{ Params: { id: string } }>("/:id", async (request, reply) => {
    await deleteEchoParrotTopic(request.params.id, request.parentId);
    return reply.status(204).send();
  });

  app.get<{ Params: { id: string } }>("/:id/rounds", async (request, reply) => {
    const rounds = await listRoundsByTopic(request.params.id, request.parentId);
    return reply.send({ rounds });
  });

  app.post<{ Params: { id: string } }>("/:id/rounds", async (request, reply) => {
    const input = echoParrotRoundSchema.parse(request.body);
    const round = await createRound(request.params.id, input, request.parentId);
    return reply.status(201).send({ round });
  });
}

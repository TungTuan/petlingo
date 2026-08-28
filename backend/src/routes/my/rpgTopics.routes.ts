import type { FastifyInstance } from "fastify";
import { verifyAuth } from "../../middleware/verifyAuth.js";
import { rpgMonsterSchema } from "../../schemas/admin.schema.js";
import { myRpgTopicSchema, myUpdateRpgTopicSchema } from "../../schemas/my.schema.js";
import { createOwnRpgTopic, deleteRpgTopic, listRpgTopics, updateRpgTopic } from "../../services/admin/rpgTopics.service.js";
import { createMonster, listMonstersByTopic } from "../../services/admin/rpgMonsters.service.js";
import { assertCanCreateOwnContent } from "../../services/premium.service.js";

export async function myRpgTopicsRoutes(app: FastifyInstance) {
  app.addHook("preHandler", verifyAuth);

  app.get("/", async (request, reply) => {
    const topics = await listRpgTopics(request.parentId);
    return reply.send({ topics });
  });

  app.post("/", async (request, reply) => {
    const input = myRpgTopicSchema.parse(request.body);
    await assertCanCreateOwnContent(request.parentId, "rpgTopic");
    const topic = await createOwnRpgTopic(request.parentId, input);
    return reply.status(201).send({ topic });
  });

  app.patch<{ Params: { id: string } }>("/:id", async (request, reply) => {
    const input = myUpdateRpgTopicSchema.parse(request.body);
    const topic = await updateRpgTopic(request.params.id, input, request.parentId);
    return reply.send({ topic });
  });

  app.delete<{ Params: { id: string } }>("/:id", async (request, reply) => {
    await deleteRpgTopic(request.params.id, request.parentId);
    return reply.status(204).send();
  });

  app.get<{ Params: { id: string } }>("/:id/monsters", async (request, reply) => {
    const monsters = await listMonstersByTopic(request.params.id, request.parentId);
    return reply.send({ monsters });
  });

  app.post<{ Params: { id: string } }>("/:id/monsters", async (request, reply) => {
    const input = rpgMonsterSchema.parse(request.body);
    const monster = await createMonster(request.params.id, input, request.parentId);
    return reply.status(201).send({ monster });
  });
}

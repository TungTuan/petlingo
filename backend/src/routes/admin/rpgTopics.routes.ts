import type { FastifyInstance } from "fastify";
import { requireAdmin } from "../../middleware/requireAdmin.js";
import { verifyAuth } from "../../middleware/verifyAuth.js";
import { rpgMonsterSchema, rpgTopicSchema, updateRpgTopicSchema } from "../../schemas/admin.schema.js";
import { createRpgTopic, deleteRpgTopic, listRpgTopics, updateRpgTopic } from "../../services/admin/rpgTopics.service.js";
import { createMonster, listMonstersByTopic } from "../../services/admin/rpgMonsters.service.js";

export async function adminRpgTopicsRoutes(app: FastifyInstance) {
  app.addHook("preHandler", verifyAuth);
  app.addHook("preHandler", requireAdmin);

  app.get("/", async (_request, reply) => {
    const topics = await listRpgTopics();
    return reply.send({ topics });
  });

  app.post("/", async (request, reply) => {
    const input = rpgTopicSchema.parse(request.body);
    const topic = await createRpgTopic(input);
    return reply.status(201).send({ topic });
  });

  app.patch<{ Params: { id: string } }>("/:id", async (request, reply) => {
    const input = updateRpgTopicSchema.parse(request.body);
    const topic = await updateRpgTopic(request.params.id, input);
    return reply.send({ topic });
  });

  app.delete<{ Params: { id: string } }>("/:id", async (request, reply) => {
    await deleteRpgTopic(request.params.id);
    return reply.status(204).send();
  });

  // Monsters are nested under their topic.
  app.get<{ Params: { id: string } }>("/:id/monsters", async (request, reply) => {
    const monsters = await listMonstersByTopic(request.params.id);
    return reply.send({ monsters });
  });

  app.post<{ Params: { id: string } }>("/:id/monsters", async (request, reply) => {
    const input = rpgMonsterSchema.parse(request.body);
    const monster = await createMonster(request.params.id, input);
    return reply.status(201).send({ monster });
  });
}

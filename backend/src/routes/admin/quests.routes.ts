import type { FastifyInstance } from "fastify";
import { requireAdmin } from "../../middleware/requireAdmin.js";
import { verifyAuth } from "../../middleware/verifyAuth.js";
import { dailyQuestSchema, updateDailyQuestSchema } from "../../schemas/admin.schema.js";
import { createQuest, deleteQuest, listQuests, updateQuest } from "../../services/admin/quests.service.js";

export async function adminQuestsRoutes(app: FastifyInstance) {
  app.addHook("preHandler", verifyAuth);
  app.addHook("preHandler", requireAdmin);

  app.get("/", async (_request, reply) => {
    const quests = await listQuests();
    return reply.send({ quests });
  });

  app.post("/", async (request, reply) => {
    const input = dailyQuestSchema.parse(request.body);
    const quest = await createQuest(input);
    return reply.status(201).send({ quest });
  });

  app.patch<{ Params: { id: string } }>("/:id", async (request, reply) => {
    const input = updateDailyQuestSchema.parse(request.body);
    const quest = await updateQuest(request.params.id, input);
    return reply.send({ quest });
  });

  app.delete<{ Params: { id: string } }>("/:id", async (request, reply) => {
    await deleteQuest(request.params.id);
    return reply.status(204).send();
  });
}

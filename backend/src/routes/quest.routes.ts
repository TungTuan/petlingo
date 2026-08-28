import type { FastifyInstance } from "fastify";
import { verifyAuth } from "../middleware/verifyAuth.js";
import { bumpQuestSchema } from "../schemas/quest.schema.js";
import { bumpQuestProgress, claimQuest, listTodayQuests } from "../services/quest.service.js";

/** Child-facing "Nhiệm vụ hôm nay" (daily quests) routes. */
export async function questRoutes(app: FastifyInstance) {
  app.addHook("preHandler", verifyAuth);

  app.get<{ Params: { id: string } }>("/:id/quests", async (request, reply) => {
    const quests = await listTodayQuests(request.params.id, request.parentId);
    return reply.send({ quests });
  });

  app.post<{ Params: { id: string; questId: string } }>("/:id/quests/:questId/claim", async (request, reply) => {
    const result = await claimQuest(request.params.id, request.parentId, request.params.questId);
    return reply.send(result);
  });

  app.post<{ Params: { id: string } }>("/:id/quests/progress", async (request, reply) => {
    const { trackKind, amount } = bumpQuestSchema.parse(request.body);
    await bumpQuestProgress(request.params.id, trackKind, amount);
    const quests = await listTodayQuests(request.params.id, request.parentId);
    return reply.send({ quests });
  });
}

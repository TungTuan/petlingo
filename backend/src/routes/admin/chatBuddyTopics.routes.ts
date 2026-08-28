import type { FastifyInstance } from "fastify";
import { requireAdmin } from "../../middleware/requireAdmin.js";
import { verifyAuth } from "../../middleware/verifyAuth.js";
import { chatBuddyRoundSchema, chatBuddyTopicSchema, updateChatBuddyTopicSchema } from "../../schemas/admin.schema.js";
import { createRound, listRoundsByTopic } from "../../services/admin/chatBuddyRounds.service.js";
import { createChatBuddyTopic, deleteChatBuddyTopic, listChatBuddyTopics, updateChatBuddyTopic } from "../../services/admin/chatBuddyTopics.service.js";

export async function adminChatBuddyTopicsRoutes(app: FastifyInstance) {
  app.addHook("preHandler", verifyAuth);
  app.addHook("preHandler", requireAdmin);

  app.get("/", async (_request, reply) => {
    const topics = await listChatBuddyTopics();
    return reply.send({ topics });
  });

  app.post("/", async (request, reply) => {
    const input = chatBuddyTopicSchema.parse(request.body);
    const topic = await createChatBuddyTopic(input);
    return reply.status(201).send({ topic });
  });

  app.patch<{ Params: { id: string } }>("/:id", async (request, reply) => {
    const input = updateChatBuddyTopicSchema.parse(request.body);
    const topic = await updateChatBuddyTopic(request.params.id, input);
    return reply.send({ topic });
  });

  app.delete<{ Params: { id: string } }>("/:id", async (request, reply) => {
    await deleteChatBuddyTopic(request.params.id);
    return reply.status(204).send();
  });

  // Rounds are nested under their topic.
  app.get<{ Params: { id: string } }>("/:id/rounds", async (request, reply) => {
    const rounds = await listRoundsByTopic(request.params.id);
    return reply.send({ rounds });
  });

  app.post<{ Params: { id: string } }>("/:id/rounds", async (request, reply) => {
    const input = chatBuddyRoundSchema.parse(request.body);
    const round = await createRound(request.params.id, input);
    return reply.status(201).send({ round });
  });
}

import type { FastifyInstance } from "fastify";
import { verifyAuth } from "../../middleware/verifyAuth.js";
import { chatBuddyRoundSchema } from "../../schemas/admin.schema.js";
import { myChatBuddyTopicSchema, myUpdateChatBuddyTopicSchema } from "../../schemas/my.schema.js";
import { createRound, listRoundsByTopic } from "../../services/admin/chatBuddyRounds.service.js";
import { createOwnChatBuddyTopic, deleteChatBuddyTopic, listChatBuddyTopics, updateChatBuddyTopic } from "../../services/admin/chatBuddyTopics.service.js";
import { assertCanCreateOwnContent } from "../../services/premium.service.js";

export async function myChatBuddyTopicsRoutes(app: FastifyInstance) {
  app.addHook("preHandler", verifyAuth);

  app.get("/", async (request, reply) => {
    const topics = await listChatBuddyTopics(request.parentId);
    return reply.send({ topics });
  });

  app.post("/", async (request, reply) => {
    const input = myChatBuddyTopicSchema.parse(request.body);
    await assertCanCreateOwnContent(request.parentId, "chatBuddyTopic");
    const topic = await createOwnChatBuddyTopic(request.parentId, input);
    return reply.status(201).send({ topic });
  });

  app.patch<{ Params: { id: string } }>("/:id", async (request, reply) => {
    const input = myUpdateChatBuddyTopicSchema.parse(request.body);
    const topic = await updateChatBuddyTopic(request.params.id, input, request.parentId);
    return reply.send({ topic });
  });

  app.delete<{ Params: { id: string } }>("/:id", async (request, reply) => {
    await deleteChatBuddyTopic(request.params.id, request.parentId);
    return reply.status(204).send();
  });

  app.get<{ Params: { id: string } }>("/:id/rounds", async (request, reply) => {
    const rounds = await listRoundsByTopic(request.params.id, request.parentId);
    return reply.send({ rounds });
  });

  app.post<{ Params: { id: string } }>("/:id/rounds", async (request, reply) => {
    const input = chatBuddyRoundSchema.parse(request.body);
    const round = await createRound(request.params.id, input, request.parentId);
    return reply.status(201).send({ round });
  });
}

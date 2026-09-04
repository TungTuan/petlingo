import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { verifyAuth } from "../middleware/verifyAuth.js";
import { acceptFriendRequest, listFriends, listMailbox, markGiftRead, removeFriendship, sendFriendRequest, sendGift, visitFriendRanch } from "../services/friend.service.js";

const codeSchema = z.object({ friendCode: z.string().trim().min(8).max(40) });
const giftSchema = z.object({ itemId: z.string().min(1), quantity: z.number().int().min(1).max(99) });

export async function friendRoutes(app: FastifyInstance) {
  app.addHook("preHandler", verifyAuth);
  app.get<{ Params: { id: string } }>("/:id/friends", async (request) => listFriends(request.params.id, request.parentId));
  app.post<{ Params: { id: string }; Body: { friendCode: string } }>("/:id/friends/requests", async (request) => sendFriendRequest(request.params.id, request.parentId, codeSchema.parse(request.body).friendCode));
  app.post<{ Params: { id: string; friendshipId: string } }>("/:id/friends/:friendshipId/accept", async (request) => ({ friendship: await acceptFriendRequest(request.params.id, request.parentId, request.params.friendshipId) }));
  app.delete<{ Params: { id: string; friendshipId: string } }>("/:id/friends/:friendshipId", async (request, reply) => { await removeFriendship(request.params.id, request.parentId, request.params.friendshipId); return reply.code(204).send(); });
  app.get<{ Params: { id: string; friendChildId: string } }>("/:id/friends/:friendChildId/ranch", async (request) => ({ ranch: await visitFriendRanch(request.params.id, request.parentId, request.params.friendChildId) }));
  app.get<{ Params: { id: string } }>("/:id/mailbox", async (request) => ({ gifts: await listMailbox(request.params.id, request.parentId) }));
  app.post<{ Params: { id: string; friendChildId: string }; Body: { itemId: string; quantity: number } }>("/:id/friends/:friendChildId/gifts", async (request) => { const body = giftSchema.parse(request.body); return sendGift(request.params.id, request.parentId, request.params.friendChildId, body.itemId, body.quantity); });
  app.patch<{ Params: { id: string; giftId: string } }>("/:id/mailbox/:giftId/read", async (request) => ({ gift: await markGiftRead(request.params.id, request.parentId, request.params.giftId) }));
}

import type { FastifyInstance } from "fastify";
import { verifyAuth } from "../middleware/verifyAuth.js";
import { createRoomSchema, joinRoomSchema } from "../schemas/fight.schema.js";
import { getLeaderboard, getMyRank } from "../services/fight/leaderboard.service.js";
import { createRoom, getRoomByCode, joinRoom, listBattleLessons } from "../services/fight/rooms.service.js";

// Joining is just typing a 6-character code — cheap enough to brute-force
// guess at scale, so it gets its own tighter limit on top of the global default.
const JOIN_RATE_LIMIT = { max: 20, timeWindow: "1 minute" };

export async function fightRoutes(app: FastifyInstance) {
  app.addHook("preHandler", verifyAuth);

  app.get("/lessons", async (request, reply) => {
    return reply.send({ lessons: await listBattleLessons(request.parentId) });
  });

  app.post("/rooms", async (request, reply) => {
    const { childId, lessonId } = createRoomSchema.parse(request.body);
    const room = await createRoom(request.parentId, childId, lessonId);
    return reply.status(201).send({ room });
  });

  app.get<{ Params: { code: string } }>("/rooms/:code", async (request, reply) => {
    return reply.send({ room: await getRoomByCode(request.params.code) });
  });

  app.post<{ Params: { code: string } }>("/rooms/:code/join", { config: { rateLimit: JOIN_RATE_LIMIT } }, async (request, reply) => {
    const { childId } = joinRoomSchema.parse(request.body);
    const room = await joinRoom(request.parentId, childId, request.params.code);
    return reply.send({ room });
  });

  // ---- Đường đua Hạng (rank ladder) ------------------------------------------

  app.get("/leaderboard", async (_request, reply) => {
    return reply.send({ leaderboard: await getLeaderboard() });
  });

  app.get<{ Params: { childId: string } }>("/rank/:childId", async (request, reply) => {
    return reply.send(await getMyRank(request.params.childId, request.parentId));
  });
}

import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { verifyAuth } from "../middleware/verifyAuth.js";
import { defeatMonster, getRpgStatus } from "../services/rpg.service.js";

const defeatSchema = z.object({ childId: z.string().trim().min(1) });

/** Word RPG's own small route group — level/XP status + the one
 * server-authoritative "you beat this monster" event. Everything else
 * (browsing dungeons/monsters) goes through the shared catalog + admin/my
 * CRUD routes, same as Shop/Home. */
export async function rpgRoutes(app: FastifyInstance) {
  app.addHook("preHandler", verifyAuth);

  app.get<{ Params: { childId: string } }>("/status/:childId", async (request, reply) => {
    return reply.send(await getRpgStatus(request.params.childId, request.parentId));
  });

  app.post<{ Params: { monsterId: string } }>("/monsters/:monsterId/defeat", async (request, reply) => {
    const { childId } = defeatSchema.parse(request.body);
    return reply.send(await defeatMonster(childId, request.parentId, request.params.monsterId));
  });
}

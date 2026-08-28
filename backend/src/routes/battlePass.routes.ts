import type { FastifyInstance } from "fastify";
import { verifyAuth } from "../middleware/verifyAuth.js";
import { claimBattlePassTierSchema } from "../schemas/admin.schema.js";
import { activateVipSeason, claimAll, claimTier, getBattlePassState } from "../services/battlePass.service.js";

/** Child-facing "Battle Pass" routes — see battlePass.service.ts's doc comments. */
export async function battlePassRoutes(app: FastifyInstance) {
  app.addHook("preHandler", verifyAuth);

  app.get<{ Params: { id: string } }>("/:id/battlepass", async (request, reply) => {
    const state = await getBattlePassState(request.params.id, request.parentId);
    return reply.send(state);
  });

  app.post<{ Params: { id: string } }>("/:id/battlepass/claim", async (request, reply) => {
    const { tier, track } = claimBattlePassTierSchema.parse(request.body);
    const result = await claimTier(request.params.id, request.parentId, tier, track);
    return reply.send(result);
  });

  app.post<{ Params: { id: string } }>("/:id/battlepass/claim-all", async (request, reply) => {
    const result = await claimAll(request.params.id, request.parentId);
    return reply.send(result);
  });

  // Demo activation — no real payment gateway yet, same as auth.service.ts's activatePremium().
  app.post<{ Params: { id: string } }>("/:id/battlepass/vip", async (request, reply) => {
    const state = await activateVipSeason(request.params.id, request.parentId);
    return reply.send(state);
  });
}

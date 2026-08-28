import type { FastifyInstance } from "fastify";
import { requireAdmin } from "../../middleware/requireAdmin.js";
import { verifyAuth } from "../../middleware/verifyAuth.js";
import { battlePassSeasonSchema, battlePassTierSchema, updateBattlePassSeasonSchema, updateBattlePassTierSchema } from "../../schemas/admin.schema.js";
import {
  adminCreateSeason,
  adminCreateTier,
  adminDeleteSeason,
  adminDeleteTier,
  adminListSeasons,
  adminListTiers,
  adminUpdateSeason,
  adminUpdateTier,
} from "../../services/battlePass.service.js";

export async function adminBattlePassRoutes(app: FastifyInstance) {
  app.addHook("preHandler", verifyAuth);
  app.addHook("preHandler", requireAdmin);

  app.get("/", async (_request, reply) => {
    const seasons = await adminListSeasons();
    return reply.send({ seasons });
  });

  app.post("/", async (request, reply) => {
    const input = battlePassSeasonSchema.parse(request.body);
    const season = await adminCreateSeason(input);
    return reply.status(201).send({ season });
  });

  app.patch<{ Params: { id: string } }>("/:id", async (request, reply) => {
    const input = updateBattlePassSeasonSchema.parse(request.body);
    const season = await adminUpdateSeason(request.params.id, input);
    return reply.send({ season });
  });

  app.delete<{ Params: { id: string } }>("/:id", async (request, reply) => {
    await adminDeleteSeason(request.params.id);
    return reply.status(204).send();
  });

  // Tiers are nested under their season — mirrors wordTrainTopics.routes.ts's shape.
  app.get<{ Params: { id: string } }>("/:id/tiers", async (request, reply) => {
    const tiers = await adminListTiers(request.params.id);
    return reply.send({ tiers });
  });

  app.post<{ Params: { id: string } }>("/:id/tiers", async (request, reply) => {
    const input = battlePassTierSchema.parse(request.body);
    const tier = await adminCreateTier(request.params.id, input);
    return reply.status(201).send({ tier });
  });

  app.patch<{ Params: { tierId: string } }>("/tiers/:tierId", async (request, reply) => {
    const input = updateBattlePassTierSchema.parse(request.body);
    const tier = await adminUpdateTier(request.params.tierId, input);
    return reply.send({ tier });
  });

  app.delete<{ Params: { tierId: string } }>("/tiers/:tierId", async (request, reply) => {
    await adminDeleteTier(request.params.tierId);
    return reply.status(204).send();
  });
}

import type { FastifyInstance } from "fastify";
import { requireAdmin } from "../../middleware/requireAdmin.js";
import { verifyAuth } from "../../middleware/verifyAuth.js";
import { updateShopRoundSchema } from "../../schemas/admin.schema.js";
import { deleteRound, updateRound } from "../../services/admin/shopRounds.service.js";

export async function adminShopRoundsRoutes(app: FastifyInstance) {
  app.addHook("preHandler", verifyAuth);
  app.addHook("preHandler", requireAdmin);

  app.patch<{ Params: { id: string } }>("/:id", async (request, reply) => {
    const input = updateShopRoundSchema.parse(request.body);
    const round = await updateRound(request.params.id, input);
    return reply.send({ round });
  });

  app.delete<{ Params: { id: string } }>("/:id", async (request, reply) => {
    await deleteRound(request.params.id);
    return reply.status(204).send();
  });
}

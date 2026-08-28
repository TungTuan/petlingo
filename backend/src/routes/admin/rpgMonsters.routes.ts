import type { FastifyInstance } from "fastify";
import { requireAdmin } from "../../middleware/requireAdmin.js";
import { verifyAuth } from "../../middleware/verifyAuth.js";
import { updateRpgMonsterSchema } from "../../schemas/admin.schema.js";
import { deleteMonster, updateMonster } from "../../services/admin/rpgMonsters.service.js";

export async function adminRpgMonstersRoutes(app: FastifyInstance) {
  app.addHook("preHandler", verifyAuth);
  app.addHook("preHandler", requireAdmin);

  app.patch<{ Params: { id: string } }>("/:id", async (request, reply) => {
    const input = updateRpgMonsterSchema.parse(request.body);
    const monster = await updateMonster(request.params.id, input);
    return reply.send({ monster });
  });

  app.delete<{ Params: { id: string } }>("/:id", async (request, reply) => {
    await deleteMonster(request.params.id);
    return reply.status(204).send();
  });
}

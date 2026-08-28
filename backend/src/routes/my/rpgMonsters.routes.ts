import type { FastifyInstance } from "fastify";
import { verifyAuth } from "../../middleware/verifyAuth.js";
import { updateRpgMonsterSchema } from "../../schemas/admin.schema.js";
import { deleteMonster, updateMonster } from "../../services/admin/rpgMonsters.service.js";

export async function myRpgMonstersRoutes(app: FastifyInstance) {
  app.addHook("preHandler", verifyAuth);

  app.patch<{ Params: { id: string } }>("/:id", async (request, reply) => {
    const input = updateRpgMonsterSchema.parse(request.body);
    const monster = await updateMonster(request.params.id, input, request.parentId);
    return reply.send({ monster });
  });

  app.delete<{ Params: { id: string } }>("/:id", async (request, reply) => {
    await deleteMonster(request.params.id, request.parentId);
    return reply.status(204).send();
  });
}

import type { FastifyInstance } from "fastify";
import { verifyAuth } from "../../middleware/verifyAuth.js";
import { updateWordCatchRoundSchema } from "../../schemas/admin.schema.js";
import { deleteRound, updateRound } from "../../services/admin/wordCatchRounds.service.js";

export async function myWordCatchRoundsRoutes(app: FastifyInstance) {
  app.addHook("preHandler", verifyAuth);

  app.patch<{ Params: { id: string } }>("/:id", async (request, reply) => {
    const input = updateWordCatchRoundSchema.parse(request.body);
    const round = await updateRound(request.params.id, input, request.parentId);
    return reply.send({ round });
  });

  app.delete<{ Params: { id: string } }>("/:id", async (request, reply) => {
    await deleteRound(request.params.id, request.parentId);
    return reply.status(204).send();
  });
}

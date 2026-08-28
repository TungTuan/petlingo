import type { FastifyInstance } from "fastify";
import { verifyAuth } from "../../middleware/verifyAuth.js";
import { updateMiniGameWordSchema } from "../../schemas/admin.schema.js";
import { deleteWord, updateWord } from "../../services/admin/miniGameWords.service.js";

export async function myMiniGameWordsRoutes(app: FastifyInstance) {
  app.addHook("preHandler", verifyAuth);

  app.patch<{ Params: { id: string } }>("/:id", async (request, reply) => {
    const input = updateMiniGameWordSchema.parse(request.body);
    const word = await updateWord(request.params.id, input, request.parentId);
    return reply.send({ word });
  });

  app.delete<{ Params: { id: string } }>("/:id", async (request, reply) => {
    await deleteWord(request.params.id, request.parentId);
    return reply.status(204).send();
  });
}

import type { FastifyInstance } from "fastify";
import { verifyAuth } from "../middleware/verifyAuth.js";
import { listSavedWords, saveWord, unsaveWord } from "../services/savedWords.service.js";

/** Child-facing "Từ đã lưu" routes — mirrors inventory.routes.ts's shape. */
export async function savedWordsRoutes(app: FastifyInstance) {
  app.addHook("preHandler", verifyAuth);

  app.get<{ Params: { id: string } }>("/:id/saved-words", async (request, reply) => {
    const words = await listSavedWords(request.params.id, request.parentId);
    return reply.send({ words });
  });

  app.post<{ Params: { id: string }; Body: { word: string } }>("/:id/saved-words", async (request, reply) => {
    const word = request.body.word?.trim();
    if (!word) return reply.status(400).send({ error: "BAD_REQUEST", message: "Thiếu từ cần lưu." });
    const words = await saveWord(request.params.id, request.parentId, word);
    return reply.send({ words });
  });

  app.delete<{ Params: { id: string; word: string } }>("/:id/saved-words/:word", async (request, reply) => {
    const words = await unsaveWord(request.params.id, request.parentId, decodeURIComponent(request.params.word));
    return reply.send({ words });
  });
}

import type { FastifyInstance } from "fastify";
import { requireAdmin } from "../../middleware/requireAdmin.js";
import { verifyAuth } from "../../middleware/verifyAuth.js";
import { updateQuestionSchema } from "../../schemas/admin.schema.js";
import { deleteQuestion, updateQuestion } from "../../services/admin/questions.service.js";

export async function adminQuestionsRoutes(app: FastifyInstance) {
  app.addHook("preHandler", verifyAuth);
  app.addHook("preHandler", requireAdmin);

  app.patch<{ Params: { id: string } }>("/:id", async (request, reply) => {
    const input = updateQuestionSchema.parse(request.body);
    const question = await updateQuestion(request.params.id, input);
    return reply.send({ question });
  });

  app.delete<{ Params: { id: string } }>("/:id", async (request, reply) => {
    await deleteQuestion(request.params.id);
    return reply.status(204).send();
  });
}

import type { FastifyInstance } from "fastify";
import { verifyAuth } from "../../middleware/verifyAuth.js";
import { updateQuestionSchema } from "../../schemas/admin.schema.js";
import { deleteQuestion, updateQuestion } from "../../services/admin/questions.service.js";

export async function myQuestionsRoutes(app: FastifyInstance) {
  app.addHook("preHandler", verifyAuth);

  app.patch<{ Params: { id: string } }>("/:id", async (request, reply) => {
    const input = updateQuestionSchema.parse(request.body);
    const question = await updateQuestion(request.params.id, input, request.parentId);
    return reply.send({ question });
  });

  app.delete<{ Params: { id: string } }>("/:id", async (request, reply) => {
    await deleteQuestion(request.params.id, request.parentId);
    return reply.status(204).send();
  });
}

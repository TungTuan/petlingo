import type { FastifyInstance } from "fastify";
import { requireAdmin } from "../../middleware/requireAdmin.js";
import { verifyAuth } from "../../middleware/verifyAuth.js";
import { questionSchema, updateLessonSchema } from "../../schemas/admin.schema.js";
import { deleteLesson, updateLesson } from "../../services/admin/lessons.service.js";
import { createQuestion, listQuestionsByLesson } from "../../services/admin/questions.service.js";

export async function adminLessonsRoutes(app: FastifyInstance) {
  app.addHook("preHandler", verifyAuth);
  app.addHook("preHandler", requireAdmin);

  app.patch<{ Params: { id: string } }>("/:id", async (request, reply) => {
    const input = updateLessonSchema.parse(request.body);
    const lesson = await updateLesson(request.params.id, input);
    return reply.send({ lesson });
  });

  app.delete<{ Params: { id: string } }>("/:id", async (request, reply) => {
    await deleteLesson(request.params.id);
    return reply.status(204).send();
  });

  // Questions are nested under their lesson.
  app.get<{ Params: { id: string } }>("/:id/questions", async (request, reply) => {
    const questions = await listQuestionsByLesson(request.params.id);
    return reply.send({ questions });
  });

  app.post<{ Params: { id: string } }>("/:id/questions", async (request, reply) => {
    const input = questionSchema.parse(request.body);
    const question = await createQuestion(request.params.id, input);
    return reply.status(201).send({ question });
  });
}

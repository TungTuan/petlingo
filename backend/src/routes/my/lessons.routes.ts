import type { FastifyInstance } from "fastify";
import { verifyAuth } from "../../middleware/verifyAuth.js";
import { myLessonSchema } from "../../schemas/my.schema.js";
import { questionSchema, updateLessonSchema } from "../../schemas/admin.schema.js";
import { createLesson, deleteLesson, listLessonsByWorld, updateLesson } from "../../services/admin/lessons.service.js";
import { createQuestion, listQuestionsByLesson } from "../../services/admin/questions.service.js";
import { assertCanCreateOwnContent } from "../../services/premium.service.js";

/**
 * Self-serve: any logged-in PARENT (not just admin) managing lessons they
 * created themselves for their own kids. Every call is scoped to
 * `request.parentId` as the ownerId — see lessons.service.ts's header
 * comment for what that scoping actually does (both a filter on reads and
 * an ownership check on writes, throwing 404 on any row that isn't theirs).
 */
export async function myLessonsRoutes(app: FastifyInstance) {
  app.addHook("preHandler", verifyAuth);

  app.post("/", async (request, reply) => {
    const { worldId, title } = myLessonSchema.parse(request.body);
    await assertCanCreateOwnContent(request.parentId, "lesson");
    const lesson = await createLesson(worldId, { title, order: 0, isActive: true }, request.parentId);
    return reply.status(201).send({ lesson });
  });

  app.get<{ Querystring: { worldId: string } }>("/", async (request, reply) => {
    const lessons = await listLessonsByWorld(request.query.worldId, request.parentId);
    return reply.send({ lessons });
  });

  app.patch<{ Params: { id: string } }>("/:id", async (request, reply) => {
    const input = updateLessonSchema.parse(request.body);
    const lesson = await updateLesson(request.params.id, input, request.parentId);
    return reply.send({ lesson });
  });

  app.delete<{ Params: { id: string } }>("/:id", async (request, reply) => {
    await deleteLesson(request.params.id, request.parentId);
    return reply.status(204).send();
  });

  app.get<{ Params: { id: string } }>("/:id/questions", async (request, reply) => {
    const questions = await listQuestionsByLesson(request.params.id, request.parentId);
    return reply.send({ questions });
  });

  app.post<{ Params: { id: string } }>("/:id/questions", async (request, reply) => {
    const input = questionSchema.parse(request.body);
    const question = await createQuestion(request.params.id, input, request.parentId);
    return reply.status(201).send({ question });
  });
}

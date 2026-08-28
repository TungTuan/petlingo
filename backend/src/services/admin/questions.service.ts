import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../middleware/errorHandler.js";
import type { QuestionInput, UpdateQuestionInput } from "../../schemas/admin.schema.js";
import { getLesson } from "./lessons.service.js";

function toClient(q: { id: string; lessonId: string; prompt: string; hint: string | null; answer: string; options: unknown; order: number; createdAt: Date; updatedAt: Date }) {
  return { ...q, options: Array.isArray(q.options) ? (q.options as string[]) : [] };
}

// Question has no parentId of its own — ownership is inherited from its
// Lesson, so every ownerId check here goes through getLesson()/the
// question's own lessonId (see questions.service.ts's getQuestionOrThrow).

export async function listQuestionsByLesson(lessonId: string, ownerId?: string) {
  await getLesson(lessonId, ownerId);
  const rows = await prisma.question.findMany({ where: { lessonId }, orderBy: [{ order: "asc" }, { createdAt: "asc" }] });
  return rows.map(toClient);
}

async function getQuestionOrThrow(id: string, ownerId?: string) {
  const question = await prisma.question.findUnique({ where: { id }, include: { lesson: true } });
  if (!question || (ownerId !== undefined && question.lesson.parentId !== ownerId)) {
    throw new AppError(404, "Không tìm thấy câu hỏi.", "QUESTION_NOT_FOUND");
  }
  return question;
}

export async function createQuestion(lessonId: string, input: QuestionInput, ownerId?: string) {
  await getLesson(lessonId, ownerId);
  const row = await prisma.question.create({ data: { ...input, hint: input.hint ?? null, lessonId } });
  return toClient(row);
}

export async function updateQuestion(id: string, input: UpdateQuestionInput, ownerId?: string) {
  const existing = await getQuestionOrThrow(id, ownerId);
  const nextOptions = input.options ?? (Array.isArray(existing.options) ? (existing.options as string[]) : []);
  const nextAnswer = input.answer ?? existing.answer;
  if (!nextOptions.includes(nextAnswer)) {
    throw new AppError(400, "Đáp án phải nằm trong danh sách lựa chọn.", "ANSWER_NOT_IN_OPTIONS");
  }
  const row = await prisma.question.update({ where: { id }, data: input });
  return toClient(row);
}

export async function deleteQuestion(id: string, ownerId?: string) {
  await getQuestionOrThrow(id, ownerId);
  await prisma.question.delete({ where: { id } });
}

import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../middleware/errorHandler.js";
import type { LessonInput, UpdateLessonInput } from "../../schemas/admin.schema.js";
import { getWorld } from "./worlds.service.js";

/**
 * `ownerId` scopes every one of these to a single parent's own lessons —
 * used by the self-serve /my/lessons routes so a parent can only manage
 * lessons they created themselves. Admin routes call these with `ownerId`
 * omitted, which skips the scoping/ownership check entirely (admin manages
 * both system lessons AND any parent's user-generated ones — moderation).
 */

export async function listLessonsByWorld(worldId: string, ownerId?: string) {
  await getWorld(worldId);
  return prisma.lesson.findMany({
    where: { worldId, ...(ownerId !== undefined ? { parentId: ownerId } : {}) },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    include: { _count: { select: { questions: true } } },
  });
}

export async function getLesson(id: string, ownerId?: string) {
  const lesson = await prisma.lesson.findUnique({ where: { id } });
  if (!lesson || (ownerId !== undefined && lesson.parentId !== ownerId)) {
    throw new AppError(404, "Không tìm thấy bài học.", "LESSON_NOT_FOUND");
  }
  return lesson;
}

export async function createLesson(worldId: string, input: LessonInput, ownerId?: string) {
  await getWorld(worldId);
  return prisma.lesson.create({ data: { ...input, worldId, parentId: ownerId ?? null } });
}

export async function updateLesson(id: string, input: UpdateLessonInput, ownerId?: string) {
  await getLesson(id, ownerId);
  return prisma.lesson.update({ where: { id }, data: input });
}

export async function deleteLesson(id: string, ownerId?: string) {
  await getLesson(id, ownerId);
  await prisma.lesson.delete({ where: { id } }); // cascades to questions
}

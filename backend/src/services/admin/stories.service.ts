import { randomUUID } from "node:crypto";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../middleware/errorHandler.js";
import type { StoryInput, UpdateStoryInput } from "../../schemas/admin.schema.js";

/** See lessons.service.ts's header comment — same ownerId scoping contract. */

export async function listStories(ownerId?: string) {
  return prisma.story.findMany({
    where: ownerId !== undefined ? { parentId: ownerId } : {},
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    include: { _count: { select: { pages: true } } },
  });
}

export async function getStory(id: string, ownerId?: string) {
  const story = await prisma.story.findUnique({ where: { id } });
  if (!story || (ownerId !== undefined && story.parentId !== ownerId)) {
    throw new AppError(404, "Không tìm thấy truyện.", "STORY_NOT_FOUND");
  }
  return story;
}

export async function createStory(input: StoryInput, ownerId?: string) {
  return prisma.story.create({ data: { ...input, parentId: ownerId ?? null } });
}

/** Self-serve create — no admin-style human `key`/`colorTheme` picking, just title + topic; everything else defaulted. */
export async function createOwnStory(ownerId: string, input: { title: string; topic: string }) {
  return prisma.story.create({
    data: { key: `u-${randomUUID()}`, parentId: ownerId, title: input.title, topic: input.topic, colorTheme: "#9B7EDE", order: 0, isActive: true },
  });
}

export async function updateStory(id: string, input: UpdateStoryInput, ownerId?: string) {
  await getStory(id, ownerId);
  return prisma.story.update({ where: { id }, data: input });
}

export async function deleteStory(id: string, ownerId?: string) {
  await getStory(id, ownerId);
  await prisma.story.delete({ where: { id } }); // cascades to pages
}

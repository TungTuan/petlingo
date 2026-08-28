import { randomUUID } from "node:crypto";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../middleware/errorHandler.js";
import type { UpdateWordCatchTopicInput, WordCatchTopicInput } from "../../schemas/admin.schema.js";

export async function listWordCatchTopics(ownerId?: string) {
  return prisma.wordCatchTopic.findMany({
    where: ownerId !== undefined ? { parentId: ownerId } : {},
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    include: { _count: { select: { rounds: true } } },
  });
}

export async function getWordCatchTopic(id: string, ownerId?: string) {
  const topic = await prisma.wordCatchTopic.findUnique({ where: { id } });
  if (!topic || (ownerId !== undefined && topic.parentId !== ownerId)) {
    throw new AppError(404, "Không tìm thấy chủ đề.", "WORDCATCH_TOPIC_NOT_FOUND");
  }
  return topic;
}

export async function createWordCatchTopic(input: WordCatchTopicInput, ownerId?: string) {
  return prisma.wordCatchTopic.create({ data: { ...input, parentId: ownerId ?? null } });
}

/** Self-serve create — no key picking, just a name. */
export async function createOwnWordCatchTopic(ownerId: string, input: { name: string }) {
  return prisma.wordCatchTopic.create({ data: { key: `u-${randomUUID()}`, parentId: ownerId, name: input.name, order: 0, isActive: true } });
}

export async function updateWordCatchTopic(id: string, input: UpdateWordCatchTopicInput, ownerId?: string) {
  await getWordCatchTopic(id, ownerId);
  return prisma.wordCatchTopic.update({ where: { id }, data: input });
}

export async function deleteWordCatchTopic(id: string, ownerId?: string) {
  await getWordCatchTopic(id, ownerId);
  await prisma.wordCatchTopic.delete({ where: { id } }); // cascades to rounds
}

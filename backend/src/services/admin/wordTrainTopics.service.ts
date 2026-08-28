import { randomUUID } from "node:crypto";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../middleware/errorHandler.js";
import type { UpdateWordTrainTopicInput, WordTrainTopicInput } from "../../schemas/admin.schema.js";

const SELF_SERVE_COLORS = ["#7CC24A", "#57C6C6", "#F5822B", "#5C7BC9", "#EF6A5A", "#9B7EDE", "#F79BB0", "#FFC93C"];

export async function listWordTrainTopics(ownerId?: string) {
  return prisma.wordTrainTopic.findMany({
    where: ownerId !== undefined ? { parentId: ownerId } : {},
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    include: { _count: { select: { rounds: true } } },
  });
}

export async function getWordTrainTopic(id: string, ownerId?: string) {
  const topic = await prisma.wordTrainTopic.findUnique({ where: { id } });
  if (!topic || (ownerId !== undefined && topic.parentId !== ownerId)) {
    throw new AppError(404, "Không tìm thấy chuyến tàu.", "WORD_TRAIN_TOPIC_NOT_FOUND");
  }
  return topic;
}

export async function createWordTrainTopic(input: WordTrainTopicInput, ownerId?: string) {
  return prisma.wordTrainTopic.create({ data: { ...input, parentId: ownerId ?? null } });
}

/** Self-serve create — no key/color picking, just a name; color is picked from a small fixed palette. */
export async function createOwnWordTrainTopic(ownerId: string, input: { name: string }) {
  const color = SELF_SERVE_COLORS[input.name.length % SELF_SERVE_COLORS.length]!;
  return prisma.wordTrainTopic.create({ data: { key: `u-${randomUUID()}`, parentId: ownerId, name: input.name, color, order: 0, isActive: true } });
}

export async function updateWordTrainTopic(id: string, input: UpdateWordTrainTopicInput, ownerId?: string) {
  await getWordTrainTopic(id, ownerId);
  return prisma.wordTrainTopic.update({ where: { id }, data: input });
}

export async function deleteWordTrainTopic(id: string, ownerId?: string) {
  await getWordTrainTopic(id, ownerId);
  await prisma.wordTrainTopic.delete({ where: { id } }); // cascades to rounds
}

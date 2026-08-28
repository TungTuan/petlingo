import { randomUUID } from "node:crypto";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../middleware/errorHandler.js";
import type { MiniGameTopicInput, UpdateMiniGameTopicInput } from "../../schemas/admin.schema.js";

const SELF_SERVE_COLORS = ["#7CC24A", "#57C6C6", "#F5822B", "#5C7BC9", "#EF6A5A", "#9B7EDE", "#F79BB0", "#FFC93C"];

export async function listMiniGameTopics(ownerId?: string) {
  return prisma.miniGameTopic.findMany({
    where: ownerId !== undefined ? { parentId: ownerId } : {},
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    include: { _count: { select: { words: true } } },
  });
}

export async function getMiniGameTopic(id: string, ownerId?: string) {
  const topic = await prisma.miniGameTopic.findUnique({ where: { id } });
  if (!topic || (ownerId !== undefined && topic.parentId !== ownerId)) {
    throw new AppError(404, "Không tìm thấy chủ đề.", "MINIGAME_TOPIC_NOT_FOUND");
  }
  return topic;
}

export async function createMiniGameTopic(input: MiniGameTopicInput, ownerId?: string) {
  return prisma.miniGameTopic.create({ data: { ...input, parentId: ownerId ?? null } });
}

/** Self-serve create — no key/color picking, just a name; color is picked from a small fixed palette. */
export async function createOwnMiniGameTopic(ownerId: string, input: { name: string }) {
  const color = SELF_SERVE_COLORS[input.name.length % SELF_SERVE_COLORS.length]!;
  return prisma.miniGameTopic.create({ data: { key: `u-${randomUUID()}`, parentId: ownerId, name: input.name, color, order: 0, isActive: true } });
}

export async function updateMiniGameTopic(id: string, input: UpdateMiniGameTopicInput, ownerId?: string) {
  await getMiniGameTopic(id, ownerId);
  return prisma.miniGameTopic.update({ where: { id }, data: input });
}

export async function deleteMiniGameTopic(id: string, ownerId?: string) {
  await getMiniGameTopic(id, ownerId);
  await prisma.miniGameTopic.delete({ where: { id } }); // cascades to words
}

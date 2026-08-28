import { randomUUID } from "node:crypto";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../middleware/errorHandler.js";
import type { ChatBuddyTopicInput, UpdateChatBuddyTopicInput } from "../../schemas/admin.schema.js";
import type { MyChatBuddyTopicInput } from "../../schemas/my.schema.js";

const SELF_SERVE_COLORS = ["#7CC24A", "#57C6C6", "#F5822B", "#5C7BC9", "#EF6A5A", "#9B7EDE", "#F79BB0", "#FFC93C"];

export async function listChatBuddyTopics(ownerId?: string) {
  return prisma.chatBuddyTopic.findMany({
    where: ownerId !== undefined ? { parentId: ownerId } : {},
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    include: { _count: { select: { rounds: true } } },
  });
}

export async function getChatBuddyTopic(id: string, ownerId?: string) {
  const topic = await prisma.chatBuddyTopic.findUnique({ where: { id } });
  if (!topic || (ownerId !== undefined && topic.parentId !== ownerId)) {
    throw new AppError(404, "Không tìm thấy chủ đề.", "CHAT_BUDDY_TOPIC_NOT_FOUND");
  }
  return topic;
}

export async function createChatBuddyTopic(input: ChatBuddyTopicInput, ownerId?: string) {
  return prisma.chatBuddyTopic.create({ data: { ...input, parentId: ownerId ?? null } });
}

/** Self-serve create — no key/color picking, just a name; color is picked from a small fixed palette. */
export async function createOwnChatBuddyTopic(ownerId: string, input: MyChatBuddyTopicInput) {
  const color = SELF_SERVE_COLORS[input.name.length % SELF_SERVE_COLORS.length]!;
  return prisma.chatBuddyTopic.create({ data: { key: `u-${randomUUID()}`, parentId: ownerId, name: input.name, color, order: 0, isActive: true } });
}

export async function updateChatBuddyTopic(id: string, input: UpdateChatBuddyTopicInput, ownerId?: string) {
  await getChatBuddyTopic(id, ownerId);
  return prisma.chatBuddyTopic.update({ where: { id }, data: input });
}

export async function deleteChatBuddyTopic(id: string, ownerId?: string) {
  await getChatBuddyTopic(id, ownerId);
  await prisma.chatBuddyTopic.delete({ where: { id } }); // cascades to rounds
}

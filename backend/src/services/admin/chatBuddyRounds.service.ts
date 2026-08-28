import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../middleware/errorHandler.js";
import type { ChatBuddyRoundData, ChatBuddyRoundInput, UpdateChatBuddyRoundInput } from "../../schemas/admin.schema.js";
import { getChatBuddyTopic } from "./chatBuddyTopics.service.js";

type RawRound = { id: string; topicId: string; data: unknown; order: number };

function toClient(r: RawRound) {
  return { ...r, data: (r.data ?? {}) as ChatBuddyRoundData };
}

function assertDataValid(data: ChatBuddyRoundData) {
  if (data.answerIndex >= data.options.length) {
    throw new AppError(400, "answerIndex phải nằm trong khoảng số lượng options.", "INVALID_CHAT_BUDDY_DATA");
  }
  if (data.optionsVi.length !== data.options.length) {
    throw new AppError(400, "optionsVi phải cùng độ dài với options.", "INVALID_CHAT_BUDDY_DATA");
  }
}

export async function listRoundsByTopic(topicId: string, ownerId?: string) {
  await getChatBuddyTopic(topicId, ownerId);
  const rows = await prisma.chatBuddyRound.findMany({ where: { topicId }, orderBy: [{ order: "asc" }, { id: "asc" }] });
  return rows.map(toClient);
}

async function getRoundOrThrow(id: string, ownerId?: string) {
  const round = await prisma.chatBuddyRound.findUnique({ where: { id }, include: { topic: true } });
  if (!round || (ownerId !== undefined && round.topic.parentId !== ownerId)) {
    throw new AppError(404, "Không tìm thấy lượt trò chuyện.", "CHAT_BUDDY_ROUND_NOT_FOUND");
  }
  return round;
}

export async function createRound(topicId: string, input: ChatBuddyRoundInput, ownerId?: string) {
  await getChatBuddyTopic(topicId, ownerId);
  assertDataValid(input.data);
  const row = await prisma.chatBuddyRound.create({ data: { topicId, data: input.data, order: input.order } });
  return toClient(row);
}

export async function updateRound(id: string, input: UpdateChatBuddyRoundInput, ownerId?: string) {
  const existing = await getRoundOrThrow(id, ownerId);
  const nextData = (input.data ?? existing.data) as ChatBuddyRoundData;
  assertDataValid(nextData);
  const row = await prisma.chatBuddyRound.update({ where: { id }, data: input });
  return toClient(row);
}

export async function deleteRound(id: string, ownerId?: string) {
  await getRoundOrThrow(id, ownerId);
  await prisma.chatBuddyRound.delete({ where: { id } });
}

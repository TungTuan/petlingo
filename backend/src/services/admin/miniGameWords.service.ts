import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../middleware/errorHandler.js";
import type { MiniGameWordInput, UpdateMiniGameWordInput } from "../../schemas/admin.schema.js";
import { getMiniGameTopic } from "./miniGameTopics.service.js";

export async function listWordsByTopic(topicId: string, ownerId?: string) {
  await getMiniGameTopic(topicId, ownerId);
  return prisma.miniGameWord.findMany({ where: { topicId }, orderBy: [{ order: "asc" }, { id: "asc" }] });
}

async function getWordOrThrow(id: string, ownerId?: string) {
  const word = await prisma.miniGameWord.findUnique({ where: { id }, include: { topic: true } });
  if (!word || (ownerId !== undefined && word.topic.parentId !== ownerId)) {
    throw new AppError(404, "Không tìm thấy từ.", "MINIGAME_WORD_NOT_FOUND");
  }
  return word;
}

export async function createWord(topicId: string, input: MiniGameWordInput, ownerId?: string) {
  await getMiniGameTopic(topicId, ownerId);
  return prisma.miniGameWord.create({ data: { ...input, topicId } });
}

export async function updateWord(id: string, input: UpdateMiniGameWordInput, ownerId?: string) {
  await getWordOrThrow(id, ownerId);
  return prisma.miniGameWord.update({ where: { id }, data: input });
}

export async function deleteWord(id: string, ownerId?: string) {
  await getWordOrThrow(id, ownerId);
  await prisma.miniGameWord.delete({ where: { id } });
}

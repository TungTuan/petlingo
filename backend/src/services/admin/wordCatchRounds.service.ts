import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../middleware/errorHandler.js";
import type { UpdateWordCatchRoundInput, WordCatchRoundInput } from "../../schemas/admin.schema.js";
import { getWordCatchTopic } from "./wordCatchTopics.service.js";

type RawRound = { id: string; topicId: string; vi: string; answer: string; options: unknown; order: number };

function toClient(r: RawRound) {
  return { ...r, options: Array.isArray(r.options) ? (r.options as string[]) : [] };
}

export async function listRoundsByTopic(topicId: string, ownerId?: string) {
  await getWordCatchTopic(topicId, ownerId);
  const rows = await prisma.wordCatchRound.findMany({ where: { topicId }, orderBy: [{ order: "asc" }, { id: "asc" }] });
  return rows.map(toClient);
}

async function getRoundOrThrow(id: string, ownerId?: string) {
  const round = await prisma.wordCatchRound.findUnique({ where: { id }, include: { topic: true } });
  if (!round || (ownerId !== undefined && round.topic.parentId !== ownerId)) {
    throw new AppError(404, "Không tìm thấy lượt chơi.", "WORDCATCH_ROUND_NOT_FOUND");
  }
  return round;
}

export async function createRound(topicId: string, input: WordCatchRoundInput, ownerId?: string) {
  await getWordCatchTopic(topicId, ownerId);
  const row = await prisma.wordCatchRound.create({ data: { ...input, topicId } });
  return toClient(row);
}

export async function updateRound(id: string, input: UpdateWordCatchRoundInput, ownerId?: string) {
  const existing = await getRoundOrThrow(id, ownerId);
  const nextOptions = input.options ?? (Array.isArray(existing.options) ? (existing.options as string[]) : []);
  const nextAnswer = input.answer ?? existing.answer;
  if (!nextOptions.includes(nextAnswer)) {
    throw new AppError(400, "Đáp án phải nằm trong danh sách lựa chọn.", "ANSWER_NOT_IN_OPTIONS");
  }
  const row = await prisma.wordCatchRound.update({ where: { id }, data: input });
  return toClient(row);
}

export async function deleteRound(id: string, ownerId?: string) {
  await getRoundOrThrow(id, ownerId);
  await prisma.wordCatchRound.delete({ where: { id } });
}

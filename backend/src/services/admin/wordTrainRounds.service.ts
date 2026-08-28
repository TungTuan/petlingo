import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../middleware/errorHandler.js";
import type { UpdateWordTrainRoundInput, WordTrainFillData, WordTrainRoundInput, WordTrainScrambleData } from "../../schemas/admin.schema.js";
import { getWordTrainTopic } from "./wordTrainTopics.service.js";

type RawRound = { id: string; topicId: string; kind: string; vi: string; data: unknown; order: number };

function toClient(r: RawRound) {
  return { ...r, data: (r.data ?? {}) as WordTrainFillData | WordTrainScrambleData };
}

function assertFillDataValid(data: WordTrainFillData) {
  if (data.blankIndex >= data.word.length || !data.options.includes(data.word[data.blankIndex]!)) {
    throw new AppError(400, "blankIndex phải nằm trong độ dài từ, và options phải chứa đúng chữ cái bị che.", "INVALID_FILL_DATA");
  }
}

export async function listRoundsByTopic(topicId: string, ownerId?: string) {
  await getWordTrainTopic(topicId, ownerId);
  const rows = await prisma.wordTrainRound.findMany({ where: { topicId }, orderBy: [{ order: "asc" }, { id: "asc" }] });
  return rows.map(toClient);
}

async function getRoundOrThrow(id: string, ownerId?: string) {
  const round = await prisma.wordTrainRound.findUnique({ where: { id }, include: { topic: true } });
  if (!round || (ownerId !== undefined && round.topic.parentId !== ownerId)) {
    throw new AppError(404, "Không tìm thấy lượt chơi.", "WORD_TRAIN_ROUND_NOT_FOUND");
  }
  return round;
}

export async function createRound(topicId: string, input: WordTrainRoundInput, ownerId?: string) {
  await getWordTrainTopic(topicId, ownerId);
  if (input.kind === "fill") assertFillDataValid(input.data);
  const row = await prisma.wordTrainRound.create({ data: { topicId, kind: input.kind, vi: input.vi, ja: input.ja, ko: input.ko, data: input.data, order: input.order } });
  return toClient(row);
}

export async function updateRound(id: string, input: UpdateWordTrainRoundInput, ownerId?: string) {
  const existing = await getRoundOrThrow(id, ownerId);
  const nextKind = input.kind ?? existing.kind;
  const nextData = input.data ?? existing.data;
  if (nextKind === "fill") assertFillDataValid(nextData as WordTrainFillData);
  const row = await prisma.wordTrainRound.update({ where: { id }, data: input });
  return toClient(row);
}

export async function deleteRound(id: string, ownerId?: string) {
  await getRoundOrThrow(id, ownerId);
  await prisma.wordTrainRound.delete({ where: { id } });
}

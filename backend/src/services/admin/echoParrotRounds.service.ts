import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../middleware/errorHandler.js";
import type { EchoParrotRoundInput, UpdateEchoParrotRoundInput } from "../../schemas/admin.schema.js";
import { getEchoParrotTopic } from "./echoParrotTopics.service.js";

export async function listRoundsByTopic(topicId: string, ownerId?: string) {
  await getEchoParrotTopic(topicId, ownerId);
  return prisma.echoParrotRound.findMany({ where: { topicId }, orderBy: [{ order: "asc" }, { id: "asc" }] });
}

async function getRoundOrThrow(id: string, ownerId?: string) {
  const round = await prisma.echoParrotRound.findUnique({ where: { id }, include: { topic: true } });
  if (!round || (ownerId !== undefined && round.topic.parentId !== ownerId)) {
    throw new AppError(404, "Không tìm thấy lượt chơi.", "ECHO_PARROT_ROUND_NOT_FOUND");
  }
  return round;
}

export async function createRound(topicId: string, input: EchoParrotRoundInput, ownerId?: string) {
  await getEchoParrotTopic(topicId, ownerId);
  return prisma.echoParrotRound.create({ data: { topicId, ...input } });
}

export async function updateRound(id: string, input: UpdateEchoParrotRoundInput, ownerId?: string) {
  await getRoundOrThrow(id, ownerId);
  return prisma.echoParrotRound.update({ where: { id }, data: input });
}

export async function deleteRound(id: string, ownerId?: string) {
  await getRoundOrThrow(id, ownerId);
  await prisma.echoParrotRound.delete({ where: { id } });
}

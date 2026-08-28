import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../middleware/errorHandler.js";
import type { RpgMonsterInput, RpgQuestion, UpdateRpgMonsterInput } from "../../schemas/admin.schema.js";
import { getRpgTopic } from "./rpgTopics.service.js";

type RawMonster = { id: string; topicId: string; name: string; emoji: string; isBoss: boolean; questions: unknown; order: number };

function toClient(m: RawMonster) {
  return { ...m, questions: Array.isArray(m.questions) ? (m.questions as RpgQuestion[]) : [] };
}

export async function listMonstersByTopic(topicId: string, ownerId?: string) {
  await getRpgTopic(topicId, ownerId);
  const rows = await prisma.rpgMonster.findMany({ where: { topicId }, orderBy: [{ order: "asc" }, { id: "asc" }] });
  return rows.map(toClient);
}

async function getMonsterOrThrow(id: string, ownerId?: string) {
  const monster = await prisma.rpgMonster.findUnique({ where: { id }, include: { topic: true } });
  if (!monster || (ownerId !== undefined && monster.topic.parentId !== ownerId)) {
    throw new AppError(404, "Không tìm thấy quái vật.", "RPG_MONSTER_NOT_FOUND");
  }
  return monster;
}

export async function createMonster(topicId: string, input: RpgMonsterInput, ownerId?: string) {
  await getRpgTopic(topicId, ownerId);
  const row = await prisma.rpgMonster.create({ data: { ...input, topicId } });
  return toClient(row);
}

export async function updateMonster(id: string, input: UpdateRpgMonsterInput, ownerId?: string) {
  await getMonsterOrThrow(id, ownerId);
  const row = await prisma.rpgMonster.update({ where: { id }, data: input });
  return toClient(row);
}

export async function deleteMonster(id: string, ownerId?: string) {
  await getMonsterOrThrow(id, ownerId);
  await prisma.rpgMonster.delete({ where: { id } });
}

import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../middleware/errorHandler.js";
import type { HomeObject, HomeRoundInput, HomeZone, UpdateHomeRoundInput } from "../../schemas/admin.schema.js";
import { getHomeTopic } from "./homeTopics.service.js";

type RawRound = { id: string; topicId: string; instructionEn: string; instructionVi: string; objects: unknown; correctObjectKey: string; zones: unknown; correctZoneKey: string; order: number };

function toClient(r: RawRound) {
  return { ...r, objects: Array.isArray(r.objects) ? (r.objects as HomeObject[]) : [], zones: Array.isArray(r.zones) ? (r.zones as HomeZone[]) : [] };
}

function assertKeysResolve(objects: HomeObject[], correctObjectKey: string, zones: HomeZone[], correctZoneKey: string) {
  if (!objects.some((o) => o.key === correctObjectKey)) throw new AppError(400, "correctObjectKey phải trùng 1 key trong objects.", "OBJECT_KEY_NOT_FOUND");
  if (!zones.some((z) => z.key === correctZoneKey)) throw new AppError(400, "correctZoneKey phải trùng 1 key trong zones.", "ZONE_KEY_NOT_FOUND");
}

export async function listRoundsByTopic(topicId: string, ownerId?: string) {
  await getHomeTopic(topicId, ownerId);
  const rows = await prisma.homeRound.findMany({ where: { topicId }, orderBy: [{ order: "asc" }, { id: "asc" }] });
  return rows.map(toClient);
}

async function getRoundOrThrow(id: string, ownerId?: string) {
  const round = await prisma.homeRound.findUnique({ where: { id }, include: { topic: true } });
  if (!round || (ownerId !== undefined && round.topic.parentId !== ownerId)) {
    throw new AppError(404, "Không tìm thấy lượt chơi.", "HOME_ROUND_NOT_FOUND");
  }
  return round;
}

export async function createRound(topicId: string, input: HomeRoundInput, ownerId?: string) {
  await getHomeTopic(topicId, ownerId);
  const row = await prisma.homeRound.create({ data: { ...input, topicId } });
  return toClient(row);
}

export async function updateRound(id: string, input: UpdateHomeRoundInput, ownerId?: string) {
  const existing = await getRoundOrThrow(id, ownerId);
  const nextObjects = input.objects ?? (Array.isArray(existing.objects) ? (existing.objects as HomeObject[]) : []);
  const nextCorrectObjectKey = input.correctObjectKey ?? existing.correctObjectKey;
  const nextZones = input.zones ?? (Array.isArray(existing.zones) ? (existing.zones as HomeZone[]) : []);
  const nextCorrectZoneKey = input.correctZoneKey ?? existing.correctZoneKey;
  assertKeysResolve(nextObjects, nextCorrectObjectKey, nextZones, nextCorrectZoneKey);
  const row = await prisma.homeRound.update({ where: { id }, data: input });
  return toClient(row);
}

export async function deleteRound(id: string, ownerId?: string) {
  await getRoundOrThrow(id, ownerId);
  await prisma.homeRound.delete({ where: { id } });
}

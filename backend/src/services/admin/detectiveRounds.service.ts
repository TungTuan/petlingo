import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../middleware/errorHandler.js";
import type { DetectiveAccuseData, DetectiveInterrogateData, DetectiveRoundInput, UpdateDetectiveRoundInput } from "../../schemas/admin.schema.js";
import { getDetectiveCase } from "./detectiveCases.service.js";

type RawRound = { id: string; caseId: string; kind: string; vi: string; data: unknown; order: number };

function toClient(r: RawRound) {
  return { ...r, data: (r.data ?? {}) as DetectiveInterrogateData | DetectiveAccuseData };
}

function assertInterrogateDataValid(data: DetectiveInterrogateData) {
  if (data.answerIndex >= data.options.length) {
    throw new AppError(400, "answerIndex phải nằm trong khoảng số lượng options.", "INVALID_INTERROGATE_DATA");
  }
}

function assertAccuseDataValid(data: DetectiveAccuseData) {
  if (!data.suspects.includes(data.correctSuspect)) {
    throw new AppError(400, "correctSuspect phải nằm trong danh sách suspects.", "INVALID_ACCUSE_DATA");
  }
}

export async function listRoundsByCase(caseId: string, ownerId?: string) {
  await getDetectiveCase(caseId, ownerId);
  const rows = await prisma.detectiveRound.findMany({ where: { caseId }, orderBy: [{ order: "asc" }, { id: "asc" }] });
  return rows.map(toClient);
}

async function getRoundOrThrow(id: string, ownerId?: string) {
  const round = await prisma.detectiveRound.findUnique({ where: { id }, include: { case: true } });
  if (!round || (ownerId !== undefined && round.case.parentId !== ownerId)) {
    throw new AppError(404, "Không tìm thấy lượt hỏi cung.", "DETECTIVE_ROUND_NOT_FOUND");
  }
  return round;
}

export async function createRound(caseId: string, input: DetectiveRoundInput, ownerId?: string) {
  await getDetectiveCase(caseId, ownerId);
  if (input.kind === "interrogate") assertInterrogateDataValid(input.data);
  else assertAccuseDataValid(input.data);
  const row = await prisma.detectiveRound.create({ data: { caseId, kind: input.kind, vi: input.vi, ja: input.ja, ko: input.ko, data: input.data, order: input.order } });
  return toClient(row);
}

export async function updateRound(id: string, input: UpdateDetectiveRoundInput, ownerId?: string) {
  const existing = await getRoundOrThrow(id, ownerId);
  const nextKind = input.kind ?? existing.kind;
  const nextData = input.data ?? existing.data;
  if (nextKind === "interrogate") assertInterrogateDataValid(nextData as DetectiveInterrogateData);
  else assertAccuseDataValid(nextData as DetectiveAccuseData);
  const row = await prisma.detectiveRound.update({ where: { id }, data: input });
  return toClient(row);
}

export async function deleteRound(id: string, ownerId?: string) {
  await getRoundOrThrow(id, ownerId);
  await prisma.detectiveRound.delete({ where: { id } });
}

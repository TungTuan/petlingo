import { randomUUID } from "node:crypto";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../middleware/errorHandler.js";
import type { DetectiveCaseInput, UpdateDetectiveCaseInput } from "../../schemas/admin.schema.js";
import type { MyDetectiveCaseInput } from "../../schemas/my.schema.js";

const SELF_SERVE_COLORS = ["#7CC24A", "#57C6C6", "#F5822B", "#5C7BC9", "#EF6A5A", "#9B7EDE", "#F79BB0", "#FFC93C"];

export async function listDetectiveCases(ownerId?: string) {
  return prisma.detectiveCase.findMany({
    where: ownerId !== undefined ? { parentId: ownerId } : {},
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    include: { _count: { select: { rounds: true } } },
  });
}

export async function getDetectiveCase(id: string, ownerId?: string) {
  const detectiveCase = await prisma.detectiveCase.findUnique({ where: { id } });
  if (!detectiveCase || (ownerId !== undefined && detectiveCase.parentId !== ownerId)) {
    throw new AppError(404, "Không tìm thấy vụ án.", "DETECTIVE_CASE_NOT_FOUND");
  }
  return detectiveCase;
}

export async function createDetectiveCase(input: DetectiveCaseInput, ownerId?: string) {
  return prisma.detectiveCase.create({ data: { ...input, parentId: ownerId ?? null } });
}

/** Self-serve create — no key/color picking, a parent supplies name + scenario; color comes from a small fixed palette. */
export async function createOwnDetectiveCase(ownerId: string, input: MyDetectiveCaseInput) {
  const color = SELF_SERVE_COLORS[input.name.length % SELF_SERVE_COLORS.length]!;
  return prisma.detectiveCase.create({
    data: { key: `u-${randomUUID()}`, parentId: ownerId, name: input.name, scenario: input.scenario, scenarioVi: input.scenarioVi, color, order: 0, isActive: true },
  });
}

export async function updateDetectiveCase(id: string, input: UpdateDetectiveCaseInput, ownerId?: string) {
  await getDetectiveCase(id, ownerId);
  return prisma.detectiveCase.update({ where: { id }, data: input });
}

export async function deleteDetectiveCase(id: string, ownerId?: string) {
  await getDetectiveCase(id, ownerId);
  await prisma.detectiveCase.delete({ where: { id } }); // cascades to rounds
}

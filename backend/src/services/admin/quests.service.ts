import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../middleware/errorHandler.js";
import type { DailyQuestInput, UpdateDailyQuestInput } from "../../schemas/admin.schema.js";

export async function listQuests() {
  return prisma.dailyQuest.findMany({ orderBy: [{ order: "asc" }, { createdAt: "asc" }] });
}

export async function createQuest(input: DailyQuestInput) {
  const existing = await prisma.dailyQuest.findUnique({ where: { key: input.key } });
  if (existing) throw new AppError(409, "Đã có nhiệm vụ dùng key này.", "QUEST_KEY_TAKEN");
  return prisma.dailyQuest.create({ data: input });
}

export async function updateQuest(id: string, input: UpdateDailyQuestInput) {
  const existing = await prisma.dailyQuest.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, "Không tìm thấy nhiệm vụ.", "QUEST_NOT_FOUND");
  if (input.key && input.key !== existing.key) {
    const clash = await prisma.dailyQuest.findUnique({ where: { key: input.key } });
    if (clash) throw new AppError(409, "Đã có nhiệm vụ dùng key này.", "QUEST_KEY_TAKEN");
  }
  return prisma.dailyQuest.update({ where: { id }, data: input });
}

export async function deleteQuest(id: string) {
  const existing = await prisma.dailyQuest.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, "Không tìm thấy nhiệm vụ.", "QUEST_NOT_FOUND");
  await prisma.dailyQuest.delete({ where: { id } });
}

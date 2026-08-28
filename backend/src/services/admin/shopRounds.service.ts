import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../middleware/errorHandler.js";
import type { ShopRequiredItem, ShopRoundInput, ShopShelfItem, UpdateShopRoundInput } from "../../schemas/admin.schema.js";
import { getShopTopic } from "./shopTopics.service.js";

type RawRound = { id: string; topicId: string; instructionEn: string; instructionVi: string; shelf: unknown; required: unknown; order: number };

function toClient(r: RawRound) {
  return { ...r, shelf: Array.isArray(r.shelf) ? (r.shelf as ShopShelfItem[]) : [], required: Array.isArray(r.required) ? (r.required as ShopRequiredItem[]) : [] };
}

function assertShelfCoversRequired(shelf: ShopShelfItem[], required: ShopRequiredItem[]) {
  const short = required.find((req) => shelf.filter((s) => s.en === req.en).length < req.qty);
  if (short) throw new AppError(400, "Kệ hàng phải có đủ số lượng mỗi món cần mua.", "SHELF_TOO_SHORT");
}

export async function listRoundsByTopic(topicId: string, ownerId?: string) {
  await getShopTopic(topicId, ownerId);
  const rows = await prisma.shopRound.findMany({ where: { topicId }, orderBy: [{ order: "asc" }, { id: "asc" }] });
  return rows.map(toClient);
}

async function getRoundOrThrow(id: string, ownerId?: string) {
  const round = await prisma.shopRound.findUnique({ where: { id }, include: { topic: true } });
  if (!round || (ownerId !== undefined && round.topic.parentId !== ownerId)) {
    throw new AppError(404, "Không tìm thấy lượt chơi.", "SHOP_ROUND_NOT_FOUND");
  }
  return round;
}

export async function createRound(topicId: string, input: ShopRoundInput, ownerId?: string) {
  await getShopTopic(topicId, ownerId);
  const row = await prisma.shopRound.create({ data: { ...input, topicId } });
  return toClient(row);
}

export async function updateRound(id: string, input: UpdateShopRoundInput, ownerId?: string) {
  const existing = await getRoundOrThrow(id, ownerId);
  const nextShelf = input.shelf ?? (Array.isArray(existing.shelf) ? (existing.shelf as ShopShelfItem[]) : []);
  const nextRequired = input.required ?? (Array.isArray(existing.required) ? (existing.required as ShopRequiredItem[]) : []);
  assertShelfCoversRequired(nextShelf, nextRequired);
  const row = await prisma.shopRound.update({ where: { id }, data: input });
  return toClient(row);
}

export async function deleteRound(id: string, ownerId?: string) {
  await getRoundOrThrow(id, ownerId);
  await prisma.shopRound.delete({ where: { id } });
}

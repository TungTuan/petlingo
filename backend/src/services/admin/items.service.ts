import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../middleware/errorHandler.js";
import type { ItemInput, UpdateItemInput } from "../../schemas/admin.schema.js";

export async function listItems() {
  return prisma.item.findMany({ orderBy: [{ order: "asc" }, { createdAt: "asc" }] });
}

export async function createItem(input: ItemInput) {
  const existing = await prisma.item.findUnique({ where: { key: input.key } });
  if (existing) throw new AppError(409, "Đã có vật phẩm dùng key này.", "ITEM_KEY_TAKEN");
  return prisma.item.create({ data: input });
}

export async function updateItem(id: string, input: UpdateItemInput) {
  const existing = await prisma.item.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, "Không tìm thấy vật phẩm.", "ITEM_NOT_FOUND");
  if (input.key && input.key !== existing.key) {
    const clash = await prisma.item.findUnique({ where: { key: input.key } });
    if (clash) throw new AppError(409, "Đã có vật phẩm dùng key này.", "ITEM_KEY_TAKEN");
  }
  return prisma.item.update({ where: { id }, data: input });
}

export async function deleteItem(id: string) {
  const existing = await prisma.item.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, "Không tìm thấy vật phẩm.", "ITEM_NOT_FOUND");
  await prisma.item.delete({ where: { id } });
}

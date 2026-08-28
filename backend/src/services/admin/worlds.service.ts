import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../middleware/errorHandler.js";
import type { UpdateWorldInput, WorldInput } from "../../schemas/admin.schema.js";

export async function listWorlds() {
  return prisma.world.findMany({ orderBy: [{ order: "asc" }, { createdAt: "asc" }], include: { _count: { select: { lessons: true } } } });
}

export async function getWorld(id: string) {
  const world = await prisma.world.findUnique({ where: { id } });
  if (!world) throw new AppError(404, "Không tìm thấy world.", "WORLD_NOT_FOUND");
  return world;
}

export async function createWorld(input: WorldInput) {
  const existing = await prisma.world.findUnique({ where: { key: input.key } });
  if (existing) throw new AppError(409, "Đã có world dùng key này.", "WORLD_KEY_TAKEN");
  return prisma.world.create({ data: input });
}

export async function updateWorld(id: string, input: UpdateWorldInput) {
  await getWorld(id);
  if (input.key) {
    const clash = await prisma.world.findUnique({ where: { key: input.key } });
    if (clash && clash.id !== id) throw new AppError(409, "Đã có world dùng key này.", "WORLD_KEY_TAKEN");
  }
  return prisma.world.update({ where: { id }, data: input });
}

export async function deleteWorld(id: string) {
  await getWorld(id);
  await prisma.world.delete({ where: { id } }); // cascades to lessons/questions
}

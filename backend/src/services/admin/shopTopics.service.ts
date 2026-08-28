import { randomUUID } from "node:crypto";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../middleware/errorHandler.js";
import type { ShopTopicInput, UpdateShopTopicInput } from "../../schemas/admin.schema.js";

const SELF_SERVE_COLORS = ["#7CC24A", "#57C6C6", "#F5822B", "#5C7BC9", "#EF6A5A", "#9B7EDE", "#F79BB0", "#FFC93C"];

export async function listShopTopics(ownerId?: string) {
  return prisma.shopTopic.findMany({
    where: ownerId !== undefined ? { parentId: ownerId } : {},
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    include: { _count: { select: { rounds: true } } },
  });
}

export async function getShopTopic(id: string, ownerId?: string) {
  const topic = await prisma.shopTopic.findUnique({ where: { id } });
  if (!topic || (ownerId !== undefined && topic.parentId !== ownerId)) {
    throw new AppError(404, "Không tìm thấy chủ đề.", "SHOP_TOPIC_NOT_FOUND");
  }
  return topic;
}

export async function createShopTopic(input: ShopTopicInput, ownerId?: string) {
  return prisma.shopTopic.create({ data: { ...input, parentId: ownerId ?? null } });
}

/** Self-serve create — no key/color picking, just a name; color is picked from a small fixed palette. */
export async function createOwnShopTopic(ownerId: string, input: { name: string }) {
  const color = SELF_SERVE_COLORS[input.name.length % SELF_SERVE_COLORS.length]!;
  return prisma.shopTopic.create({ data: { key: `u-${randomUUID()}`, parentId: ownerId, name: input.name, color, order: 0, isActive: true } });
}

export async function updateShopTopic(id: string, input: UpdateShopTopicInput, ownerId?: string) {
  await getShopTopic(id, ownerId);
  return prisma.shopTopic.update({ where: { id }, data: input });
}

export async function deleteShopTopic(id: string, ownerId?: string) {
  await getShopTopic(id, ownerId);
  await prisma.shopTopic.delete({ where: { id } }); // cascades to rounds
}

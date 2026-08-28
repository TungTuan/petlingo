import { randomUUID } from "node:crypto";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../middleware/errorHandler.js";
import type { EchoParrotTopicInput, UpdateEchoParrotTopicInput } from "../../schemas/admin.schema.js";
import type { MyEchoParrotTopicInput } from "../../schemas/my.schema.js";

const SELF_SERVE_COLORS = ["#7CC24A", "#57C6C6", "#F5822B", "#5C7BC9", "#EF6A5A", "#9B7EDE", "#F79BB0", "#FFC93C"];

export async function listEchoParrotTopics(ownerId?: string) {
  return prisma.echoParrotTopic.findMany({
    where: ownerId !== undefined ? { parentId: ownerId } : {},
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    include: { _count: { select: { rounds: true } } },
  });
}

export async function getEchoParrotTopic(id: string, ownerId?: string) {
  const topic = await prisma.echoParrotTopic.findUnique({ where: { id } });
  if (!topic || (ownerId !== undefined && topic.parentId !== ownerId)) {
    throw new AppError(404, "Không tìm thấy chủ đề.", "ECHO_PARROT_TOPIC_NOT_FOUND");
  }
  return topic;
}

export async function createEchoParrotTopic(input: EchoParrotTopicInput, ownerId?: string) {
  return prisma.echoParrotTopic.create({ data: { ...input, parentId: ownerId ?? null } });
}

/** Self-serve create — no key/color picking, just a name; color is picked from a small fixed palette. */
export async function createOwnEchoParrotTopic(ownerId: string, input: MyEchoParrotTopicInput) {
  const color = SELF_SERVE_COLORS[input.name.length % SELF_SERVE_COLORS.length]!;
  return prisma.echoParrotTopic.create({ data: { key: `u-${randomUUID()}`, parentId: ownerId, name: input.name, color, order: 0, isActive: true } });
}

export async function updateEchoParrotTopic(id: string, input: UpdateEchoParrotTopicInput, ownerId?: string) {
  await getEchoParrotTopic(id, ownerId);
  return prisma.echoParrotTopic.update({ where: { id }, data: input });
}

export async function deleteEchoParrotTopic(id: string, ownerId?: string) {
  await getEchoParrotTopic(id, ownerId);
  await prisma.echoParrotTopic.delete({ where: { id } }); // cascades to rounds
}

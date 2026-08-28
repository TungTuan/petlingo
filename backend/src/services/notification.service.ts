import { prisma } from "../lib/prisma.js";
import { AppError } from "../middleware/errorHandler.js";

export type NotificationKind = "lesson" | "petUnlock" | "checkin" | "quest";

async function getOwnedChildOrThrow(childId: string, parentId: string) {
  const child = await prisma.child.findUnique({ where: { id: childId } });
  if (!child || child.parentId !== parentId) {
    throw new AppError(404, "Không tìm thấy hồ sơ trẻ.", "CHILD_NOT_FOUND");
  }
  return child;
}

export interface NotificationDto {
  id: string;
  kind: string;
  title: string;
  body: string;
  createdAt: Date;
  read: boolean;
}

function toDto(row: { id: string; kind: string; title: string; body: string; createdAt: Date; readAt: Date | null }): NotificationDto {
  return { id: row.id, kind: row.kind, title: row.title, body: row.body, createdAt: row.createdAt, read: row.readAt !== null };
}

/**
 * Internal helper other services call the MOMENT a real event happens
 * (pet unlocked, check-in claimed, quest claimed — see each call site's own
 * doc comment) or that notification.routes.ts calls for the one
 * client-reported kind (`lesson`, see schema.prisma's Notification doc
 * comment on why that one's different). Fire-and-forget by design: a failed
 * insert here should never fail the real action that triggered it, so every
 * call site wraps this in `.catch()` rather than `await`ing it inline with
 * the rest of a transaction.
 */
export async function createNotification(childId: string, kind: NotificationKind, title: string, body: string): Promise<void> {
  await prisma.notification.create({ data: { childId, kind, title, body } });
}

const NOTIFICATION_LIMIT = 50;

export async function listNotifications(childId: string, parentId: string): Promise<NotificationDto[]> {
  await getOwnedChildOrThrow(childId, parentId);
  const rows = await prisma.notification.findMany({ where: { childId }, orderBy: { createdAt: "desc" }, take: NOTIFICATION_LIMIT });
  return rows.map(toDto);
}

export async function markNotificationRead(childId: string, parentId: string, notificationId: string): Promise<NotificationDto[]> {
  await getOwnedChildOrThrow(childId, parentId);
  await prisma.notification.updateMany({ where: { id: notificationId, childId, readAt: null }, data: { readAt: new Date() } });
  return listNotifications(childId, parentId);
}

export async function markAllNotificationsRead(childId: string, parentId: string): Promise<NotificationDto[]> {
  await getOwnedChildOrThrow(childId, parentId);
  await prisma.notification.updateMany({ where: { childId, readAt: null }, data: { readAt: new Date() } });
  return listNotifications(childId, parentId);
}

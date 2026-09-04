import { prisma } from "../lib/prisma.js";
import { AppError } from "../middleware/errorHandler.js";
import { toProgressState } from "./progress.service.js";

async function ownedChild(childId: string, parentId: string) {
  const child = await prisma.child.findUnique({ where: { id: childId } });
  if (!child || child.parentId !== parentId) throw new AppError(404, "Không tìm thấy hồ sơ trẻ.", "CHILD_NOT_FOUND");
  return child;
}

const friendView = (row: { id: string; status: "pending" | "accepted"; requesterId: string; addresseeId: string; requester: { id: string; displayName: string; avatarId: string }; addressee: { id: string; displayName: string; avatarId: string } }, childId: string) => ({
  friendshipId: row.id,
  status: row.status,
  direction: row.requesterId === childId ? "sent" as const : "received" as const,
  friend: row.requesterId === childId ? row.addressee : row.requester,
});

const includeChildren = { requester: { select: { id: true, displayName: true, avatarId: true } }, addressee: { select: { id: true, displayName: true, avatarId: true } } } as const;

export async function listFriends(childId: string, parentId: string) {
  let child = await ownedChild(childId, parentId);
  if (!child.friendCode) child = await prisma.child.update({ where: { id: childId }, data: { friendCode: crypto.randomUUID().replaceAll("-", "") } });
  const rows = await prisma.friendship.findMany({ where: { OR: [{ requesterId: childId }, { addresseeId: childId }] }, include: includeChildren, orderBy: { createdAt: "desc" } });
  return { friendCode: child.friendCode!, friendships: rows.map((row) => friendView(row, childId)) };
}

export async function sendFriendRequest(childId: string, parentId: string, friendCode: string) {
  await ownedChild(childId, parentId);
  const target = await prisma.child.findUnique({ where: { friendCode } });
  if (!target) throw new AppError(404, "Không tìm thấy bạn với mã này.", "FRIEND_NOT_FOUND");
  if (target.id === childId) throw new AppError(400, "Bạn không thể tự kết bạn với mình.", "SELF_FRIEND");
  const existing = await prisma.friendship.findFirst({ where: { OR: [{ requesterId: childId, addresseeId: target.id }, { requesterId: target.id, addresseeId: childId }] }, include: includeChildren });
  if (existing) return friendView(existing, childId);
  const row = await prisma.friendship.create({ data: { requesterId: childId, addresseeId: target.id }, include: includeChildren });
  return friendView(row, childId);
}

export async function acceptFriendRequest(childId: string, parentId: string, friendshipId: string) {
  await ownedChild(childId, parentId);
  const found = await prisma.friendship.findFirst({ where: { id: friendshipId, addresseeId: childId, status: "pending" }, include: includeChildren });
  if (!found) throw new AppError(404, "Không tìm thấy lời mời kết bạn.", "REQUEST_NOT_FOUND");
  const row = await prisma.friendship.update({ where: { id: friendshipId }, data: { status: "accepted", acceptedAt: new Date() }, include: includeChildren });
  return friendView(row, childId);
}

export async function removeFriendship(childId: string, parentId: string, friendshipId: string) {
  await ownedChild(childId, parentId);
  const found = await prisma.friendship.findFirst({ where: { id: friendshipId, OR: [{ requesterId: childId }, { addresseeId: childId }] } });
  if (!found) throw new AppError(404, "Không tìm thấy quan hệ bạn bè.", "FRIENDSHIP_NOT_FOUND");
  await prisma.friendship.delete({ where: { id: friendshipId } });
}

export async function visitFriendRanch(childId: string, parentId: string, friendChildId: string) {
  await ownedChild(childId, parentId);
  const friendship = await prisma.friendship.findFirst({ where: { status: "accepted", OR: [{ requesterId: childId, addresseeId: friendChildId }, { requesterId: friendChildId, addresseeId: childId }] } });
  if (!friendship) throw new AppError(403, "Chỉ bạn bè đã chấp nhận mới có thể thăm trang trại.", "NOT_FRIENDS");
  const friend = await prisma.child.findUnique({ where: { id: friendChildId }, include: { progress: true, petStats: true } });
  if (!friend?.progress) throw new AppError(404, "Không tìm thấy trang trại.", "RANCH_NOT_FOUND");
  return { owner: { id: friend.id, displayName: friend.displayName, avatarId: friend.avatarId }, progress: toProgressState(friend.progress), petStats: friend.petStats };
}

export async function listMailbox(childId: string, parentId: string) {
  await ownedChild(childId, parentId);
  const gifts = await prisma.gift.findMany({
    where: { OR: [{ senderId: childId }, { receiverId: childId }] },
    include: { sender: { select: { id: true, displayName: true } }, receiver: { select: { id: true, displayName: true } }, item: true },
    orderBy: { createdAt: "desc" }, take: 100,
  });
  return gifts.map((gift) => ({ id: gift.id, direction: gift.senderId === childId ? "sent" as const : "received" as const, sender: gift.sender, receiver: gift.receiver, item: { id: gift.item.id, name: gift.item.name, imagePath: gift.item.imagePath }, quantity: gift.quantity, createdAt: gift.createdAt, readAt: gift.readAt }));
}

export async function sendGift(childId: string, parentId: string, friendChildId: string, itemId: string, quantity: number) {
  await ownedChild(childId, parentId);
  const friendship = await prisma.friendship.findFirst({ where: { status: "accepted", OR: [{ requesterId: childId, addresseeId: friendChildId }, { requesterId: friendChildId, addresseeId: childId }] } });
  if (!friendship) throw new AppError(403, "Bạn chỉ có thể tặng quà cho bạn bè đã chấp nhận.", "NOT_FRIENDS");
  const owned = await prisma.childItem.findUnique({ where: { childId_itemId: { childId, itemId } }, include: { item: true } });
  if (!owned || owned.quantity < quantity) throw new AppError(409, "Bạn không có đủ vật phẩm để tặng.", "INSUFFICIENT_ITEMS");
  const gift = await prisma.$transaction(async (tx) => {
    await tx.childItem.update({ where: { childId_itemId: { childId, itemId } }, data: { quantity: { decrement: quantity } } });
    await tx.childItem.upsert({ where: { childId_itemId: { childId: friendChildId, itemId } }, update: { quantity: { increment: quantity } }, create: { childId: friendChildId, itemId, quantity } });
    return tx.gift.create({ data: { senderId: childId, receiverId: friendChildId, itemId, quantity }, include: { sender: true, receiver: true, item: true } });
  });
  return { gift, quantity: owned.quantity - quantity, message: `Đã gửi ${quantity} ${owned.item.name}!` };
}

export async function markGiftRead(childId: string, parentId: string, giftId: string) {
  await ownedChild(childId, parentId);
  const gift = await prisma.gift.findFirst({ where: { id: giftId, receiverId: childId } });
  if (!gift) throw new AppError(404, "Không tìm thấy quà.", "GIFT_NOT_FOUND");
  return prisma.gift.update({ where: { id: giftId }, data: { readAt: new Date() } });
}

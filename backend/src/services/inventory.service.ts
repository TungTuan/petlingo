import { prisma } from "../lib/prisma.js";
import { AppError } from "../middleware/errorHandler.js";
import { addPetExperience, applyPetEffects, getPetStats, resetPetLevel, type PetStatsState } from "./petStats.service.js";
import { getProgress } from "./progress.service.js";
import type { ProgressState } from "./progress.service.js";

async function getOwnedChildOrThrow(childId: string, parentId: string) {
  const child = await prisma.child.findUnique({ where: { id: childId } });
  if (!child || child.parentId !== parentId) {
    throw new AppError(404, "Không tìm thấy hồ sơ trẻ.", "CHILD_NOT_FOUND");
  }
  return child;
}

export interface InventoryEntry {
  item: {
    id: string;
    key: string;
    name: string;
    category: string;
    color: string;
    radius: string;
    description: string;
    effects: { stat: string; delta: number }[];
    price: number;
    currency: "coin" | "gem";
    imagePath: string;
  };
  quantity: number;
}

function toEffects(json: unknown): { stat: string; delta: number }[] {
  return Array.isArray(json) ? (json as { stat: string; delta: number }[]) : [];
}

/** Only items the child actually has (quantity > 0) — an empty Bag tab is just an empty list. */
export async function listInventory(childId: string, parentId: string): Promise<InventoryEntry[]> {
  await getOwnedChildOrThrow(childId, parentId);
  const rows = await prisma.childItem.findMany({
    where: { childId, quantity: { gt: 0 } },
    include: { item: true },
    orderBy: [{ item: { order: "asc" } }],
  });
  return rows
    .filter((r) => r.item.isActive)
    .map((r) => ({
      item: { id: r.item.id, key: r.item.key, name: r.item.name, category: r.item.category, color: r.item.color, radius: r.item.radius, description: r.item.description, effects: toEffects(r.item.effects), price: r.item.price, currency: r.item.currency, imagePath: r.item.imagePath },
      quantity: r.quantity,
    }));
}

export interface UseItemResult {
  quantity: number;
  progress: ProgressState;
  petStats: PetStatsState | null;
  message: string;
}

export async function renameActivePet(childId: string, parentId: string, itemId: string, rawName: string): Promise<UseItemResult> {
  await getOwnedChildOrThrow(childId, parentId);
  const name = rawName.trim().replace(/\s+/g, " ");
  if (name.length < 2 || name.length > 16) throw new AppError(400, "Tên pet cần từ 2 đến 16 ký tự.", "INVALID_PET_NAME");

  const row = await prisma.childItem.findUnique({ where: { childId_itemId: { childId, itemId } }, include: { item: true } });
  if (!row || row.quantity <= 0) throw new AppError(400, "Bạn không còn vé đổi tên.", "OUT_OF_STOCK");
  if (!toEffects(row.item.effects).some((effect) => effect.stat === "renamePet" && effect.delta > 0)) {
    throw new AppError(400, "Vật phẩm này không thể đổi tên pet.", "INVALID_RENAME_ITEM");
  }

  const progressBeforeUse = await getProgress(childId, parentId);
  const activePetId = progressBeforeUse.activePetId ?? progressBeforeUse.unlockedPets[0];
  if (!activePetId) throw new AppError(400, "Bạn chưa có pet để đổi tên.", "PET_NOT_FOUND");

  await prisma.$transaction([
    prisma.childItem.update({ where: { childId_itemId: { childId, itemId } }, data: { quantity: { decrement: 1 } } }),
    prisma.petStats.upsert({ where: { childId_petKey: { childId, petKey: activePetId } }, update: { customName: name }, create: { childId, petKey: activePetId, customName: name } }),
  ]);

  return {
    quantity: row.quantity - 1,
    progress: await getProgress(childId, parentId),
    petStats: await getPetStats(childId, parentId, activePetId),
    message: `Pet đã có tên mới: ${name}!`,
  };
}

/**
 * Consumes 1 unit of an item and applies its effects: hunger/happiness/
 * health deltas land on the child's currently active pet's PetStats; a
 * "coins" delta is credited straight to Progress. Both happen in one DB
 * transaction so a crash mid-use can't hand out the effect without
 * decrementing the item (or vice versa).
 */
export async function useItem(childId: string, parentId: string, itemId: string): Promise<UseItemResult> {
  await getOwnedChildOrThrow(childId, parentId);

  const row = await prisma.childItem.findUnique({ where: { childId_itemId: { childId, itemId } }, include: { item: true } });
  if (!row || row.quantity <= 0) {
    throw new AppError(400, "Bạn không còn vật phẩm này.", "OUT_OF_STOCK");
  }

  const effects = toEffects(row.item.effects);
  const coinDelta = effects.filter((e) => e.stat === "coins").reduce((sum, e) => sum + e.delta, 0);
  const experienceDelta = effects.filter((e) => e.stat === "experience").reduce((sum, e) => sum + e.delta, 0);
  const resetsPetLevel = effects.some((e) => e.stat === "resetLevel" && e.delta > 0);
  const petEffects = effects.filter((e): e is { stat: "hunger" | "happiness" | "health"; delta: number } => ["hunger", "happiness", "health"].includes(e.stat));
  const hungerDelta = petEffects.filter((e) => e.stat === "hunger").reduce((sum, e) => sum + e.delta, 0);
  const progressBeforeUse = await getProgress(childId, parentId);
  const activePetId = progressBeforeUse.activePetId ?? progressBeforeUse.unlockedPets[0];

  // Validate BEFORE decrementing inventory. A rejected meal must never make
  // the child lose an item.
  if (row.item.category === "food" && activePetId) {
    const currentStats = await getPetStats(childId, parentId, activePetId);
    if (experienceDelta > 0 && currentStats.level >= 30) {
      throw new AppError(409, "Pet đã lớn rồi! Hãy dành món tăng cấp cho pet khác nhé.", "PET_MAX_LEVEL");
    }
    // Only block when the food would actually be wasted, i.e. it doesn't
    // raise hunger any further (hungerDelta > 0) and grants no XP either.
    // An item with hungerDelta <= 0 (like a "test" item that lowers hunger
    // on purpose) is never blocked by this — it's never "wasted" by an
    // already-full pet.
    if (experienceDelta <= 0 && hungerDelta > 0 && currentStats.hunger >= 100) {
      throw new AppError(409, "Pet đã no rồi! Chơi hoặc học thêm trước khi cho ăn tiếp nhé.", "PET_FULL");
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.childItem.update({ where: { childId_itemId: { childId, itemId } }, data: { quantity: { decrement: 1 } } });
    if (coinDelta !== 0) {
      await tx.progress.update({ where: { childId }, data: { coins: { increment: coinDelta } } });
    }
  });

  let petStats: PetStatsState | null = null;
  if (activePetId) {
    if (petEffects.length > 0) {
      petStats = await applyPetEffects(childId, activePetId, petEffects);
    }
    if (experienceDelta > 0) petStats = await addPetExperience(childId, activePetId, experienceDelta);
    if (resetsPetLevel) petStats = await resetPetLevel(childId, activePetId);
  }

  const progress = await getProgress(childId, parentId);
  return {
    quantity: row.quantity - 1,
    progress,
    petStats,
    message: `Đã dùng ${row.item.name}`,
  };
}

export async function listFoodShop(childId: string, parentId: string): Promise<InventoryEntry[]> {
  await getOwnedChildOrThrow(childId, parentId);
  const items = await prisma.item.findMany({
    where: { isActive: true, OR: [{ category: "food" }, { key: { in: ["dong-ho-tai-sinh", "ve-doi-ten-pet"] } }] },
    orderBy: [{ order: "asc" }],
  });
  const owned = await prisma.childItem.findMany({ where: { childId } });
  const quantities = new Map(owned.map((row) => [row.itemId, row.quantity]));
  return items.map((item) => ({
    item: { id: item.id, key: item.key, name: item.name, category: item.category, color: item.color, radius: item.radius, description: item.description, effects: toEffects(item.effects), price: item.price, currency: item.currency, imagePath: item.imagePath },
    quantity: quantities.get(item.id) ?? 0,
  }));
}

/** Home decoration catalog. Ownership is represented by ChildItem quantity,
 * so purchases share the same server-authoritative coin/gem transaction as
 * food and special items. */
export async function listHomeBackgroundShop(childId: string, parentId: string): Promise<InventoryEntry[]> {
  await getOwnedChildOrThrow(childId, parentId);
  const items = await prisma.item.findMany({
    where: { isActive: true, key: { startsWith: "background-" } },
    orderBy: [{ order: "asc" }],
  });
  const owned = await prisma.childItem.findMany({ where: { childId, itemId: { in: items.map((item) => item.id) } } });
  const quantities = new Map(owned.map((row) => [row.itemId, row.quantity]));
  return items.map((item) => ({
    item: { id: item.id, key: item.key, name: item.name, category: item.category, color: item.color, radius: item.radius, description: item.description, effects: toEffects(item.effects), price: item.price, currency: item.currency, imagePath: item.imagePath },
    quantity: quantities.get(item.id) ?? 0,
  }));
}

export async function purchaseItem(childId: string, parentId: string, itemId: string) {
  await getOwnedChildOrThrow(childId, parentId);
  const item = await prisma.item.findFirst({ where: { id: itemId, isActive: true } });
  if (!item) throw new AppError(404, "Không tìm thấy đồ ăn.", "ITEM_NOT_FOUND");
  const progress = await prisma.progress.findUnique({ where: { childId } });
  if (!progress) throw new AppError(404, "Chưa có dữ liệu tiến độ.", "PROGRESS_NOT_FOUND");
  const balance = item.currency === "coin" ? progress.coins : progress.gems;
  if (balance < item.price) throw new AppError(409, item.currency === "coin" ? "Không đủ coin." : "Không đủ kim cương.", "INSUFFICIENT_FUNDS");
  await prisma.$transaction([
    prisma.progress.update({ where: { childId }, data: item.currency === "coin" ? { coins: { decrement: item.price } } : { gems: { decrement: item.price } } }),
    prisma.childItem.upsert({ where: { childId_itemId: { childId, itemId } }, update: { quantity: { increment: 1 } }, create: { childId, itemId, quantity: 1 } }),
  ]);
  return { progress: await getProgress(childId, parentId), quantity: (await prisma.childItem.findUniqueOrThrow({ where: { childId_itemId: { childId, itemId } } })).quantity };
}

import { prisma } from "../lib/prisma.js";
import { AppError } from "../middleware/errorHandler.js";
import { createNotification } from "./notification.service.js";
import { getProgress, type ProgressState } from "./progress.service.js";

async function getOwnedChildOrThrow(childId: string, parentId: string) {
  const child = await prisma.child.findUnique({ where: { id: childId } });
  if (!child || child.parentId !== parentId) {
    throw new AppError(404, "Không tìm thấy hồ sơ trẻ.", "CHILD_NOT_FOUND");
  }
  return child;
}

export type FusableRarity = "Common" | "Rare" | "Epic";
export type FusionOutputRarity = "Rare" | "Epic" | "Legendary";
export type FusionMaterial = { petKey: string; source: "primary" | "egg" };

/**
 * "Phối pet" — trade in pets of one rarity for a shot at the next tier up.
 * Consumes exactly three owned copies of one rarity. Legendary is the final
 * tier and therefore has no outgoing recipe.
 */
const FUSION_RECIPES: Record<FusableRarity, { need: number; outputRarity: FusionOutputRarity }> = {
  Common: { need: 3, outputRarity: "Rare" },
  Rare: { need: 3, outputRarity: "Epic" },
  Epic: { need: 3, outputRarity: "Legendary" },
};

// A Legendary duplicate has no shard tier to fall back into (nothing fuses
// FROM Legendary) — a flat coin consolation instead of "wasting" the fusion.
// (LEGENDARY_DUPLICATE_COINS itself lives in progress.service.ts, shared with
// purchasePet's own duplicate-purchase handling — see its doc comment.)

export interface FusePetsResult {
  progress: ProgressState;
  outputRarity: FusionOutputRarity;
  /** Random pet egg rolled from the next rarity. */
  petKey: string;
  isNewPet: boolean;
  shardsGranted: number;
  coinsGranted: number;
}

/**
 * Quantities live in Progress.petCopies. Legacy accounts are normalized by
 * progress.service.ts so every unlocked species starts with one copy.
 */
export async function fusePets(childId: string, parentId: string, rarity: FusableRarity, materials: FusionMaterial[]): Promise<FusePetsResult> {
  await getOwnedChildOrThrow(childId, parentId);
  const progress = await prisma.progress.findUnique({ where: { childId } });
  if (!progress) throw new AppError(404, "Chưa có dữ liệu tiến độ cho hồ sơ này.", "PROGRESS_NOT_FOUND");

  const recipe = FUSION_RECIPES[rarity];
  const state = await getProgress(childId, parentId);
  const unlockedPets = state.unlockedPets;
  const petCopies = { ...state.petCopies };
  const petEggs = { ...state.petEggs };

  const catalogPetsOfRarity = await prisma.pet.findMany({ where: { rarity, isActive: true } });
  const catalogKeysOfRarity = new Set(catalogPetsOfRarity.map((p) => p.key));
  const eggCounts: Record<string, number> = {};
  const primaryCounts: Record<string, number> = {};
  for (const material of materials) {
    const target = material.source === "egg" ? eggCounts : primaryCounts;
    target[material.petKey] = (target[material.petKey] ?? 0) + 1;
  }
  const selectedKeys = new Set(materials.map((material) => material.petKey));
  const invalidSelection = materials.length !== recipe.need
    || [...selectedKeys].some((key) => !catalogKeysOfRarity.has(key))
    || Object.entries(eggCounts).some(([key, quantity]) => quantity > (petEggs[key] ?? 0))
    || Object.entries(primaryCounts).some(([key, quantity]) => quantity > 1 || !unlockedPets.includes(key));
  if (invalidSelection) {
    throw new AppError(
      400,
      `Hãy chọn đúng ${recipe.need} pet ${rarity} đang sở hữu để ghép.`,
      "FUSION_INVALID_SELECTION",
    );
  }

  for (const [key, quantity] of Object.entries(eggCounts)) {
    petEggs[key] = (petEggs[key] ?? 0) - quantity;
    petCopies[key] = (petCopies[key] ?? 0) - quantity;
  }
  const promotedKeys: string[] = [];
  const removedPrimaryKeys: string[] = [];
  for (const key of Object.keys(primaryCounts)) {
    petCopies[key] = (petCopies[key] ?? 0) - 1;
    if ((petEggs[key] ?? 0) > 0) {
      petEggs[key] = (petEggs[key] ?? 0) - 1;
      promotedKeys.push(key);
    } else {
      removedPrimaryKeys.push(key);
    }
  }
  const remainingUnlockedPets = unlockedPets.filter((key) => !removedPrimaryKeys.includes(key));

  const outputCatalog = await prisma.pet.findMany({ where: { rarity: recipe.outputRarity, isActive: true } });
  if (outputCatalog.length === 0) {
    throw new AppError(500, `Chưa có pet ${recipe.outputRarity} nào trong hệ thống để phối ra.`, "FUSION_NO_OUTPUT_POOL");
  }
  const rolled = outputCatalog[Math.floor(Math.random() * outputCatalog.length)]!;
  const alreadyOwned = remainingUnlockedPets.includes(rolled.key);
  petCopies[rolled.key] = (petCopies[rolled.key] ?? 0) + 1;
  if (alreadyOwned) petEggs[rolled.key] = (petEggs[rolled.key] ?? 0) + 1;
  else petEggs[rolled.key] = 0;
  const nextUnlockedPets = alreadyOwned ? remainingUnlockedPets : [...remainingUnlockedPets, rolled.key];
  const removedKeys = unlockedPets.filter((key) => !nextUnlockedPets.includes(key));

  await prisma.$transaction([
    ...removedKeys.map((petKey) => prisma.petStats.deleteMany({ where: { childId, petKey } })),
    ...promotedKeys.map((petKey) => prisma.petStats.updateMany({ where: { childId, petKey }, data: { level: 1, experience: 0 } })),
    prisma.progress.update({
      where: { childId },
      data: { unlockedPets: nextUnlockedPets, petCopies, petEggs, activePetId: removedKeys.includes(progress.activePetId ?? "") ? nextUnlockedPets[0] ?? null : progress.activePetId, localVersion: { increment: 1 } },
    }),
  ]);

  if (!alreadyOwned) {
    await prisma.petStats.upsert({ where: { childId_petKey: { childId, petKey: rolled.key } }, update: { level: 1, experience: 0 }, create: { childId, petKey: rolled.key } });
  }

  if (!alreadyOwned) {
    void createNotification(childId, "petUnlock", `Phối ra pet mới: ${rolled.name}`, `Phối ${recipe.need} pet ${rarity} thành công — ra được ${rolled.name} (${recipe.outputRarity}).`).catch((err) => console.warn("Failed to create pet-unlock notification:", err));
  }

  const updatedProgress = await getProgress(childId, parentId);
  return { progress: updatedProgress, outputRarity: recipe.outputRarity, petKey: rolled.key, isNewPet: !alreadyOwned, shardsGranted: 0, coinsGranted: 0 };
}

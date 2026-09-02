import { prisma } from "../lib/prisma.js";
import { clampToInt32 } from "./progress.service.js";

/**
 * Applies one reward onto a child's account — every kind here maps 1:1 to
 * something that already exists elsewhere in the game's economy
 * (coins/gems/fusion shards/a random pet egg/a catalog item), nothing
 * invented just for one feature. Extracted out of `battlePass.service.ts`
 * (2026-08-28) so `packages.service.ts` (Shop packages/first-purchase — see
 * TASKS.md) can share the exact same reward vocabulary instead of
 * reimplementing it — both a Battle Pass tier and a package's contents grant
 * "a pile of stuff", there's nothing feature-specific about applying it.
 */
export async function grantReward(childId: string, kind: string, amount: number, itemKey: string | null): Promise<void> {
  if (amount <= 0 && !kind.startsWith("petEgg")) return;
  switch (kind) {
    case "coins": {
      const progress = await prisma.progress.findUniqueOrThrow({ where: { childId } });
      await prisma.progress.update({ where: { childId }, data: { coins: clampToInt32(progress.coins + amount) } });
      return;
    }
    case "gems": {
      const progress = await prisma.progress.findUniqueOrThrow({ where: { childId } });
      await prisma.progress.update({ where: { childId }, data: { gems: clampToInt32(progress.gems + amount) } });
      return;
    }
    case "commonShards":
      await prisma.progress.update({ where: { childId }, data: { commonShards: { increment: amount } } });
      return;
    case "rareShards":
      await prisma.progress.update({ where: { childId }, data: { rareShards: { increment: amount } } });
      return;
    case "epicShards":
      await prisma.progress.update({ where: { childId }, data: { epicShards: { increment: amount } } });
      return;
    case "petEggCommon":
      return grantRandomPet(childId, "Common");
    case "petEggRare":
      return grantRandomPet(childId, "Rare");
    case "petEggEpic":
      return grantRandomPet(childId, "Epic");
    case "petEggLegendary":
      return grantRandomPet(childId, "Legendary");
    case "item": {
      if (!itemKey) return;
      const item = await prisma.item.findUnique({ where: { key: itemKey } });
      if (!item) return;
      await prisma.childItem.upsert({
        where: { childId_itemId: { childId, itemId: item.id } },
        update: { quantity: { increment: Math.max(1, amount) } },
        create: { childId, itemId: item.id, quantity: Math.max(1, amount) },
      });
      return;
    }
    default:
      return;
  }
}

/** Rolls 1 random pet of `rarity` and grants it — a NEW copy if the child
 * doesn't own that species yet (unlocks it for real, PetStats starts at
 * Level 1), or a shard/egg of that rarity if they already do (same
 * "duplicate becomes fusion material" rule the rest of the app already
 * follows — see petFusion.service.ts's doc comment). */
export async function grantRandomPet(childId: string, rarity: "Common" | "Rare" | "Epic" | "Legendary"): Promise<void> {
  const catalog = await prisma.pet.findMany({ where: { rarity, isActive: true } });
  if (catalog.length === 0) return;
  const rolled = catalog[Math.floor(Math.random() * catalog.length)]!;

  const progress = await prisma.progress.findUniqueOrThrow({ where: { childId } });
  const unlockedPets = Array.isArray(progress.unlockedPets) ? (progress.unlockedPets as string[]) : [];
  const petCopies = (progress.petCopies && typeof progress.petCopies === "object" ? (progress.petCopies as Record<string, number>) : {}) ?? {};
  const petEggs = (progress.petEggs && typeof progress.petEggs === "object" ? (progress.petEggs as Record<string, number>) : {}) ?? {};
  const alreadyOwned = unlockedPets.includes(rolled.key);

  await prisma.progress.update({
    where: { childId },
    data: {
      unlockedPets: alreadyOwned ? unlockedPets : [...unlockedPets, rolled.key],
      petCopies: { ...petCopies, [rolled.key]: (petCopies[rolled.key] ?? (alreadyOwned ? 1 : 0)) + 1 },
      petEggs: alreadyOwned ? { ...petEggs, [rolled.key]: (petEggs[rolled.key] ?? 0) + 1 } : petEggs,
      activePetId: alreadyOwned ? progress.activePetId : (progress.activePetId ?? rolled.key),
    },
  });
  if (!alreadyOwned) {
    await prisma.petStats.upsert({ where: { childId_petKey: { childId, petKey: rolled.key } }, update: {}, create: { childId, petKey: rolled.key, experience: 0, level: 1 } });
  }
}

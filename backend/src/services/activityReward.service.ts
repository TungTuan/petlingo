import { prisma } from "../lib/prisma.js";
import { AppError } from "../middleware/errorHandler.js";
import { addPetExperience, type PetStatsState } from "./petStats.service.js";
import { bumpQuestProgress } from "./quest.service.js";
import { getProgress, type ProgressState } from "./progress.service.js";

export const ACTIVITY_REWARDS = {
  memoryMatch: { coins: 40, xp: 20 },
  wordCatch: { coins: 25, xp: 15 },
  englishShop: { coins: 25, xp: 20 },
  englishHome: { coins: 50, xp: 20 },
  wordTrain: { coins: 100, xp: 15 },
  englishDetective: { coins: 60, xp: 20 },
  echoParrot: { coins: 50, xp: 15 },
  chatBuddy: { coins: 30, xp: 15 },
  story: { coins: 40, xp: 20 },
} as const;

export type RewardableActivity = keyof typeof ACTIVITY_REWARDS;

export interface ActivityRewardResult {
  progress: ProgressState;
  petStats: PetStatsState | null;
  rewardCoins: number;
  rewardXp: number;
  rewarded: boolean;
}

/** Reward days follow the product's local timezone, not the server host. */
function rewardDay(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit" })
    .formatToParts(now)
    .reduce<Record<string, string>>((result, part) => ({ ...result, [part.type]: part.value }), {});
  return `${parts.year}-${parts.month}-${parts.day}`;
}

/**
 * Persists game rewards using a server-owned reward table. The client only
 * reports which completed activity it was; it cannot choose coin/XP amounts.
 */
export async function rewardActivity(childId: string, parentId: string, activity: RewardableActivity, contentKey: string): Promise<ActivityRewardResult> {
  const child = await prisma.child.findUnique({ where: { id: childId }, include: { progress: true } });
  if (!child || child.parentId !== parentId || !child.progress) {
    throw new AppError(404, "Không tìm thấy hồ sơ trẻ.", "CHILD_NOT_FOUND");
  }

  const reward = ACTIVITY_REWARDS[activity];
  const claim = await prisma.activityRewardClaim.createMany({
    data: [{ childId, activity, contentKey, rewardDay: rewardDay(), rewardCoins: reward.coins, rewardXp: reward.xp }],
    skipDuplicates: true,
  });
  if (claim.count === 0) {
    return {
      progress: await getProgress(childId, parentId),
      petStats: null,
      rewardCoins: 0,
      rewardXp: 0,
      rewarded: false,
    };
  }

  await prisma.progress.update({ where: { childId }, data: { coins: { increment: reward.coins }, lastActiveDate: new Date() } });

  const petKey = child.progress.activePetId ?? (Array.isArray(child.progress.unlockedPets) ? (child.progress.unlockedPets as string[])[0] : undefined);
  const petStats = petKey ? await addPetExperience(childId, petKey, reward.xp) : null;
  await bumpQuestProgress(childId, "miniGame", 1);

  return {
    progress: await getProgress(childId, parentId),
    petStats,
    rewardCoins: reward.coins,
    rewardXp: reward.xp,
    rewarded: true,
  };
}

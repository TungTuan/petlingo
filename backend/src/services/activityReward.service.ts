import { prisma } from "../lib/prisma.js";
import { AppError } from "../middleware/errorHandler.js";
import { addPetExperience, type PetStatsState } from "./petStats.service.js";
import { bumpQuestProgress } from "./quest.service.js";
import { clampToInt32, getProgress, type ProgressState } from "./progress.service.js";

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
}

/**
 * Persists game rewards using a server-owned reward table. The client only
 * reports which completed activity it was; it cannot choose coin/XP amounts.
 */
export async function rewardActivity(childId: string, parentId: string, activity: RewardableActivity): Promise<ActivityRewardResult> {
  const child = await prisma.child.findUnique({ where: { id: childId }, include: { progress: true } });
  if (!child || child.parentId !== parentId || !child.progress) {
    throw new AppError(404, "Không tìm thấy hồ sơ trẻ.", "CHILD_NOT_FOUND");
  }

  const reward = ACTIVITY_REWARDS[activity];
  const nextCoins = clampToInt32(child.progress.coins + reward.coins);
  await prisma.progress.update({ where: { childId }, data: { coins: nextCoins, lastActiveDate: new Date() } });

  const petKey = child.progress.activePetId ?? (Array.isArray(child.progress.unlockedPets) ? (child.progress.unlockedPets as string[])[0] : undefined);
  const petStats = petKey ? await addPetExperience(childId, petKey, reward.xp) : null;
  await bumpQuestProgress(childId, "miniGame", 1);

  return {
    progress: await getProgress(childId, parentId),
    petStats,
    rewardCoins: reward.coins,
    rewardXp: reward.xp,
  };
}

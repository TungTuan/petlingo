import { prisma } from "../lib/prisma.js";
import { AppError } from "../middleware/errorHandler.js";
import { clampToInt32, getProgress, type ProgressState } from "./progress.service.js";
import { bumpQuestProgress } from "./quest.service.js";

export interface FlappyDragonRewardResult {
  progress: ProgressState;
  rewardCoins: number;
}

/**
 * Flappy Dragon batches its reward at game-over, avoiding one request for
 * every obstacle. The route validates and caps score at 200 before this runs.
 */
export async function rewardFlappyDragon(childId: string, parentId: string, score: number): Promise<FlappyDragonRewardResult> {
  const child = await prisma.child.findUnique({ where: { id: childId }, include: { progress: true } });
  if (!child || child.parentId !== parentId || !child.progress) {
    throw new AppError(404, "Không tìm thấy hồ sơ trẻ.", "CHILD_NOT_FOUND");
  }

  if (score > 0) {
    await prisma.progress.update({
      where: { childId },
      data: { coins: clampToInt32(child.progress.coins + score), lastActiveDate: new Date() },
    });
    await bumpQuestProgress(childId, "miniGame", 1);
  }

  return { progress: await getProgress(childId, parentId), rewardCoins: score };
}

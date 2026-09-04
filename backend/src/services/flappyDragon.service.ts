import { prisma } from "../lib/prisma.js";
import { AppError } from "../middleware/errorHandler.js";
import { getProgress, type ProgressState } from "./progress.service.js";
import { bumpQuestProgress } from "./quest.service.js";

export interface FlappyDragonRewardResult {
  progress: ProgressState;
  rewardCoins: number;
  dailyRemaining: number;
}

const FLAPPY_DAILY_COIN_CAP = 200;
const FLAPPY_CONTENT_KEY = "daily-score";

function rewardDay(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit" })
    .formatToParts(now)
    .reduce<Record<string, string>>((result, part) => ({ ...result, [part.type]: part.value }), {});
  return `${parts.year}-${parts.month}-${parts.day}`;
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

  let awarded = 0;
  let dailyTotal = 0;
  if (score > 0) {
    // Serializable keeps two simultaneous game-over requests from both seeing
    // the same old daily total and exceeding the cap.
    const result = await prisma.$transaction(async (tx) => {
      const day = rewardDay();
      const existing = await tx.activityRewardClaim.findUnique({
        where: { childId_activity_contentKey_rewardDay: { childId, activity: "flappyDragon", contentKey: FLAPPY_CONTENT_KEY, rewardDay: day } },
      });
      const current = existing?.rewardCoins ?? 0;
      const rewardCoins = Math.min(score, Math.max(0, FLAPPY_DAILY_COIN_CAP - current));
      const total = current + rewardCoins;
      await tx.activityRewardClaim.upsert({
        where: { childId_activity_contentKey_rewardDay: { childId, activity: "flappyDragon", contentKey: FLAPPY_CONTENT_KEY, rewardDay: day } },
        create: { childId, activity: "flappyDragon", contentKey: FLAPPY_CONTENT_KEY, rewardDay: day, rewardCoins: total },
        update: { rewardCoins: total },
      });
      if (rewardCoins > 0) {
        await tx.progress.update({
          where: { childId },
          data: { coins: { increment: rewardCoins }, lastActiveDate: new Date() },
        });
      }
      return { rewardCoins, total };
    }, { isolationLevel: "Serializable" });
    awarded = result.rewardCoins;
    dailyTotal = result.total;
    if (awarded > 0) {
      await bumpQuestProgress(childId, "miniGame", 1);
    }
  }

  return {
    progress: await getProgress(childId, parentId),
    rewardCoins: awarded,
    dailyRemaining: Math.max(0, FLAPPY_DAILY_COIN_CAP - dailyTotal),
  };
}

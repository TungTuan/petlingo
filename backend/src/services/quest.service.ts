import { prisma } from "../lib/prisma.js";
import { AppError } from "../middleware/errorHandler.js";
import { createNotification } from "./notification.service.js";
import { awardQuestBattlePassXpIfFullyDone } from "./battlePass.service.js";
import { clampToInt32, getProgress, type ProgressState } from "./progress.service.js";

async function getOwnedChildOrThrow(childId: string, parentId: string) {
  const child = await prisma.child.findUnique({ where: { id: childId } });
  if (!child || child.parentId !== parentId) {
    throw new AppError(404, "Không tìm thấy hồ sơ trẻ.", "CHILD_NOT_FOUND");
  }
  return child;
}

/** Midnight in the server's own local time — same "what day is it" definition used everywhere else (checkIn, computeStreak). */
function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export interface QuestWithProgress {
  id: string;
  key: string;
  title: string;
  trackKind: string;
  target: number;
  rewardCoins: number;
  color: string;
  progress: number;
  claimed: boolean;
}

/**
 * Today's quest list — one DailyQuestProgress row per active quest is
 * upserted lazily (created at 0/unclaimed the first time it's read today),
 * mirroring PetStats' lazy-create pattern.
 */
export async function listTodayQuests(childId: string, parentId: string): Promise<QuestWithProgress[]> {
  await getOwnedChildOrThrow(childId, parentId);
  const today = startOfDay(new Date());
  const quests = await prisma.dailyQuest.findMany({ where: { isActive: true }, orderBy: { order: "asc" } });

  const rows = await Promise.all(
    quests.map((q) =>
      prisma.dailyQuestProgress.upsert({
        where: { childId_questId_date: { childId, questId: q.id, date: today } },
        update: {},
        create: { childId, questId: q.id, date: today },
      }),
    ),
  );

  return quests.map((q, i) => ({
    id: q.id,
    key: q.key,
    title: q.title,
    trackKind: q.trackKind,
    target: q.target,
    rewardCoins: q.rewardCoins,
    color: q.color,
    progress: rows[i]!.progress,
    claimed: rows[i]!.claimed,
  }));
}

export interface ClaimQuestResult {
  progress: ProgressState;
  quest: QuestWithProgress;
}

/** Claims a completed quest's reward — server re-checks progress/claimed itself rather than trusting the client's "it's done" claim. */
export async function claimQuest(childId: string, parentId: string, questId: string): Promise<ClaimQuestResult> {
  await getOwnedChildOrThrow(childId, parentId);
  const today = startOfDay(new Date());

  const quest = await prisma.dailyQuest.findUnique({ where: { id: questId } });
  if (!quest || !quest.isActive) throw new AppError(404, "Không tìm thấy nhiệm vụ.", "QUEST_NOT_FOUND");

  const row = await prisma.dailyQuestProgress.findUnique({ where: { childId_questId_date: { childId, questId, date: today } } });
  if (!row || row.progress < quest.target) throw new AppError(400, "Nhiệm vụ chưa hoàn thành.", "QUEST_NOT_COMPLETE");
  if (row.claimed) throw new AppError(400, "Đã nhận thưởng nhiệm vụ này rồi.", "QUEST_ALREADY_CLAIMED");

  // Not a bare `{ increment }` — a child (or the maxed-out demo account, see
  // clampToInt32's doc comment) sitting near the int32 ceiling would crash
  // this request with a raw Postgres "value out of range" error otherwise.
  // Safe to read-then-write here (not fully atomic) since `row.claimed` above
  // already rules out a double-claim race for the same quest.
  const currentProgress = await prisma.progress.findUniqueOrThrow({ where: { childId } });
  const [updatedRow] = await prisma.$transaction([
    prisma.dailyQuestProgress.update({ where: { childId_questId_date: { childId, questId, date: today } }, data: { claimed: true } }),
    prisma.progress.update({ where: { childId }, data: { coins: clampToInt32(currentProgress.coins + quest.rewardCoins) } }),
  ]);

  void createNotification(childId, "quest", `Hoàn thành: ${quest.title}`, `+${quest.rewardCoins} coin.`).catch((err) => console.warn("Failed to create quest notification:", err));
  // Battle Pass's "full nhiệm vụ mỗi ngày = 120 điểm" — checks itself whether
  // EVERY active quest is now claimed today, so this is safe to call after
  // every single quest claim, not just the last one of the day.
  await awardQuestBattlePassXpIfFullyDone(childId).catch((err) => console.warn("Failed to award Battle Pass XP:", err));

  const progress = await getProgress(childId, parentId);
  return {
    progress,
    quest: { id: quest.id, key: quest.key, title: quest.title, trackKind: quest.trackKind, target: quest.target, rewardCoins: quest.rewardCoins, color: quest.color, progress: updatedRow!.progress, claimed: true },
  };
}

/**
 * Bumps progress on every active quest of a given trackKind by `amount`
 * (capped at each quest's target) — called only from server code that just
 * confirmed the real action happened (lesson finished, mini-game won, a
 * pet-care action applied), never directly from a client request body, so
 * progress can't be inflated by just POSTing a bigger number.
 */
export async function bumpQuestProgress(childId: string, trackKind: "lessons" | "miniGame" | "petCare", amount: number): Promise<void> {
  const today = startOfDay(new Date());
  const quests = await prisma.dailyQuest.findMany({ where: { isActive: true, trackKind } });
  if (quests.length === 0) return;

  await Promise.all(
    quests.map(async (q) => {
      const row = await prisma.dailyQuestProgress.upsert({
        where: { childId_questId_date: { childId, questId: q.id, date: today } },
        update: {},
        create: { childId, questId: q.id, date: today },
      });
      const next = Math.min(q.target, row.progress + amount);
      if (next !== row.progress) {
        await prisma.dailyQuestProgress.update({ where: { childId_questId_date: { childId, questId: q.id, date: today } }, data: { progress: next } });
      }
    }),
  );
}

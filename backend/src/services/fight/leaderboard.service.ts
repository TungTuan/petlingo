import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../middleware/errorHandler.js";
import { getNextTier, getTier } from "./rank.js";

/**
 * Global leaderboard — every child in the app who has played at least one
 * Đấu trường match, sorted by rating. Only ever exposes the parent-chosen
 * displayName + avatar (same info already shown elsewhere, e.g. Progress
 * reports) — no chat, no way to contact another family from here, matching
 * the rest of the app's "kid-safe leaderboard" stance.
 */
export async function getLeaderboard(limit = 50) {
  const rows = await prisma.progress.findMany({
    // hiddenFromRank: Settings.tsx's "Cho phép bảng xếp hạng" toggle — a
    // child who opted out never appears here, full stop (not just
    // anonymized), matching the setting's own description ("hiện tên bé
    // với bạn cùng tuổi").
    where: { hiddenFromRank: false, child: { fightParticipation: { some: {} } } },
    orderBy: { rating: "desc" },
    take: limit,
    include: { child: { select: { id: true, displayName: true, avatarId: true } } },
  });
  return rows.map((r, i) => ({
    rank: i + 1,
    childId: r.child.id,
    displayName: r.child.displayName,
    avatarId: r.child.avatarId,
    rating: r.rating,
    tier: getTier(r.rating),
  }));
}

export async function getMyRank(childId: string, parentId: string) {
  const child = await prisma.child.findUnique({ where: { id: childId } });
  if (!child || child.parentId !== parentId) {
    throw new AppError(404, "Không tìm thấy hồ sơ trẻ.", "CHILD_NOT_FOUND");
  }

  const [progress, hasPlayed] = await Promise.all([
    prisma.progress.findUnique({ where: { childId } }),
    prisma.fightParticipant.findFirst({ where: { childId } }),
  ]);
  const rating = progress?.rating ?? 0;

  if (!hasPlayed) {
    return { hasPlayed: false as const, rating: 0, tier: getTier(0), nextTier: getNextTier(0), position: null, totalPlayers: 0 };
  }

  const [higherCount, totalPlayers] = await Promise.all([
    prisma.progress.count({ where: { hiddenFromRank: false, rating: { gt: rating }, child: { fightParticipation: { some: {} } } } }),
    prisma.progress.count({ where: { hiddenFromRank: false, child: { fightParticipation: { some: {} } } } }),
  ]);

  return { hasPlayed: true as const, rating, tier: getTier(rating), nextTier: getNextTier(rating), position: higherCount + 1, totalPlayers };
}

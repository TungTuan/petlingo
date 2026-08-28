import { prisma } from "../lib/prisma.js";
import { AppError } from "../middleware/errorHandler.js";

/**
 * Word RPG's persistent character progression — separate from
 * "Đường đua Hạng" (services/fight/rank.ts) even though both are XP-ish
 * ladders, because they measure completely different things (PvP rating vs
 * solo vocabulary grinding) and shouldn't ever cross-affect each other.
 * XP is credited the instant a monster falls (see defeatMonster() below),
 * not batched at the end of a dungeon run, so a mid-run game-over never
 * takes back XP/coins already earned — same non-punishing philosophy as
 * the rank ladder's rating floor.
 */

export interface RpgLevel {
  level: number;
  minXp: number;
}

export const RPG_LEVELS: RpgLevel[] = [
  { level: 1, minXp: 0 },
  { level: 2, minXp: 50 },
  { level: 3, minXp: 120 },
  { level: 4, minXp: 220 },
  { level: 5, minXp: 350 },
  { level: 6, minXp: 520 },
  { level: 7, minXp: 750 },
  { level: 8, minXp: 1050 },
  { level: 9, minXp: 1450 },
  { level: 10, minXp: 2000 },
];

export function getLevel(xp: number): RpgLevel {
  let current = RPG_LEVELS[0]!;
  for (const lvl of RPG_LEVELS) {
    if (xp >= lvl.minXp) current = lvl;
  }
  return current;
}

export function getNextLevel(xp: number): RpgLevel | null {
  const current = getLevel(xp);
  const idx = RPG_LEVELS.findIndex((l) => l.level === current.level);
  return RPG_LEVELS[idx + 1] ?? null;
}

const MONSTER_REWARD = { coins: 15, xp: 20 };
const BOSS_REWARD = { coins: 40, xp: 50 };

async function getOwnedChildOrThrow(childId: string, parentId: string) {
  const child = await prisma.child.findUnique({ where: { id: childId } });
  if (!child || child.parentId !== parentId) {
    throw new AppError(404, "Không tìm thấy hồ sơ trẻ.", "CHILD_NOT_FOUND");
  }
  return child;
}

export async function getRpgStatus(childId: string, parentId: string) {
  await getOwnedChildOrThrow(childId, parentId);
  const progress = await prisma.progress.findUnique({ where: { childId } });
  const xp = progress?.rpgXp ?? 0;
  return { xp, level: getLevel(xp), nextLevel: getNextLevel(xp) };
}

/**
 * Credits the reward for defeating one monster. The reward AMOUNT always
 * comes from the monster's own `isBoss` flag in the DB, never from
 * anything the client sends — a client can tell us WHICH monster it beat,
 * not how much that's worth, same anti-cheat shape as claimQuest().
 */
export async function defeatMonster(childId: string, parentId: string, monsterId: string) {
  await getOwnedChildOrThrow(childId, parentId);

  const monster = await prisma.rpgMonster.findUnique({ where: { id: monsterId }, include: { topic: true } });
  if (!monster || !monster.topic.isActive) throw new AppError(404, "Không tìm thấy quái vật.", "RPG_MONSTER_NOT_FOUND");
  // A monster is playable if it belongs to system content (topic.parentId null) or this parent's own content.
  if (monster.topic.parentId !== null && monster.topic.parentId !== parentId) {
    throw new AppError(404, "Không tìm thấy quái vật.", "RPG_MONSTER_NOT_FOUND");
  }

  const reward = monster.isBoss ? BOSS_REWARD : MONSTER_REWARD;

  const before = await prisma.progress.findUnique({ where: { childId } });
  const levelBefore = getLevel(before?.rpgXp ?? 0).level;

  await prisma.progress.updateMany({ where: { childId }, data: { coins: { increment: reward.coins }, rpgXp: { increment: reward.xp } } });

  const progress = await prisma.progress.findUniqueOrThrow({ where: { childId } });
  const level = getLevel(progress.rpgXp);
  return {
    rewardCoins: reward.coins,
    rewardXp: reward.xp,
    coins: progress.coins,
    xp: progress.rpgXp,
    level,
    nextLevel: getNextLevel(progress.rpgXp),
    leveledUp: level.level > levelBefore,
  };
}

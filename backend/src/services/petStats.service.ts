import { prisma } from "../lib/prisma.js";
import { AppError } from "../middleware/errorHandler.js";
import { getProgress, type ProgressState } from "./progress.service.js";
import { bumpQuestProgress } from "./quest.service.js";

export interface PetStatsState {
  petKey: string;
  hunger: number;
  happiness: number;
  health: number;
  experience: number;
  level: number;
  experienceToNextLevel: number;
}

type Stat = "hunger" | "happiness" | "health";
const clamp = (v: number) => Math.max(0, Math.min(100, v));

async function getOwnedChildOrThrow(childId: string, parentId: string) {
  const child = await prisma.child.findUnique({ where: { id: childId } });
  if (!child || child.parentId !== parentId) {
    throw new AppError(404, "Không tìm thấy hồ sơ trẻ.", "CHILD_NOT_FOUND");
  }
  return child;
}

export const MAX_PET_LEVEL = 30;

/**
 * XP curve is exponential, not the old flat 100/level — each level needs
 * `XP_GROWTH`× the XP the one before it did, same shape most RPGs use
 * (early levels come quickly, the last few take real investment). Reaching
 * level 30 now takes ~10,700 total XP (vs. a flat 2,900 before), which is
 * the point: `petFusion.service.ts` gates fusion on "max level", so hitting
 * max level needs to mean something.
 *
 * `LEVEL_THRESHOLDS[i]` = total cumulative XP needed to REACH level `i + 1`
 * (so `LEVEL_THRESHOLDS[0] === 0` for level 1, `LEVEL_THRESHOLDS[1]` = XP to
 * reach level 2, etc.) — precomputed once at module load, not re-derived
 * per call.
 */
const XP_BASE = 50;
const XP_GROWTH = 1.12;

function xpToReachNextLevel(fromLevel: number): number {
  return Math.round(XP_BASE * XP_GROWTH ** (fromLevel - 1));
}

const LEVEL_THRESHOLDS: number[] = (() => {
  const thresholds = [0];
  for (let level = 1; level < MAX_PET_LEVEL; level++) {
    thresholds.push(thresholds[thresholds.length - 1]! + xpToReachNextLevel(level));
  }
  return thresholds;
})();
const MAX_EXPERIENCE = LEVEL_THRESHOLDS[MAX_PET_LEVEL - 1]!;

function levelForExperience(experience: number): number {
  let level = 1;
  for (let i = 1; i < LEVEL_THRESHOLDS.length; i++) {
    if (experience < LEVEL_THRESHOLDS[i]!) break;
    level = i + 1;
  }
  return level;
}

function toState(row: { petKey: string; hunger: number; happiness: number; health: number; experience: number; level: number }): PetStatsState {
  const nextThreshold = row.level >= MAX_PET_LEVEL ? null : LEVEL_THRESHOLDS[row.level]!;
  return {
    petKey: row.petKey,
    hunger: row.hunger,
    happiness: row.happiness,
    health: row.health,
    experience: row.experience,
    level: row.level,
    experienceToNextLevel: nextThreshold === null ? 0 : nextThreshold - row.experience,
  };
}

export async function addPetExperience(childId: string, petKey: string, amount: number): Promise<PetStatsState> {
  const current = await prisma.petStats.upsert({ where: { childId_petKey: { childId, petKey } }, update: {}, create: { childId, petKey } });
  const experience = Math.min(MAX_EXPERIENCE, current.experience + amount);
  const level = levelForExperience(experience);
  const saved = await prisma.petStats.update({ where: { childId_petKey: { childId, petKey } }, data: { experience, level } });
  return toState(saved);
}

/** Resets only the evolution track; care stats remain unchanged. */
export async function resetPetLevel(childId: string, petKey: string): Promise<PetStatsState> {
  await prisma.petStats.upsert({ where: { childId_petKey: { childId, petKey } }, update: {}, create: { childId, petKey } });
  const saved = await prisma.petStats.update({
    where: { childId_petKey: { childId, petKey } },
    data: { experience: 0, level: 1 },
  });
  return toState(saved);
}

export async function rewardLessonExperience(childId: string, parentId: string, petKey: string): Promise<PetStatsState> {
  await getOwnedChildOrThrow(childId, parentId);
  return addPetExperience(childId, petKey, 25);
}

/** Stats are created lazily on first read/use with the schema's defaults (70/70/70) — no separate "init a pet" step needed. */
export async function getPetStats(childId: string, parentId: string, petKey: string): Promise<PetStatsState> {
  await getOwnedChildOrThrow(childId, parentId);
  const row = await prisma.petStats.upsert({ where: { childId_petKey: { childId, petKey } }, update: {}, create: { childId, petKey } });
  return toState(row);
}

export async function applyPetEffects(childId: string, petKey: string, effects: { stat: Stat; delta: number }[]): Promise<PetStatsState> {
  const current = await prisma.petStats.upsert({ where: { childId_petKey: { childId, petKey } }, update: {}, create: { childId, petKey } });
  const next = { hunger: current.hunger, happiness: current.happiness, health: current.health };
  for (const e of effects) next[e.stat] = clamp(next[e.stat] + e.delta);
  const saved = await prisma.petStats.update({ where: { childId_petKey: { childId, petKey } }, data: next });
  return toState(saved);
}

type CareAction = "feed" | "bathe" | "play" | "sleep" | "pat";

// Same deltas/costs PetCare.tsx's ACTIONS array used to apply purely on the
// client — moved server-side so they're persisted instead of resetting on
// every reload.
const CARE_ACTIONS: Record<CareAction, { deltas: Partial<Record<Stat, number>>; coinCost: number; message: string }> = {
  feed: { deltas: { hunger: 12, health: 4 }, coinCost: 20, message: "Đã cho ăn — tốn 20 coin" },
  bathe: { deltas: { health: 8 }, coinCost: 0, message: "Sạch sẽ thơm tho!" },
  play: { deltas: { happiness: 15, hunger: -6 }, coinCost: 0, message: "Vui vẻ tăng, hơi đói hơn một chút" },
  sleep: { deltas: { health: 14, happiness: -4 }, coinCost: 0, message: "Nghỉ ngơi giúp hồi sức khoẻ" },
  pat: { deltas: { happiness: 4 }, coinCost: 0, message: "Rất thích được vuốt!" },
};

export interface CareResult {
  petStats: PetStatsState;
  progress: ProgressState;
  message: string;
}

export async function careForPet(childId: string, parentId: string, petKey: string, action: CareAction): Promise<CareResult> {
  await getOwnedChildOrThrow(childId, parentId);
  const spec = CARE_ACTIONS[action];

  if (spec.coinCost > 0) {
    const progress = await prisma.progress.findUnique({ where: { childId } });
    if (!progress || progress.coins < spec.coinCost) {
      throw new AppError(400, "Không đủ coin để làm việc này.", "NOT_ENOUGH_COINS");
    }
    await prisma.progress.update({ where: { childId }, data: { coins: { decrement: spec.coinCost } } });
  }

  const effects = (Object.entries(spec.deltas) as [Stat, number][]).map(([stat, delta]) => ({ stat, delta }));
  let petStats = await applyPetEffects(childId, petKey, effects);
  if (action === "feed") petStats = await addPetExperience(childId, petKey, 10);
  // Any real care action (feed/bathe/play/sleep/pat) counts toward the
  // "Chăm pet" daily quest — bumped here, server-side, right after the
  // action is confirmed to have happened.
  await bumpQuestProgress(childId, "petCare", 1);
  const progress = await getProgress(childId, parentId);

  return { petStats, progress, message: spec.message };
}

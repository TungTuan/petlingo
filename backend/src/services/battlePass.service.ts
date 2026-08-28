import { prisma } from "../lib/prisma.js";
import { AppError } from "../middleware/errorHandler.js";
import { clampToInt32 } from "./progress.service.js";
import type { BattlePassTierInput, UpdateBattlePassTierInput, BattlePassSeasonInput, UpdateBattlePassSeasonInput } from "../schemas/admin.schema.js";

async function getOwnedChildOrThrow(childId: string, parentId: string) {
  const child = await prisma.child.findUnique({ where: { id: childId } });
  if (!child || child.parentId !== parentId) {
    throw new AppError(404, "Không tìm thấy hồ sơ trẻ.", "CHILD_NOT_FOUND");
  }
  return child;
}

/** The one season a child can currently see/play — whichever season's date
 * range covers right now. Deliberately date-range-based (not a manual
 * "isActive" toggle) so an admin can schedule a season in advance and it
 * turns on/off itself with no extra step, and two seasons can never
 * ambiguously both be "the current one" by mistake. */
export async function getCurrentSeason(now: Date = new Date()) {
  return prisma.battlePassSeason.findFirst({ where: { startsAt: { lte: now }, endsAt: { gte: now } }, orderBy: { startsAt: "desc" } });
}

async function getOrCreateProgress(childId: string, seasonId: string) {
  return prisma.childBattlePassProgress.upsert({
    where: { childId_seasonId: { childId, seasonId } },
    update: {},
    create: { childId, seasonId },
  });
}

export interface BattlePassTierDto {
  tier: number;
  xpRequired: number;
  freeRewardKind: string;
  freeRewardAmount: number;
  freeRewardItemKey: string | null;
  vipRewardKind: string;
  vipRewardAmount: number;
  vipRewardItemKey: string | null;
  freeClaimed: boolean;
  vipClaimed: boolean;
}

export interface BattlePassStateDto {
  season: { id: string; name: string; startsAt: Date; endsAt: Date } | null;
  xp: number;
  hasVip: boolean;
  tiers: BattlePassTierDto[];
}

const NO_SEASON_STATE: BattlePassStateDto = { season: null, xp: 0, hasVip: false, tiers: [] };

export async function getBattlePassState(childId: string, parentId: string): Promise<BattlePassStateDto> {
  await getOwnedChildOrThrow(childId, parentId);
  const season = await getCurrentSeason();
  if (!season) return NO_SEASON_STATE;

  const [progress, tiers, claims] = await Promise.all([
    getOrCreateProgress(childId, season.id),
    prisma.battlePassTier.findMany({ where: { seasonId: season.id }, orderBy: { tier: "asc" } }),
    prisma.battlePassClaim.findMany({ where: { progress: { childId, seasonId: season.id } } }),
  ]);
  const claimedKey = new Set(claims.map((c) => `${c.tier}:${c.track}`));

  return {
    season: { id: season.id, name: season.name, startsAt: season.startsAt, endsAt: season.endsAt },
    xp: progress.xp,
    hasVip: progress.hasVip,
    tiers: tiers.map((t) => ({
      tier: t.tier,
      xpRequired: t.xpRequired,
      freeRewardKind: t.freeRewardKind,
      freeRewardAmount: t.freeRewardAmount,
      freeRewardItemKey: t.freeRewardItemKey,
      vipRewardKind: t.vipRewardKind,
      vipRewardAmount: t.vipRewardAmount,
      vipRewardItemKey: t.vipRewardItemKey,
      freeClaimed: claimedKey.has(`${t.tier}:free`),
      vipClaimed: claimedKey.has(`${t.tier}:vip`),
    })),
  };
}

/**
 * Applies one reward onto a child's account. Shared by claimTier()/claimAll()
 * below — every kind here maps 1:1 to something that already exists
 * elsewhere in the game's economy (coins/gems/fusion shards/a random pet
 * egg/a catalog item), nothing new invented just for Battle Pass.
 */
async function grantReward(childId: string, kind: string, amount: number, itemKey: string | null): Promise<void> {
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
async function grantRandomPet(childId: string, rarity: "Common" | "Rare" | "Epic" | "Legendary"): Promise<void> {
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

export interface ClaimBattlePassResult {
  state: BattlePassStateDto;
  claimed: { tier: number; track: "free" | "vip" }[];
}

export async function claimTier(childId: string, parentId: string, tier: number, track: "free" | "vip"): Promise<ClaimBattlePassResult> {
  await getOwnedChildOrThrow(childId, parentId);
  const season = await getCurrentSeason();
  if (!season) throw new AppError(400, "Hiện không có mùa Battle Pass nào đang mở.", "BATTLE_PASS_NO_SEASON");

  const [progress, tierRow] = await Promise.all([
    getOrCreateProgress(childId, season.id),
    prisma.battlePassTier.findUnique({ where: { seasonId_tier: { seasonId: season.id, tier } } }),
  ]);
  if (!tierRow) throw new AppError(404, "Không tìm thấy mốc này.", "BATTLE_PASS_TIER_NOT_FOUND");
  if (progress.xp < tierRow.xpRequired) throw new AppError(400, "Chưa đủ điểm kinh nghiệm để mở mốc này.", "BATTLE_PASS_TIER_LOCKED");
  if (track === "vip" && !progress.hasVip) throw new AppError(403, "Cần VIP mùa này để nhận quà VIP.", "BATTLE_PASS_VIP_REQUIRED");

  try {
    await prisma.battlePassClaim.create({ data: { progressId: progress.id, tier, track } });
  } catch {
    throw new AppError(400, "Mốc này đã được nhận rồi.", "BATTLE_PASS_ALREADY_CLAIMED");
  }
  const kind = track === "free" ? tierRow.freeRewardKind : tierRow.vipRewardKind;
  const amount = track === "free" ? tierRow.freeRewardAmount : tierRow.vipRewardAmount;
  const itemKey = track === "free" ? tierRow.freeRewardItemKey : tierRow.vipRewardItemKey;
  await grantReward(childId, kind, amount, itemKey);

  return { state: await getBattlePassState(childId, parentId), claimed: [{ tier, track }] };
}

/** "Nhận tất cả" — claims every (tier, track) the child has unlocked but
 * hasn't claimed yet, skipping the VIP track entirely if they don't have VIP
 * rather than erroring (a normal, expected state, not a mistake). */
export async function claimAll(childId: string, parentId: string): Promise<ClaimBattlePassResult> {
  await getOwnedChildOrThrow(childId, parentId);
  const season = await getCurrentSeason();
  if (!season) throw new AppError(400, "Hiện không có mùa Battle Pass nào đang mở.", "BATTLE_PASS_NO_SEASON");

  const [progress, tiers, claims] = await Promise.all([
    getOrCreateProgress(childId, season.id),
    prisma.battlePassTier.findMany({ where: { seasonId: season.id }, orderBy: { tier: "asc" } }),
    prisma.battlePassClaim.findMany({ where: { progress: { childId, seasonId: season.id } } }),
  ]);
  const claimedKey = new Set(claims.map((c) => `${c.tier}:${c.track}`));

  const claimed: { tier: number; track: "free" | "vip" }[] = [];
  for (const t of tiers) {
    if (progress.xp < t.xpRequired) continue;
    const tracks: { track: "free" | "vip"; kind: string; amount: number; itemKey: string | null }[] = [
      { track: "free", kind: t.freeRewardKind, amount: t.freeRewardAmount, itemKey: t.freeRewardItemKey },
      ...(progress.hasVip ? [{ track: "vip" as const, kind: t.vipRewardKind, amount: t.vipRewardAmount, itemKey: t.vipRewardItemKey }] : []),
    ];
    for (const { track, kind, amount, itemKey } of tracks) {
      if (claimedKey.has(`${t.tier}:${track}`)) continue;
      try {
        await prisma.battlePassClaim.create({ data: { progressId: progress.id, tier: t.tier, track } });
      } catch {
        continue; // race with another claim — skip, don't double-grant
      }
      await grantReward(childId, kind, amount, itemKey);
      claimed.push({ tier: t.tier, track });
    }
  }

  return { state: await getBattlePassState(childId, parentId), claimed };
}

/** Demo activation, same non-payment-gateway pattern as Premium's
 * activatePremium() — no App Store/Google Play integration exists yet. */
export async function activateVipSeason(childId: string, parentId: string): Promise<BattlePassStateDto> {
  await getOwnedChildOrThrow(childId, parentId);
  const season = await getCurrentSeason();
  if (!season) throw new AppError(400, "Hiện không có mùa Battle Pass nào đang mở.", "BATTLE_PASS_NO_SEASON");
  const progress = await getOrCreateProgress(childId, season.id);
  if (!progress.hasVip) {
    await prisma.childBattlePassProgress.update({ where: { id: progress.id }, data: { hasVip: true } });
  }
  return getBattlePassState(childId, parentId);
}

/** Same calendar day — matches Progress.lastCheckinDate's own convention. */
function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

const FULL_QUEST_DAY_XP = 120;

/**
 * Called from quest.service.ts's claimQuest() right after a quest is
 * claimed — checks whether EVERY active daily quest is now claimed for
 * today, and if so (and not already awarded today, idempotent by date) adds
 * 120 XP to the child's current-season Battle Pass progress. A no-op
 * (silently) when no season is currently running — Battle Pass XP simply
 * isn't tracked outside a season, same as how quest/pet progress keeps
 * working fine whether or not any given optional system is active.
 */
export async function awardQuestBattlePassXpIfFullyDone(childId: string, now: Date = new Date()): Promise<void> {
  const season = await getCurrentSeason(now);
  if (!season) return;

  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const [activeQuests, todaysProgress] = await Promise.all([
    prisma.dailyQuest.findMany({ where: { isActive: true }, select: { id: true } }),
    prisma.dailyQuestProgress.findMany({ where: { childId, date: startOfDay } }),
  ]);
  if (activeQuests.length === 0) return;
  const claimedToday = new Set(todaysProgress.filter((p) => p.claimed).map((p) => p.questId));
  const allDone = activeQuests.every((q) => claimedToday.has(q.id));
  if (!allDone) return;

  const progress = await getOrCreateProgress(childId, season.id);
  if (progress.lastQuestBumpDate && isSameDay(progress.lastQuestBumpDate, now)) return; // already awarded today

  await prisma.childBattlePassProgress.update({ where: { id: progress.id }, data: { xp: { increment: FULL_QUEST_DAY_XP }, lastQuestBumpDate: now } });
}

// ---- Admin CRUD (seasons + tiers) --------------------------------------

export async function adminListSeasons() {
  return prisma.battlePassSeason.findMany({ orderBy: { startsAt: "desc" }, include: { _count: { select: { tiers: true } } } });
}

export async function adminGetSeason(id: string) {
  const season = await prisma.battlePassSeason.findUnique({ where: { id } });
  if (!season) throw new AppError(404, "Không tìm thấy mùa Battle Pass.", "BATTLE_PASS_SEASON_NOT_FOUND");
  return season;
}

export async function adminCreateSeason(input: BattlePassSeasonInput) {
  return prisma.battlePassSeason.create({ data: input });
}

export async function adminUpdateSeason(id: string, input: UpdateBattlePassSeasonInput) {
  await adminGetSeason(id);
  return prisma.battlePassSeason.update({ where: { id }, data: input });
}

export async function adminDeleteSeason(id: string) {
  await adminGetSeason(id);
  await prisma.battlePassSeason.delete({ where: { id } }); // cascades to tiers/progress/claims
}

export async function adminListTiers(seasonId: string) {
  await adminGetSeason(seasonId);
  return prisma.battlePassTier.findMany({ where: { seasonId }, orderBy: { tier: "asc" } });
}

export async function adminCreateTier(seasonId: string, input: BattlePassTierInput) {
  await adminGetSeason(seasonId);
  const existing = await prisma.battlePassTier.findUnique({ where: { seasonId_tier: { seasonId, tier: input.tier } } });
  if (existing) throw new AppError(409, "Mùa này đã có mốc số đó rồi.", "BATTLE_PASS_TIER_TAKEN");
  return prisma.battlePassTier.create({ data: { ...input, seasonId, freeRewardItemKey: input.freeRewardItemKey ?? null, vipRewardItemKey: input.vipRewardItemKey ?? null } });
}

export async function adminUpdateTier(id: string, input: UpdateBattlePassTierInput) {
  const existing = await prisma.battlePassTier.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, "Không tìm thấy mốc này.", "BATTLE_PASS_TIER_NOT_FOUND");
  if (input.tier && input.tier !== existing.tier) {
    const clash = await prisma.battlePassTier.findUnique({ where: { seasonId_tier: { seasonId: existing.seasonId, tier: input.tier } } });
    if (clash) throw new AppError(409, "Mùa này đã có mốc số đó rồi.", "BATTLE_PASS_TIER_TAKEN");
  }
  return prisma.battlePassTier.update({ where: { id }, data: input });
}

export async function adminDeleteTier(id: string) {
  const existing = await prisma.battlePassTier.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, "Không tìm thấy mốc này.", "BATTLE_PASS_TIER_NOT_FOUND");
  await prisma.battlePassTier.delete({ where: { id } });
}

import { prisma } from "../lib/prisma.js";
import { AppError } from "../middleware/errorHandler.js";
import type { PutProgressInput } from "../schemas/progress.schema.js";
import { createNotification } from "./notification.service.js";

/**
 * `coins`/`gems` are Postgres `integer` (32-bit) columns — any mint-style
 * addition (check-in reward, quest claim, fight-room win...) MUST clamp to
 * this or a child sitting near the ceiling (the admin/demo account is
 * literally seeded at this exact value for "unlimited" testing — see
 * seed.ts) crashes the request with a raw Postgres "value out of range"
 * error instead of a clean response. A real child could in principle also
 * reach this after enough play, however implausible — clamp unconditionally
 * rather than only "for the demo account".
 */
export const MAX_INT32 = 2_147_483_647;
export function clampToInt32(n: number): number {
  return Math.min(n, MAX_INT32);
}

export interface ProgressState {
  coins: number;
  gems: number;
  unlockedPets: string[];
  petCopies: Record<string, number>;
  petEggs: Record<string, number>;
  unlockedWorlds: string[];
  activePetId: string | null;
  streakDays: number;
  lastActiveDate: Date | null;
  lastCheckinDate: Date | null;
  lastLegendaryGrantAt: Date | null;
  /** "Phối pet" fusion material — see schema.prisma's doc comment + petFusion.service.ts. */
  commonShards: number;
  rareShards: number;
  epicShards: number;
  /** Settings.tsx's "Cho phép bảng xếp hạng" — see setRankVisibility() below. */
  hiddenFromRank: boolean;
  localVersion: number;
}

export interface ClientProgressInput {
  coins: number;
  gems: number;
  unlockedPets: string[];
  unlockedWorlds: string[];
  activePetId: string | null;
  lastActiveDate: Date;
}

function union(a: string[], b: string[]): string[] {
  return Array.from(new Set([...a, ...b]));
}

/** Whole calendar days between two dates (b - a), ignoring time-of-day. */
export function daysBetween(a: Date, b: Date): number {
  const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((utcB - utcA) / 86_400_000);
}

/**
 * Recomputes streakDays from the SERVER's own lastActiveDate — never from
 * whatever the client sends. A kid changing their device clock forward
 * should not be able to farm streak days.
 */
export function computeStreak(prevStreak: number, serverLastActiveDate: Date | null, now: Date): number {
  if (!serverLastActiveDate) return 1; // first activity ever
  const gap = daysBetween(serverLastActiveDate, now);
  if (gap <= 0) return Math.max(prevStreak, 1); // already active today, unchanged
  if (gap === 1) return prevStreak + 1; // consecutive day
  return 1; // missed a day (or more) — streak resets
}

/**
 * Merges a client's offline-first progress into the server's copy.
 * - coins/gems/unlocks only ever grow (max / union) — a kid who already
 *   earned something can never lose it on sync.
 * - streakDays is recomputed server-side.
 * - localVersion always bumps by 1 on a successful merge.
 *
 * Pure and DB-free on purpose so it's cheap to unit test (see
 * tests/progress.service.test.ts).
 */
export function mergeProgress(server: ProgressState, client: ClientProgressInput, now: Date = new Date()): ProgressState {
  return {
    coins: Math.max(server.coins, client.coins),
    gems: Math.max(server.gems, client.gems),
    unlockedPets: union(server.unlockedPets, client.unlockedPets),
    petCopies: server.petCopies,
    petEggs: server.petEggs,
    unlockedWorlds: union(server.unlockedWorlds, client.unlockedWorlds),
    activePetId: client.activePetId, // last-write-wins — a single choice, not something that accumulates
    streakDays: computeStreak(server.streakDays, server.lastActiveDate, now),
    lastActiveDate: now,
    lastCheckinDate: server.lastCheckinDate, // untouched by a plain progress sync — see checkIn()
    lastLegendaryGrantAt: server.lastLegendaryGrantAt, // untouched by a plain progress sync — see claimMonthlyLegendaryPets()
    commonShards: server.commonShards, // untouched by a plain progress sync — see petFusion.service.ts
    rareShards: server.rareShards,
    epicShards: server.epicShards,
    hiddenFromRank: server.hiddenFromRank, // untouched by a plain progress sync — see setRankVisibility()
    localVersion: server.localVersion + 1,
  };
}

async function getOwnedProgressOrThrow(childId: string, parentId: string) {
  const child = await prisma.child.findUnique({ where: { id: childId }, include: { progress: true } });
  if (!child || child.parentId !== parentId) {
    throw new AppError(404, "Không tìm thấy hồ sơ trẻ.", "CHILD_NOT_FOUND");
  }
  if (!child.progress) {
    throw new AppError(404, "Chưa có dữ liệu tiến độ cho hồ sơ này.", "PROGRESS_NOT_FOUND");
  }
  return child.progress;
}

export function toProgressState(row: {
  coins: number;
  gems: number;
  unlockedPets: unknown;
  petCopies: unknown;
  petEggs: unknown;
  unlockedWorlds: unknown;
  activePetId: string | null;
  streakDays: number;
  lastActiveDate: Date | null;
  lastCheckinDate: Date | null;
  lastLegendaryGrantAt: Date | null;
  commonShards: number;
  rareShards: number;
  epicShards: number;
  hiddenFromRank: boolean;
  localVersion: number;
}): ProgressState {
  const unlockedPets = Array.isArray(row.unlockedPets) ? (row.unlockedPets as string[]) : [];
  const rawCopies = row.petCopies && typeof row.petCopies === "object" && !Array.isArray(row.petCopies) ? (row.petCopies as Record<string, unknown>) : {};
  const petCopies = Object.fromEntries(
    unlockedPets.map((key) => [key, Math.max(1, Number.isInteger(rawCopies[key]) ? Number(rawCopies[key]) : 1)]),
  );
  const rawEggs = row.petEggs && typeof row.petEggs === "object" && !Array.isArray(row.petEggs) ? (row.petEggs as Record<string, unknown>) : {};
  const petEggs = Object.fromEntries(
    unlockedPets.map((key) => [key, Math.max(0, Number.isInteger(rawEggs[key]) ? Number(rawEggs[key]) : (petCopies[key] ?? 1) - 1)]),
  );
  return {
    coins: row.coins,
    gems: row.gems,
    unlockedPets,
    petCopies,
    petEggs,
    unlockedWorlds: Array.isArray(row.unlockedWorlds) ? (row.unlockedWorlds as string[]) : [],
    activePetId: row.activePetId,
    streakDays: row.streakDays,
    lastActiveDate: row.lastActiveDate,
    lastCheckinDate: row.lastCheckinDate,
    lastLegendaryGrantAt: row.lastLegendaryGrantAt,
    commonShards: row.commonShards,
    rareShards: row.rareShards,
    epicShards: row.epicShards,
    hiddenFromRank: row.hiddenFromRank,
    localVersion: row.localVersion,
  };
}

export async function getProgress(childId: string, parentId: string): Promise<ProgressState> {
  const progress = await getOwnedProgressOrThrow(childId, parentId);
  return toProgressState(progress);
}

export async function putProgress(
  childId: string,
  parentId: string,
  input: PutProgressInput,
): Promise<ProgressState> {
  const current = await getOwnedProgressOrThrow(childId, parentId);
  const merged = mergeProgress(toProgressState(current), input, new Date());

  const saved = await prisma.progress.update({
    where: { childId },
    data: {
      coins: merged.coins,
      gems: merged.gems,
      unlockedPets: merged.unlockedPets,
      petCopies: merged.petCopies,
      petEggs: merged.petEggs,
      unlockedWorlds: merged.unlockedWorlds,
      activePetId: merged.activePetId,
      streakDays: merged.streakDays,
      lastActiveDate: merged.lastActiveDate,
      localVersion: merged.localVersion,
    },
  });

  return toProgressState(saved);
}

export interface CheckInResult {
  progress: ProgressState;
  reward: number;
  alreadyCheckedIn: boolean;
}

/**
 * Buys a pet using the catalog price stored in the database. This must never
 * go through putProgress(): that endpoint intentionally merges currencies by
 * max for offline progress, so a client-side subtraction would be discarded.
 */
// A Legendary duplicate has no shard tier to fall back into (nothing fuses
// FROM Legendary, see petFusion.service.ts) — a flat coin consolation
// instead. Defined here (not in petFusion.service.ts, which already imports
// from this file) so both purchasePet and fusePets share one constant
// without a circular import.
export const LEGENDARY_DUPLICATE_COINS = 500;

export interface PurchasePetResult {
  progress: ProgressState;
  /** True when the child already owned this pet — see below. */
  isDuplicate: boolean;
  rarity: string;
  shardsGranted: number;
  coinsGranted: number;
  quantity: number;
}

/**
 * Every purchase adds one real copy. `unlockedPets` remains the unique
 * species list while `petCopies` stores quantities used by fusion.
 */
export async function purchasePet(childId: string, parentId: string, petKey: string): Promise<PurchasePetResult> {
  const result = await prisma.$transaction(async (tx) => {
    const child = await tx.child.findUnique({ where: { id: childId }, include: { progress: true } });
    if (!child || child.parentId !== parentId) throw new AppError(404, "Không tìm thấy hồ sơ trẻ.", "CHILD_NOT_FOUND");
    if (!child.progress) throw new AppError(404, "Chưa có dữ liệu tiến độ cho hồ sơ này.", "PROGRESS_NOT_FOUND");

    const pet = await tx.pet.findUnique({ where: { key: petKey } });
    if (!pet || !pet.isActive) throw new AppError(404, "Không tìm thấy pet.", "PET_NOT_FOUND");

    const state = toProgressState(child.progress);
    const balance = pet.currency === "coin" ? state.coins : state.gems;
    if (balance < pet.price) throw new AppError(409, pet.currency === "coin" ? "Không đủ coin." : "Không đủ gem.", "INSUFFICIENT_FUNDS");

    const isDuplicate = state.unlockedPets.includes(petKey);
    const shardsGranted = 0;
    const coinsGranted = 0;
    const quantity = (state.petCopies[petKey] ?? (isDuplicate ? 1 : 0)) + 1;

    const nextCoins = clampToInt32((pet.currency === "coin" ? state.coins - pet.price : state.coins) + coinsGranted);
    const nextGems = pet.currency === "gem" ? state.gems - pet.price : state.gems;

    const saved = await tx.progress.update({
      where: { childId },
      data: {
        coins: nextCoins,
        gems: nextGems,
        unlockedPets: isDuplicate ? state.unlockedPets : [...state.unlockedPets, petKey],
        petCopies: { ...state.petCopies, [petKey]: quantity },
        petEggs: isDuplicate ? { ...state.petEggs, [petKey]: (state.petEggs[petKey] ?? 0) + 1 } : state.petEggs,
        activePetId: isDuplicate ? state.activePetId : petKey,
        commonShards: state.commonShards + (shardsGranted && pet.rarity === "Common" ? shardsGranted : 0),
        rareShards: state.rareShards + (shardsGranted && pet.rarity === "Rare" ? shardsGranted : 0),
        epicShards: state.epicShards + (shardsGranted && pet.rarity === "Epic" ? shardsGranted : 0),
        lastActiveDate: new Date(),
        localVersion: { increment: 1 },
      },
    });
    if (!isDuplicate) {
      await tx.petStats.upsert({
        where: { childId_petKey: { childId, petKey } },
        update: {},
        create: { childId, petKey, experience: 0, level: 1 },
      });
    }
    return { progress: toProgressState(saved), isDuplicate, rarity: pet.rarity, shardsGranted, coinsGranted, quantity, petName: pet.name, petPrice: pet.price, petCurrency: pet.currency };
  });

  // Fire-and-forget, outside the transaction — a notification failing to
  // write should never roll back a real purchase that already succeeded.
  if (!result.isDuplicate) {
    const currencyLabel = result.petCurrency === "coin" ? `${result.petPrice} coin` : `${result.petPrice} gem`;
    void createNotification(childId, "petUnlock", `Mở khoá pet mới: ${result.petName}`, `Đã dùng ${currencyLabel} để nhận ${result.petName}.`).catch((err) => console.warn("Failed to create pet-unlock notification:", err));
  }
  return result;
}

export async function selectActivePet(childId: string, parentId: string, petKey: string): Promise<ProgressState> {
  const current = await getOwnedProgressOrThrow(childId, parentId);
  const state = toProgressState(current);
  if (!state.unlockedPets.includes(petKey)) throw new AppError(409, "Pet này chưa được mở khoá.", "PET_NOT_UNLOCKED");
  const saved = await prisma.progress.update({ where: { childId }, data: { activePetId: petKey, localVersion: { increment: 1 } } });
  return toProgressState(saved);
}

/** Monday=0 … Sunday=6 — matches the T2..CN columns QuestStreak.tsx renders (JS's own getDay() is Sunday=0). */
export function weekdayIndex(date: Date): number {
  return (date.getDay() + 6) % 7;
}

// Same 7-day reward ladder QuestStreak.tsx displays (+10 → +40, Sunday = gift
// box) — indexed by the REAL calendar weekday, not by streak length. Two
// different concepts share this screen: streakDays is "how many days in a
// row you've shown up" (can run past 7, resets on any gap); this ladder is
// "which day of the actual week is it" (always Monday..Sunday, resets every
// week regardless of streak). Indexing the reward by streak-length-mod-7
// used to make "today" and the reward amount drift away from the real
// weekday shown on the calendar.
const DAILY_CHECKIN_LADDER = [10, 15, 20, 25, 30, 35, 40];

/**
 * "Điểm danh" (daily attendance) claim — a server-authoritative action
 * distinct from the offline-first `putProgress` sync above: it's the one
 * place coins get minted from nothing rather than merged from the client.
 *
 * Idempotency is checked against its OWN `lastCheckinDate`, deliberately
 * separate from `lastActiveDate` (which any progress sync — finishing a
 * lesson, buying something — also bumps). Sharing one field would mean
 * playing a lesson before opening the check-in screen silently marks the
 * reward as already claimed, even though the child never tapped it.
 * streakDays itself is still derived from the shared lastActiveDate/
 * computeStreak so it stays the one true streak shown everywhere in the UI.
 */
export async function checkIn(childId: string, parentId: string, now: Date = new Date()): Promise<CheckInResult> {
  const current = await getOwnedProgressOrThrow(childId, parentId);
  const state = toProgressState(current);

  const alreadyToday = state.lastCheckinDate !== null && daysBetween(state.lastCheckinDate, now) <= 0;
  if (alreadyToday) {
    return { progress: state, reward: 0, alreadyCheckedIn: true };
  }

  const streakDays = computeStreak(state.streakDays, state.lastActiveDate, now);
  const reward = DAILY_CHECKIN_LADDER[weekdayIndex(now)]!;

  const saved = await prisma.progress.update({
    where: { childId },
    data: { coins: clampToInt32(state.coins + reward), streakDays, lastActiveDate: now, lastCheckinDate: now, localVersion: state.localVersion + 1 },
  });

  void createNotification(childId, "checkin", "Đã điểm danh hôm nay", `+${reward} coin · Chuỗi ${streakDays} ngày liên tiếp.`).catch((err) => console.warn("Failed to create check-in notification:", err));
  return { progress: toProgressState(saved), reward, alreadyCheckedIn: false };
}

/** Same calendar month AND year — matches "1 lần mỗi tháng", not "30 ngày". */
function sameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr;
}

export interface ClaimLegendaryResult {
  progress: ProgressState;
  grantedPetKeys: string[];
  alreadyClaimed: boolean;
}

/**
 * Premium's "+2 pet Legendary mỗi tháng" perk — a server-authoritative claim
 * action, same "explicit tap + idempotent on its own date field" shape as
 * checkIn() above (not a silent background grant on every login, so a
 * parent/child can actually see the moment it happens). Grants up to 2
 * Legendary pets the child doesn't already own; if fewer than 2 remain
 * unowned (a child who's collected most/all Legendaries already), grants
 * whatever's left rather than erroring — no gem/coin substitute for the
 * shortfall for now, kept simple until real demand shows that's worth it.
 */
export async function claimMonthlyLegendaryPets(childId: string, parentId: string, now: Date = new Date()): Promise<ClaimLegendaryResult> {
  const parent = await prisma.parent.findUniqueOrThrow({ where: { id: parentId } });
  if (!parent.isPremium) {
    throw new AppError(403, "Cần Premium để nhận thưởng pet Legendary hằng tháng.", "PREMIUM_REQUIRED");
  }

  const current = await getOwnedProgressOrThrow(childId, parentId);
  const state = toProgressState(current);

  const alreadyThisMonth = state.lastLegendaryGrantAt !== null && sameMonth(state.lastLegendaryGrantAt, now);
  if (alreadyThisMonth) {
    return { progress: state, grantedPetKeys: [], alreadyClaimed: true };
  }

  const legendaryPets = await prisma.pet.findMany({ where: { rarity: "Legendary", isActive: true } });
  const unowned = legendaryPets.filter((p) => !state.unlockedPets.includes(p.key));
  const grantedPetKeys = shuffle(unowned)
    .slice(0, 2)
    .map((p) => p.key);

  const nextPetCopies = { ...state.petCopies };
  const nextPetEggs = { ...state.petEggs };
  for (const petKey of grantedPetKeys) nextPetCopies[petKey] = (nextPetCopies[petKey] ?? 0) + 1;

  const saved = await prisma.progress.update({
    where: { childId },
    data: { unlockedPets: [...state.unlockedPets, ...grantedPetKeys], petCopies: nextPetCopies, petEggs: nextPetEggs, lastLegendaryGrantAt: now, localVersion: state.localVersion + 1 },
  });
  await Promise.all(grantedPetKeys.map((petKey) => prisma.petStats.upsert({ where: { childId_petKey: { childId, petKey } }, update: {}, create: { childId, petKey, experience: 0, level: 1 } })));

  if (grantedPetKeys.length > 0) {
    const names = legendaryPets.filter((p) => grantedPetKeys.includes(p.key)).map((p) => p.name);
    void createNotification(childId, "petUnlock", "Quà Premium: pet Legendary!", `Nhận được ${names.join(", ")} — quà Premium hằng tháng.`).catch((err) => console.warn("Failed to create pet-unlock notification:", err));
  }
  return { progress: toProgressState(saved), grantedPetKeys, alreadyClaimed: false };
}

/**
 * Settings.tsx's "Cho phép bảng xếp hạng" toggle — see leaderboard.service.ts
 * for where `hiddenFromRank` is actually enforced.
 */
export async function setRankVisibility(childId: string, parentId: string, hidden: boolean): Promise<ProgressState> {
  await getOwnedProgressOrThrow(childId, parentId);
  const saved = await prisma.progress.update({ where: { childId }, data: { hiddenFromRank: hidden, localVersion: { increment: 1 } } });
  return toProgressState(saved);
}

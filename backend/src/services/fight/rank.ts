/**
 * "Đường đua Hạng" — the rank ladder every Đấu trường (fight room) match
 * feeds into. Deliberately NOT zero-sum Elo: a win always gains more than a
 * loss costs, and rating never drops below 0, so a losing streak stays
 * discouraging-but-survivable for a kids' app instead of spiraling a child
 * into a rating hole. See liveRoomManager.ts's endMatch() for where this
 * actually gets applied after a match.
 */

export interface Tier {
  key: string;
  name: string;
  color: string;
  min: number;
  /** Coin reward multiplier for a win while sitting in this tier — climbing pays off, not just bragging rights. */
  coinMultiplier: number;
}

export const TIERS: Tier[] = [
  { key: "chestnut", name: "Hạt Dẻ", color: "#8A5A3B", min: 0, coinMultiplier: 1 },
  { key: "bronze", name: "Đồng", color: "#C98A4A", min: 200, coinMultiplier: 1.1 },
  { key: "silver", name: "Bạc", color: "#B9C4CC", min: 400, coinMultiplier: 1.25 },
  { key: "gold", name: "Vàng", color: "#F2A81C", min: 700, coinMultiplier: 1.5 },
  { key: "diamond", name: "Kim Cương", color: "#57C6C6", min: 1000, coinMultiplier: 1.75 },
  { key: "legend", name: "Huyền Thoại", color: "#9B7EDE", min: 1500, coinMultiplier: 2 },
];

export function getTier(rating: number): Tier {
  // TIERS is ascending by `min`, so the last one whose threshold we've cleared wins.
  let current = TIERS[0]!;
  for (const tier of TIERS) {
    if (rating >= tier.min) current = tier;
  }
  return current;
}

/** The next tier up, or null if already at the top (Huyền Thoại has no ceiling). */
export function getNextTier(rating: number): Tier | null {
  const current = getTier(rating);
  const idx = TIERS.findIndex((t) => t.key === current.key);
  return TIERS[idx + 1] ?? null;
}

const RANK_WIN_BASE = 25;
const RANK_LOSS_BASE = 10;
const RANK_LOSS_MIN = 3;
// Beating a much higher-rated opponent is worth extra; losing to one costs
// less — capped so one wildly mismatched game can't swing things too hard.
const UPSET_BONUS_CAP = 15;
const UPSET_DIVISOR = 40;

function upsetBonus(myRating: number, opponentRating: number): number {
  const diff = opponentRating - myRating; // positive when the opponent outranks me
  return Math.max(0, Math.min(UPSET_BONUS_CAP, Math.round(diff / UPSET_DIVISOR)));
}

/** Rating delta for the WINNER of a match (always positive). */
export function ratingGainForWin(winnerRating: number, loserRating: number): number {
  return RANK_WIN_BASE + upsetBonus(winnerRating, loserRating);
}

/** Rating delta for the LOSER of a match (always negative, but never enough to push them below 0 — that's clamped by the caller). */
export function ratingLossForLoss(loserRating: number, winnerRating: number): number {
  // Losing to someone rated well below you costs full price; losing to
  // someone well above you (an upset against you) costs less.
  const discount = upsetBonus(loserRating, winnerRating);
  return -Math.max(RANK_LOSS_MIN, RANK_LOSS_BASE - discount);
}

export function coinsForWin(baseCoins: number, winnerNewRating: number): number {
  return Math.round(baseCoins * getTier(winnerNewRating).coinMultiplier);
}

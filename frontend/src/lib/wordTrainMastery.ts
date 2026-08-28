import type { WordTrainRoundData } from "./api";

const STORAGE_PREFIX = "petlingo.wordTrainMastered.";

/**
 * Per-device "mastered rounds" memory for Word Train — lets a big 500-round
 * pool (see prisma/seed.ts's mock topics) prioritize whatever a child hasn't
 * gotten right on the first try yet, instead of sampling purely at random
 * forever. Deliberately localStorage-only (not backend-synced): this is the
 * same "session/device-local cosmetic progress" bar the app already applies
 * to SrsCard's "Khó/Ổn/Dễ" grading — a real per-child, cross-device mastery
 * model would need its own backend table, out of scope for what's still a
 * "mock" 500-round content set (see TASKS.md).
 *
 * A round has no stable database id exposed to the frontend (see
 * WordTrainRoundData), so identity is derived from its own content instead —
 * `fill:WORD:blankIndex` or `scramble:word|word|word`. This means every "fill"
 * round generated for the same word+letter-position (regardless of which 2
 * wrong-letter options it happened to ship with) is treated as the same
 * "thing to master" — which is the right granularity: knowing DOG's 2nd
 * letter doesn't depend on which wrong letters were offered alongside it.
 */
export function roundKey(round: WordTrainRoundData): string {
  return round.kind === "fill" ? `fill:${round.data.word}:${round.data.blankIndex}` : `scramble:${round.data.words.join("|")}`;
}

export function loadMasteredSet(topicKey: string): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + topicKey);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveMasteredSet(topicKey: string, mastered: Set<string>) {
  try {
    localStorage.setItem(STORAGE_PREFIX + topicKey, JSON.stringify([...mastered]));
  } catch {
    // storage full/unavailable (private mode etc.) — mastery weighting degrades
    // to "no memory yet", never blocks play.
  }
}

/** Call once a round is fully resolved (success). `flawless` = no wrong pick
 * happened along the way — mastered rounds get deprioritized in future
 * sessions; a round answered correctly only after a mistake is removed from
 * "mastered" (even if it was there before) so it comes back for review. */
export function markRoundResult(topicKey: string, round: WordTrainRoundData, flawless: boolean) {
  const mastered = loadMasteredSet(topicKey);
  const key = roundKey(round);
  if (flawless) mastered.add(key);
  else mastered.delete(key);
  saveMasteredSet(topicKey, mastered);
}

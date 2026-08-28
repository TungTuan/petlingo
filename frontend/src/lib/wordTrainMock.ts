import type { WordTrainRoundData, WordTrainTopicDetail, WordTrainTopicListItem } from "./api";
import { exampleFor, loadDictionary, meaningFor, type DictionaryWord } from "./dictionary";
import type { Lang } from "./i18n";

/**
 * The 9 "mock" 500-round Word Train topics, generated entirely on-device from
 * the offline dictionary bundle (public/dictionary/words.json) — NOT stored
 * in the backend at all. Originally these were seeded into the database and
 * served via /catalog/word-train-topics (see prisma/seed.ts's git history),
 * but that meant playing them required a live network call for content that
 * was already sitting in the app bundle. Since the whole point of these 9
 * topics is "large volume of practice puzzles built from the dictionary", it
 * makes more sense to generate them the same way Dictionary.tsx works: fetch
 * the bundled JSON once, build everything in memory, zero backend dependency,
 * works in airplane mode from the moment the app is installed.
 *
 * The 2 original hand-authored system topics ("Chuyến Tàu Động Vật"/"Đồ Ăn")
 * and anything an admin or parent adds through /admin or "Nội dung của tôi"
 * still come from the real backend (they're genuinely dynamic content that
 * can change without an app update) — WordTrain.tsx merges both lists.
 *
 * This mirrors prisma/seed.ts's generator function-for-function; keep the two
 * in sync if either changes (the backend copy is now dead code kept only as
 * a historical reference of what these topics used to look like server-side —
 * see TASKS.md).
 */
const MOCK_GROUPS: { key: string; name: string; color: string; dictTopics: string[] }[] = [
  { key: "wt-mock-animals", name: "Vương Quốc Muông Thú", color: "#EF6A5A", dictTopics: ["animals"] },
  { key: "wt-mock-food", name: "Thế Giới Ẩm Thực", color: "#F2A81C", dictTopics: ["food"] },
  { key: "wt-mock-family-home", name: "Mái Ấm Gia Đình", color: "#F79BB0", dictTopics: ["family", "home", "time", "greetings"] },
  { key: "wt-mock-school-jobs", name: "Trường Học & Nghề Nghiệp", color: "#3E7FB0", dictTopics: ["school", "jobs", "technology"] },
  { key: "wt-mock-nature-places", name: "Thiên Nhiên Kỳ Thú", color: "#57C6C6", dictTopics: ["nature", "weather", "places"] },
  { key: "wt-mock-colors-numbers", name: "Sắc Màu & Con Số", color: "#9B7EDE", dictTopics: ["colors", "shapes", "numbers"] },
  { key: "wt-mock-body-clothes", name: "Cơ Thể & Trang Phục", color: "#6C5CE7", dictTopics: ["body", "clothes"] },
  { key: "wt-mock-transport-hobbies", name: "Phương Tiện & Sở Thích", color: "#8A5A3B", dictTopics: ["transport", "hobbies"] },
  { key: "wt-mock-emotions-verbs", name: "Cảm Xúc & Hành Động", color: "#2A2E45", dictTopics: ["emotions", "verbs", "adjectives"] },
];
const ROUNDS_PER_TOPIC = 500;

/** Fake ids for these topics never hit the backend — prefixed so WordTrain.tsx
 * can tell "this id means: generate locally" apart from a real DB cuid. */
const MOCK_ID_PREFIX = "mock:";

export function isMockWordTrainId(id: string): boolean {
  return id.startsWith(MOCK_ID_PREFIX);
}

/** Synchronous and instant — the list view only needs name/color/count, all
 * fixed constants, so there's no need to touch the dictionary (or the
 * network) just to render the topic-picker cards. */
export function listMockWordTrainTopics(): WordTrainTopicListItem[] {
  return MOCK_GROUPS.map((g) => ({ id: MOCK_ID_PREFIX + g.key, key: g.key, name: g.name, color: g.color, isOwn: false, _count: { rounds: ROUNDS_PER_TOPIC } }));
}

const VOWELS = "AEIOU";
const CONSONANTS = "BCDFGHJKLMNPQRSTVWXYZ";

/** 2 wrong-letter distractors from the same vowel/consonant family as
 * `correct`, rotated by `seed` so repeated cycles over the same word don't
 * always offer the exact same 2 distractors. */
function pickDistractors(correct: string, seed: number): [string, string] {
  const pool = (VOWELS.includes(correct) ? VOWELS : CONSONANTS).split("").filter((c) => c !== correct);
  const offset = seed % pool.length;
  const rotated = [...pool.slice(offset), ...pool.slice(0, offset)];
  return [rotated[0]!, rotated[1]!];
}

/** 3-option array (1 correct + 2 distractors) with the correct answer's
 * position rotated by `seed` so it isn't always in the same slot. */
function buildFillOptions(correct: string, seed: number): string[] {
  const [d1, d2] = pickDistractors(correct, seed);
  const slots = [correct, d1, d2];
  const pos = seed % 3;
  return [...slots.slice(pos), ...slots.slice(0, pos)];
}

/** Only single-token alphabetic words make a clean "guess the blanked
 * letter" puzzle — multi-word entries ("ice cream") are skipped here. */
function isFillable(word: string): boolean {
  return /^[a-zA-Z]+$/.test(word);
}

/** Generates `count` "fill" rounds for 1 dictionary word, cycling through
 * every letter position and rotating the distractor set each full cycle. */
function genFillRounds(w: DictionaryWord, count: number, lang: Lang): WordTrainRoundData[] {
  const letters = w.word.toUpperCase().split("");
  const rounds: WordTrainRoundData[] = [];
  for (let i = 0; i < count; i++) {
    const blankIndex = i % letters.length;
    const correct = letters[blankIndex]!;
    rounds.push({ kind: "fill", vi: meaningFor(w, lang), data: { word: w.word.toUpperCase(), blankIndex, options: buildFillOptions(correct, i) } });
  }
  return rounds;
}

function genScrambleRound(w: DictionaryWord, lang: Lang): WordTrainRoundData {
  return { kind: "scramble", vi: exampleFor(w, lang), data: { words: w.example.split(" ") } };
}

/** Builds 1 mock topic's full 500-round pool. Only called once a topic is
 * actually opened (not for the picker list) since it needs the dictionary
 * loaded and does real work — cheap either way (488 words, plain JS). */
export async function getMockWordTrainTopic(key: string, lang: Lang): Promise<WordTrainTopicDetail | null> {
  const group = MOCK_GROUPS.find((g) => g.key === key);
  if (!group) return null;
  const dictionary = await loadDictionary();
  const words = dictionary.filter((w) => group.dictTopics.includes(w.topic));
  const fillableWords = words.filter((w) => isFillable(w.word));
  const scrambles = words.map((w) => genScrambleRound(w, lang));
  const fillNeeded = ROUNDS_PER_TOPIC - scrambles.length;
  const fillPerWord = Math.ceil(fillNeeded / fillableWords.length);
  const fills = fillableWords.flatMap((w) => genFillRounds(w, fillPerWord, lang));
  // Scrambles first: every word's example sentence should survive into the
  // pool (there are always far fewer scrambles than the 500 cap), and any
  // slicing needed to hit exactly 500 trims the tail of the more-repetitive
  // "fill" list instead — not scrambles from whichever words come last.
  const rounds = [...scrambles, ...fills].slice(0, ROUNDS_PER_TOPIC);
  return { id: MOCK_ID_PREFIX + group.key, key: group.key, name: group.name, color: group.color, rounds };
}

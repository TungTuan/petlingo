const LEARNED_WORDS_KEY = "petlingo.learnedWords";

export function getLearnedWords(): string[] {
  try {
    const value = JSON.parse(localStorage.getItem(LEARNED_WORDS_KEY) ?? "[]");
    return Array.isArray(value) ? value.filter((word): word is string => typeof word === "string") : [];
  } catch {
    return [];
  }
}

export function rememberLearnedWords(words: string[]): number {
  const learned = new Set(getLearnedWords());
  words.forEach((word) => learned.add(word.trim().toLowerCase()));
  localStorage.setItem(LEARNED_WORDS_KEY, JSON.stringify([...learned]));
  return learned.size;
}

export const FLAPPY_UNLOCK_WORDS = 5;
/** Tạm tắt theo yêu cầu; đổi lại thành true để khôi phục khóa học 5 từ. */
export const FLAPPY_REQUIRE_LEARNED_WORDS = false;

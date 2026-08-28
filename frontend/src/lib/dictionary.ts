import type { Lang } from "./i18n";

export interface DictionaryWord {
  word: string;
  phonetic: string;
  vi: string;
  ja: string;
  ko: string;
  topic: string;
  /** A short, simple English sentence using the word (kid-level difficulty). */
  example: string;
  /** Vietnamese translation of `example`. Japanese/Korean example translations
   * aren't authored yet (same phased-growth note as the word count itself,
   * see TASKS.md) — `exampleFor()` below falls back to this for ja/ko too. */
  exampleVi: string;
}

/**
 * The big offline dictionary — a static asset at public/dictionary/words.json
 * (currently ~488 words, growing toward 5000 over time — see TASKS.md). It
 * ships inside the app bundle exactly like the pet PNGs already do (Capacitor
 * copies all of `dist/`, built from `public/`, into the native app package),
 * so fetching it once and caching in memory here is genuinely offline: no
 * server round-trip, works with the phone in airplane mode, unlike every
 * other data-bearing screen in this app which calls the live backend.
 */
let cache: DictionaryWord[] | null = null;
let inflight: Promise<DictionaryWord[]> | null = null;

export function loadDictionary(): Promise<DictionaryWord[]> {
  if (cache) return Promise.resolve(cache);
  if (!inflight) {
    inflight = fetch("/dictionary/words.json")
      .then((r) => r.json() as Promise<DictionaryWord[]>)
      .then((data) => {
        cache = data;
        return data;
      });
  }
  return inflight;
}

/**
 * Meaning in the given interface language, falling back to Vietnamese —
 * mirrors the backend's pickLang() (see catalog.service.ts) exactly, since
 * this bundled dictionary has no server round-trip to do that resolution
 * for us. `lang === "en"` also falls back to vi, matching pickLang()'s own
 * "en never changes content" rule (see schema.prisma's Language enum).
 */
export function meaningFor(entry: DictionaryWord, lang: Lang): string {
  if (lang === "ja" && entry.ja) return entry.ja;
  if (lang === "ko" && entry.ko) return entry.ko;
  return entry.vi;
}

/**
 * Translated example sentence for the given interface language — same
 * fallback shape as `meaningFor()`, but every entry only has an English
 * example + its Vietnamese translation today, so ja/ko both fall back to
 * `exampleVi` for now (see the doc comment on `DictionaryWord.exampleVi`).
 */
export function exampleFor(entry: DictionaryWord, _lang: Lang): string {
  return entry.exampleVi;
}

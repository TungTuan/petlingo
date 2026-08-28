import type { TtsRate, TtsVoice } from "./api";

/**
 * Settings.tsx's "Giọng đọc"/"Tốc độ đọc" — a per-device audio preference,
 * not account data, so localStorage is the right place for it (same
 * reasoning as any other device-local UI convenience): every screen that
 * calls speak() reads it fresh each time via getTtsPrefs(), no prop drilling
 * needed. Defaults match the backend's own defaults (env.TTS_VOICE = US,
 * RATE.DEFAULT = normal) so an unset preference sounds identical to before
 * this feature existed.
 */
const VOICE_KEY = "petlingo.ttsVoice";
const RATE_KEY = "petlingo.ttsRate";
const AUTO_SPEAK_KEY = "petlingo.autoSpeak";

export function getTtsVoice(): TtsVoice {
  return localStorage.getItem(VOICE_KEY) === "uk" ? "uk" : "us";
}
export function setTtsVoice(voice: TtsVoice) {
  localStorage.setItem(VOICE_KEY, voice);
}

export function getTtsRate(): TtsRate {
  return localStorage.getItem(RATE_KEY) === "slow" ? "slow" : "normal";
}
export function setTtsRate(rate: TtsRate) {
  localStorage.setItem(RATE_KEY, rate);
}

/**
 * Settings.tsx's "Tự động phát âm" — Lesson.tsx has always auto-read the
 * correct answer aloud the moment a question appears, with no way to turn
 * it off; this preference (default ON, so existing behavior is unchanged
 * until a parent actually opts out) is what that toggle now controls.
 */
export function getAutoSpeak(): boolean {
  return localStorage.getItem(AUTO_SPEAK_KEY) !== "0";
}
export function setAutoSpeak(on: boolean) {
  localStorage.setItem(AUTO_SPEAK_KEY, on ? "1" : "0");
}

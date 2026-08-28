import { api } from "./api";
import { getTtsRate, getTtsVoice } from "./ttsPrefs";

/**
 * Speaks English text — backed by the server's cached TTS (see
 * backend/src/routes/tts.routes.ts), with the browser's own Web Speech API
 * as a last-resort fallback if the network request fails.
 *
 * Why not rely on the browser alone (the old implementation): `speechSynthesis`
 * silently no-ops in a lot of real environments — voices load asynchronously
 * and plenty of WebViews/browsers report zero installed voices, so `speak()`
 * would do nothing with no error at all. Pre-rendered server audio sounds
 * the same everywhere and doesn't depend on what's installed on the device.
 *
 * One in-memory cache per page load: the same sentence/word is spoken many
 * times across a session (Story page revisits, SRS review loops...), so
 * this avoids re-fetching audio we already have a blob URL for. Keyed by
 * (voice, rate, text) — not just text — since Settings.tsx's "Giọng đọc"/
 * "Tốc độ đọc" can change mid-session and each combo is a different audio file.
 */
const audioUrlCache = new Map<string, Promise<string>>();

function getAudioUrl(text: string): Promise<string> {
  const voice = getTtsVoice();
  const rate = getTtsRate();
  const key = `${voice} ${rate} ${text}`;
  let entry = audioUrlCache.get(key);
  if (!entry) {
    entry = api.fetchTtsAudio(text, voice, rate).then((blob) => URL.createObjectURL(blob));
    // A failed fetch shouldn't poison the cache forever — evict it so the
    // next tap gets a fresh attempt instead of an instant, permanent no-op.
    entry.catch(() => audioUrlCache.delete(key));
    audioUrlCache.set(key, entry);
  }
  return entry;
}

export async function speak(text: string) {
  try {
    const url = await getAudioUrl(text);
    const audio = new Audio(url);
    await audio.play();
  } catch {
    // Network hiccup, first-synthesis timeout, autoplay block, etc. — fall
    // back to on-device speech rather than leave the tap feeling dead.
    speakWithBrowser(text);
  }
}

function speakWithBrowser(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = getTtsVoice() === "uk" ? "en-GB" : "en-US";
  utterance.rate = getTtsRate() === "slow" ? 0.65 : 0.85;
  utterance.pitch = 1.1;
  window.speechSynthesis.speak(utterance);
}

import { createHash } from "node:crypto";
import { mkdir, readFile, rename, rm, stat } from "node:fs/promises";
import path from "node:path";
import { MsEdgeTTS, OUTPUT_FORMAT, RATE, type ProsodyOptions } from "msedge-tts";
import { env } from "../config/env.js";

/**
 * Text-to-speech, generated lazily and cached on disk forever after.
 *
 * Why lazy-generate-on-request instead of a pre-generation script: lesson
 * content (Story pages, vocab words, question answers...) is going to keep
 * growing — including content admins add later through the admin panel —
 * and a static pre-gen step would need to be re-run by hand every time any
 * of that changes. Caching by a hash of (voice, rate, text) means any text
 * this app ever asks to speak gets synthesised exactly once per (voice,
 * rate) combo, on whichever request happens to need it first, and every
 * request after that (including for brand-new content nobody pre-generated
 * for) is a disk read.
 *
 * Voice is msedge-tts's free Edge "Read Aloud" backend — same neural voices
 * Azure Speech uses, no API key required. `voice`/`rate` come from
 * Settings.tsx's "Giọng đọc"/"Tốc độ đọc" — see tts.routes.ts's mapping from
 * the request's validated `TtsVoiceKey`/`TtsRateKey` to the actual values
 * used here.
 */

const CACHE_DIR = path.resolve(process.cwd(), env.TTS_CACHE_DIR);
let cacheDirReady: Promise<void> | null = null;

function ensureCacheDir(): Promise<void> {
  cacheDirReady ??= mkdir(CACHE_DIR, { recursive: true }).then(() => undefined);
  return cacheDirReady;
}

/** Stable filename for a given (voice, rate, text) triple — same inputs always resolve to the same file. */
function cacheKey(text: string, voice: string, rate: string): string {
  return createHash("sha256").update(`${voice} ${rate} ${text}`).digest("hex");
}

function cachePath(key: string): string {
  return path.join(CACHE_DIR, `${key}.mp3`);
}

// Synthesising the same not-yet-cached (text, voice, rate) twice in quick
// succession (e.g. two tabs, or a double-click) would otherwise fire two
// Edge TTS requests and race to write the same file — dedupe concurrent
// callers onto one in-flight synthesis per key instead.
const inflight = new Map<string, Promise<string>>();

/**
 * Returns the absolute path to an mp3 for `text`, synthesising and caching
 * it first if this exact (voice, rate, text) hasn't been requested before.
 */
export async function getOrCreateAudio(text: string, voice: string = env.TTS_VOICE, rate: RATE | string = RATE.DEFAULT): Promise<string> {
  await ensureCacheDir();
  const key = cacheKey(text, voice, rate);
  const filePath = cachePath(key);

  if (await fileExists(filePath)) return filePath;

  const existing = inflight.get(key);
  if (existing) return existing;

  const job = synthesize(text, voice, rate, filePath).finally(() => inflight.delete(key));
  inflight.set(key, job);
  return job;
}

async function synthesize(text: string, voice: string, rate: RATE | string, destPath: string): Promise<string> {
  const tts = new MsEdgeTTS();
  await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
  const prosody: ProsodyOptions = { rate };
  // toFile() names the file itself (a random name) — write into the cache
  // dir, then rename to our content-hashed name so concurrent/future
  // synthesises of *different* (text, voice, rate) never collide.
  const { audioFilePath } = await tts.toFile(CACHE_DIR, text, prosody);
  await rename(audioFilePath, destPath);
  return destPath;
}

export async function readCachedAudio(filePath: string): Promise<Buffer> {
  return readFile(filePath);
}

/** Test/admin helper — wipes the whole cache so voices/content can be regenerated. */
export async function clearAudioCache(): Promise<void> {
  await rm(CACHE_DIR, { recursive: true, force: true });
  cacheDirReady = null;
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

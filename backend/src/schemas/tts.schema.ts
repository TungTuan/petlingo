import { z } from "zod";

// Fixed allow-lists (not free-text) for voice/rate — these become part of the
// cache filename AND the SSML sent to Edge TTS, so only ever accept exact
// values this app itself offers in Settings ("Giọng đọc"/"Tốc độ đọc"),
// never arbitrary client-supplied strings.
export const TTS_VOICES = { us: "en-US-JennyNeural", uk: "en-GB-SoniaNeural" } as const;
export const TTS_RATES = { normal: "default", slow: "slow" } as const;
export type TtsVoiceKey = keyof typeof TTS_VOICES;
export type TtsRateKey = keyof typeof TTS_RATES;

// 300 chars comfortably covers a whole Story sentence; anything longer than
// that coming through here is almost certainly abuse, not real lesson content.
export const ttsQuerySchema = z.object({
  text: z.string().trim().min(1, "Thiếu nội dung cần đọc.").max(300, "Nội dung đọc quá dài."),
  voice: z.enum(["us", "uk"]).optional(),
  rate: z.enum(["normal", "slow"]).optional(),
});
export type TtsQueryInput = z.infer<typeof ttsQuerySchema>;

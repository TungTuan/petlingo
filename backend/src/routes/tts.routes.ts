import type { FastifyInstance } from "fastify";
import { RATE } from "msedge-tts";
import { verifyAuth } from "../middleware/verifyAuth.js";
import { TTS_VOICES, ttsQuerySchema } from "../schemas/tts.schema.js";
import { getOrCreateAudio, readCachedAudio } from "../services/tts.service.js";

// Looser than the global 100/min default (that one's sized for cheap CRUD
// calls) but still capped — a cache miss here means an actual Edge TTS
// round-trip, not just a disk read, so it's worth guarding against abuse.
const TTS_RATE_LIMIT = { max: 60, timeWindow: "1 minute" };

// Maps the validated request keys (see ttsQuerySchema) to msedge-tts's
// actual voice ShortName / SSML rate — kept here, not client-supplied, so a
// request can never inject an arbitrary voice string or SSML rate value.
const RATE_BY_KEY: Record<"normal" | "slow", RATE> = { normal: RATE.DEFAULT, slow: RATE.SLOW };

export async function ttsRoutes(app: FastifyInstance) {
  // Same policy as catalog: any logged-in parent's session (kid app runs
  // under it) can request audio — no admin requirement.
  app.addHook("preHandler", verifyAuth);

  app.get<{ Querystring: { text: string; voice?: "us" | "uk"; rate?: "normal" | "slow" } }>(
    "/",
    { config: { rateLimit: TTS_RATE_LIMIT } },
    async (request, reply) => {
      const { text, voice, rate } = ttsQuerySchema.parse(request.query);
      const voiceName = voice ? TTS_VOICES[voice] : undefined;
      const rateValue = rate ? RATE_BY_KEY[rate] : undefined;
      const filePath = await getOrCreateAudio(text, voiceName, rateValue);
      const audio = await readCachedAudio(filePath);
      // Content for a given (text, voice, rate) is permanently stable, so
      // this is about as cacheable a response as they come — browsers can
      // keep it around indefinitely.
      return reply.header("Content-Type", "audio/mpeg").header("Cache-Control", "private, max-age=31536000, immutable").send(audio);
    },
  );
}

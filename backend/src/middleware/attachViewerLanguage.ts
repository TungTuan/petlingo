import type { FastifyReply, FastifyRequest } from "fastify";
import { prisma } from "../lib/prisma.js";

/**
 * preHandler for the public `/catalog/*` routes. Must run AFTER `verifyAuth`
 * (needs `request.parentId`). Looks up the viewer's chosen native language
 * once per request and attaches it as `request.viewerLanguage`, so
 * `catalog.service.ts`'s read functions can pick which language each piece
 * of content (word meanings, instructions, scenarios...) comes back in —
 * see `pickLang()` there.
 *
 * A parent who hasn't picked a language yet (`language: null` — see
 * schema.prisma's doc comment on Parent.language) falls back to "vi" here:
 * by the time any catalog route is actually hit, the app has already shown
 * LanguagePicker (App.tsx gates on `parent.language === null`), so this only
 * matters for edge cases (e.g. a stale cached session) — Vietnamese is the
 * safest default since it's the one language guaranteed to have full content.
 */
export async function attachViewerLanguage(request: FastifyRequest, _reply: FastifyReply) {
  const parent = await prisma.parent.findUnique({
    where: { id: request.parentId },
    select: { language: true },
  });
  request.viewerLanguage = parent?.language ?? "vi";
}

import { prisma } from "../lib/prisma.js";
import type {
  ChatBuddyRoundData,
  DetectiveAccuseData,
  DetectiveInterrogateData,
  HomeObject,
  HomeZone,
  RpgQuestion,
  ShopRequiredItem,
  ShopShelfItem,
  WordTrainFillData,
  WordTrainScrambleData,
} from "../schemas/admin.schema.js";

/**
 * Read-only, kid-app-facing views of the same World/Lesson/Question/Vocab
 * tables the /admin/* routes manage — `isActive` filters + a trimmed field
 * set so a disabled draft never reaches a child's device.
 *
 * `viewerId` (the requesting parent's id) additionally scopes every
 * Lesson/Story/MiniGameTopic/WordCatchTopic read to "system content
 * (parentId null) OR this parent's own content" — a parent's self-serve
 * rows (see routes/my/*) are private to their own kids, mixed transparently
 * into the same list a child sees alongside the admin-curated catalog.
 *
 * `viewerLang` (the requesting parent's chosen native language — see
 * middleware/attachViewerLanguage.ts) additionally decides WHICH language
 * each piece of meaning/instruction/scenario text comes back in — see
 * `pickLang()` below. Every response keeps the field's ORIGINAL name (e.g.
 * `vi`, `instructionVi`, `scenarioVi`) regardless of which language actually
 * ends up in it — the frontend was built against these names before this
 * feature existed, and resolving the language here (instead of pushing
 * vi/ja/ko all the way to ~10 page components) means none of them need to
 * change at all.
 */

type Lang = "vi" | "en" | "ja" | "ko";

/**
 * Picks the localized value for the viewer's language, falling back to
 * `vi` when the requested language has no translation yet (e.g. self-serve
 * "Nội dung của tôi" content, which is Vietnamese-only by design — see
 * TASKS.md) — same graceful-degradation philosophy as `useT()`'s
 * `DICTIONARY[vi] ?? vi` on the frontend. `lang === "en"` deliberately also
 * resolves to `vi`: there's no "explain English via English" concept, and
 * this preserves the app's original en-UI/vi-content behavior unchanged.
 */
function pickLang(v: { vi: string; ja?: string | null; ko?: string | null }, lang: Lang): string {
  if (lang === "ja" && v.ja) return v.ja;
  if (lang === "ko" && v.ko) return v.ko;
  return v.vi;
}

function ownershipFilter(viewerId: string) {
  return { OR: [{ parentId: null }, { parentId: viewerId }] };
}

/** Array counterpart of `pickLang()` — same fallback-to-vi semantics, for
 * fields like ChatBuddyRound's `options`/`optionsVi`/`optionsJa`/`optionsKo`
 * where the localized value is a whole array, not a single string. */
function pickLangArray(v: { vi: string[]; ja?: string[] | null; ko?: string[] | null }, lang: Lang): string[] {
  if (lang === "ja" && v.ja) return v.ja;
  if (lang === "ko" && v.ko) return v.ko;
  return v.vi;
}

export async function listActiveWorlds() {
  return prisma.world.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
    select: { id: true, key: true, name: true, topic: true, colorTheme: true, requiredStars: true, order: true },
  });
}

export async function listActiveLessons(worldId: string, viewerId: string) {
  const rows = await prisma.lesson.findMany({
    where: { worldId, isActive: true, ...ownershipFilter(viewerId) },
    orderBy: { order: "asc" },
    select: { id: true, title: true, order: true, parentId: true },
  });
  return rows.map((l) => ({ ...l, isOwn: l.parentId !== null }));
}

export async function listQuestions(lessonId: string) {
  const rows = await prisma.question.findMany({ where: { lessonId }, orderBy: { order: "asc" } });
  return rows.map((q) => ({
    id: q.id,
    prompt: q.prompt,
    hint: q.hint ?? "",
    answer: q.answer,
    options: Array.isArray(q.options) ? (q.options as string[]) : [],
  }));
}

// ---- Stories (Đọc truyện) --------------------------------------------------

export async function listActiveStories(viewerId: string) {
  const rows = await prisma.story.findMany({
    // Drafts created by parents can exist before their first page is added.
    // Keep those drafts in the editor, but never expose empty story cards in
    // the child's reading library.
    where: { isActive: true, pages: { some: {} }, ...ownershipFilter(viewerId) },
    orderBy: { order: "asc" },
    select: { id: true, key: true, title: true, topic: true, colorTheme: true, order: true, parentId: true, _count: { select: { pages: true } } },
  });
  return rows.map((s) => ({ ...s, isOwn: s.parentId !== null }));
}

export async function getStoryWithPages(id: string, viewerId: string, viewerLang: Lang) {
  const story = await prisma.story.findFirst({ where: { id, isActive: true, ...ownershipFilter(viewerId) } });
  if (!story) return null;
  const pages = await prisma.storyPage.findMany({ where: { storyId: id }, orderBy: { order: "asc" } });
  return {
    id: story.id,
    key: story.key,
    title: story.title,
    topic: story.topic,
    colorTheme: story.colorTheme,
    pages: pages.map((p) => ({
      id: p.id,
      en: p.en,
      vi: pickLang(p, viewerLang),
      img1: p.img1,
      img2: p.img2,
      label: p.label,
      sceneBg: p.sceneBg,
      ground: p.ground,
      words: (Array.isArray(p.words) ? (p.words as { en: string; vi: string; ja?: string | null; ko?: string | null; color: string }[]) : []).map((w) => ({
        en: w.en,
        vi: pickLang(w, viewerLang),
        color: w.color,
      })),
    })),
  };
}

// ---- Memory Match topics ----------------------------------------------------

export async function listActiveMiniGameTopics(viewerId: string) {
  const rows = await prisma.miniGameTopic.findMany({
    where: { isActive: true, ...ownershipFilter(viewerId) },
    orderBy: { order: "asc" },
    select: { id: true, key: true, name: true, color: true, order: true, parentId: true, _count: { select: { words: true } } },
  });
  return rows.map((t) => ({ ...t, isOwn: t.parentId !== null }));
}

export async function getMiniGameTopicWithWords(id: string, viewerId: string, viewerLang: Lang) {
  const topic = await prisma.miniGameTopic.findFirst({ where: { id, isActive: true, ...ownershipFilter(viewerId) } });
  if (!topic) return null;
  const words = await prisma.miniGameWord.findMany({ where: { topicId: id }, orderBy: { order: "asc" } });
  return {
    id: topic.id,
    key: topic.key,
    name: topic.name,
    color: topic.color,
    words: words.map((w) => ({ en: w.en, vi: pickLang(w, viewerLang), img: w.img })),
  };
}

// ---- Word Catch topics -------------------------------------------------------

export async function listActiveWordCatchTopics(viewerId: string) {
  const rows = await prisma.wordCatchTopic.findMany({
    where: { isActive: true, ...ownershipFilter(viewerId) },
    orderBy: { order: "asc" },
    select: { id: true, key: true, name: true, order: true, parentId: true, _count: { select: { rounds: true } } },
  });
  return rows.map((t) => ({ ...t, isOwn: t.parentId !== null }));
}

export async function getWordCatchTopicWithRounds(id: string, viewerId: string, viewerLang: Lang) {
  const topic = await prisma.wordCatchTopic.findFirst({ where: { id, isActive: true, ...ownershipFilter(viewerId) } });
  if (!topic) return null;
  const rounds = await prisma.wordCatchRound.findMany({ where: { topicId: id }, orderBy: { order: "asc" } });
  return {
    id: topic.id,
    key: topic.key,
    name: topic.name,
    rounds: rounds.map((r) => ({ vi: pickLang(r, viewerLang), answer: r.answer, options: Array.isArray(r.options) ? (r.options as string[]) : [] })),
  };
}

// ---- English Shop topics ----------------------------------------------------

export async function listActiveShopTopics(viewerId: string) {
  const rows = await prisma.shopTopic.findMany({
    where: { isActive: true, ...ownershipFilter(viewerId) },
    orderBy: { order: "asc" },
    select: { id: true, key: true, name: true, color: true, order: true, parentId: true, _count: { select: { rounds: true } } },
  });
  return rows.map((t) => ({ ...t, isOwn: t.parentId !== null }));
}

export async function getShopTopicWithRounds(id: string, viewerId: string, viewerLang: Lang) {
  const topic = await prisma.shopTopic.findFirst({ where: { id, isActive: true, ...ownershipFilter(viewerId) } });
  if (!topic) return null;
  const rounds = await prisma.shopRound.findMany({ where: { topicId: id }, orderBy: { order: "asc" } });
  return {
    id: topic.id,
    key: topic.key,
    name: topic.name,
    color: topic.color,
    rounds: rounds.map((r) => ({
      instructionEn: r.instructionEn,
      instructionVi: pickLang({ vi: r.instructionVi, ja: r.instructionJa, ko: r.instructionKo }, viewerLang),
      shelf: (Array.isArray(r.shelf) ? (r.shelf as ShopShelfItem[]) : []).map((s) => ({ en: s.en, vi: pickLang(s, viewerLang), emoji: s.emoji, price: s.price })),
      required: Array.isArray(r.required) ? (r.required as ShopRequiredItem[]) : [],
    })),
  };
}

// ---- English Home topics ----------------------------------------------------

export async function listActiveHomeTopics(viewerId: string) {
  const rows = await prisma.homeTopic.findMany({
    where: { isActive: true, ...ownershipFilter(viewerId) },
    orderBy: { order: "asc" },
    select: { id: true, key: true, name: true, color: true, order: true, parentId: true, _count: { select: { rounds: true } } },
  });
  return rows.map((t) => ({ ...t, isOwn: t.parentId !== null }));
}

export async function getHomeTopicWithRounds(id: string, viewerId: string, viewerLang: Lang) {
  const topic = await prisma.homeTopic.findFirst({ where: { id, isActive: true, ...ownershipFilter(viewerId) } });
  if (!topic) return null;
  const rounds = await prisma.homeRound.findMany({ where: { topicId: id }, orderBy: { order: "asc" } });
  return {
    id: topic.id,
    key: topic.key,
    name: topic.name,
    color: topic.color,
    // objects/zones stay English-only by design (see schema.prisma) — no pickLang needed here.
    rounds: rounds.map((r) => ({
      instructionEn: r.instructionEn,
      instructionVi: pickLang({ vi: r.instructionVi, ja: r.instructionJa, ko: r.instructionKo }, viewerLang),
      objects: Array.isArray(r.objects) ? (r.objects as HomeObject[]) : [],
      correctObjectKey: r.correctObjectKey,
      zones: Array.isArray(r.zones) ? (r.zones as HomeZone[]) : [],
      correctZoneKey: r.correctZoneKey,
    })),
  };
}

// ---- Word RPG topics ----------------------------------------------------

export async function listActiveRpgTopics(viewerId: string) {
  const rows = await prisma.rpgTopic.findMany({
    where: { isActive: true, ...ownershipFilter(viewerId) },
    orderBy: { order: "asc" },
    select: { id: true, key: true, name: true, color: true, order: true, parentId: true, _count: { select: { monsters: true } } },
  });
  return rows.map((t) => ({ ...t, isOwn: t.parentId !== null }));
}

export async function getRpgTopicWithMonsters(id: string, viewerId: string, viewerLang: Lang) {
  const topic = await prisma.rpgTopic.findFirst({ where: { id, isActive: true, ...ownershipFilter(viewerId) } });
  if (!topic) return null;
  const monsters = await prisma.rpgMonster.findMany({ where: { topicId: id }, orderBy: { order: "asc" } });
  return {
    id: topic.id,
    key: topic.key,
    name: topic.name,
    color: topic.color,
    monsters: monsters.map((m) => ({
      id: m.id,
      name: m.name,
      emoji: m.emoji,
      isBoss: m.isBoss,
      questions: (Array.isArray(m.questions) ? (m.questions as RpgQuestion[]) : []).map((q) => ({
        en: q.en,
        // answerVi/optionsVi are the base data (see schema.prisma's doc comment on
        // RpgMonster.questions) — optionsJa/optionsKo, when present, are the SAME
        // array translated preserving order, so the resolved answer's index still
        // matches the resolved options' index regardless of which language wins.
        answer: viewerLang === "ja" && q.answerJa ? q.answerJa : viewerLang === "ko" && q.answerKo ? q.answerKo : q.answerVi,
        options: viewerLang === "ja" && q.optionsJa ? q.optionsJa : viewerLang === "ko" && q.optionsKo ? q.optionsKo : q.optionsVi,
      })),
    })),
  };
}

// ---- Word Train topics ----------------------------------------------------

export async function listActiveWordTrainTopics(viewerId: string) {
  const rows = await prisma.wordTrainTopic.findMany({
    where: { isActive: true, ...ownershipFilter(viewerId) },
    orderBy: { order: "asc" },
    select: { id: true, key: true, name: true, color: true, order: true, parentId: true, _count: { select: { rounds: true } } },
  });
  return rows.map((t) => ({ ...t, isOwn: t.parentId !== null }));
}

export async function getWordTrainTopicWithRounds(id: string, viewerId: string, viewerLang: Lang) {
  const topic = await prisma.wordTrainTopic.findFirst({ where: { id, isActive: true, ...ownershipFilter(viewerId) } });
  if (!topic) return null;
  const rounds = await prisma.wordTrainRound.findMany({ where: { topicId: id }, orderBy: { order: "asc" } });
  return {
    id: topic.id,
    key: topic.key,
    name: topic.name,
    color: topic.color,
    rounds: rounds.map((r) => ({
      kind: r.kind as "fill" | "scramble",
      vi: pickLang(r, viewerLang),
      data: r.data as WordTrainFillData | WordTrainScrambleData,
    })),
  };
}

// ---- Detective cases --------------------------------------------------

export async function listActiveDetectiveCases(viewerId: string, viewerLang: Lang) {
  const rows = await prisma.detectiveCase.findMany({
    where: { isActive: true, ...ownershipFilter(viewerId) },
    orderBy: { order: "asc" },
    select: {
      id: true,
      key: true,
      name: true,
      scenario: true,
      scenarioVi: true,
      scenarioJa: true,
      scenarioKo: true,
      color: true,
      order: true,
      parentId: true,
      _count: { select: { rounds: true } },
    },
  });
  return rows.map((c) => ({
    id: c.id,
    key: c.key,
    name: c.name,
    scenario: c.scenario,
    scenarioVi: pickLang({ vi: c.scenarioVi, ja: c.scenarioJa, ko: c.scenarioKo }, viewerLang),
    color: c.color,
    order: c.order,
    _count: c._count,
    isOwn: c.parentId !== null,
  }));
}

export async function getDetectiveCaseWithRounds(id: string, viewerId: string, viewerLang: Lang) {
  const detectiveCase = await prisma.detectiveCase.findFirst({ where: { id, isActive: true, ...ownershipFilter(viewerId) } });
  if (!detectiveCase) return null;
  const rounds = await prisma.detectiveRound.findMany({ where: { caseId: id }, orderBy: { order: "asc" } });
  return {
    id: detectiveCase.id,
    key: detectiveCase.key,
    name: detectiveCase.name,
    scenario: detectiveCase.scenario,
    scenarioVi: pickLang({ vi: detectiveCase.scenarioVi, ja: detectiveCase.scenarioJa, ko: detectiveCase.scenarioKo }, viewerLang),
    color: detectiveCase.color,
    rounds: rounds.map((r) => {
      const kind = r.kind as "interrogate" | "accuse";
      const data = r.data as DetectiveInterrogateData | DetectiveAccuseData;
      const resolvedData =
        kind === "interrogate"
          ? (() => {
              const d = data as DetectiveInterrogateData;
              return {
                npcName: d.npcName,
                npcEmoji: d.npcEmoji,
                testimony: d.testimony,
                testimonyVi: pickLang({ vi: d.testimonyVi, ja: d.testimonyJa, ko: d.testimonyKo }, viewerLang),
                question: d.question,
                options: d.options,
                answerIndex: d.answerIndex,
                clue: pickLang({ vi: d.clueVi, ja: d.clueJa, ko: d.clueKo }, viewerLang),
              };
            })()
          : data;
      return { kind, vi: pickLang(r, viewerLang), data: resolvedData };
    }),
  };
}

// ---- Echo Parrot topics ----------------------------------------------------

export async function listActiveEchoParrotTopics(viewerId: string) {
  const rows = await prisma.echoParrotTopic.findMany({
    where: { isActive: true, ...ownershipFilter(viewerId) },
    orderBy: { order: "asc" },
    select: { id: true, key: true, name: true, color: true, order: true, parentId: true, _count: { select: { rounds: true } } },
  });
  return rows.map((t) => ({ ...t, isOwn: t.parentId !== null }));
}

export async function getEchoParrotTopicWithRounds(id: string, viewerId: string, viewerLang: Lang) {
  const topic = await prisma.echoParrotTopic.findFirst({ where: { id, isActive: true, ...ownershipFilter(viewerId) } });
  if (!topic) return null;
  const rounds = await prisma.echoParrotRound.findMany({ where: { topicId: id }, orderBy: { order: "asc" } });
  return {
    id: topic.id,
    key: topic.key,
    name: topic.name,
    color: topic.color,
    rounds: rounds.map((r) => ({ en: r.en, vi: pickLang(r, viewerLang), phonetic: r.phonetic, petKey: r.petKey })),
  };
}

// ---- Chat with Buddy topics --------------------------------------------

export async function listActiveChatBuddyTopics(viewerId: string) {
  const rows = await prisma.chatBuddyTopic.findMany({
    where: { isActive: true, ...ownershipFilter(viewerId) },
    orderBy: { order: "asc" },
    select: { id: true, key: true, name: true, color: true, order: true, parentId: true, _count: { select: { rounds: true } } },
  });
  return rows.map((t) => ({ ...t, isOwn: t.parentId !== null }));
}

export async function getChatBuddyTopicWithRounds(id: string, viewerId: string, viewerLang: Lang) {
  const topic = await prisma.chatBuddyTopic.findFirst({ where: { id, isActive: true, ...ownershipFilter(viewerId) } });
  if (!topic) return null;
  const rounds = await prisma.chatBuddyRound.findMany({ where: { topicId: id }, orderBy: { order: "asc" } });
  return {
    id: topic.id,
    key: topic.key,
    name: topic.name,
    color: topic.color,
    rounds: rounds.map((r) => {
      const d = r.data as ChatBuddyRoundData;
      return {
        petLine: d.petLine,
        petLineVi: pickLang({ vi: d.petLineVi, ja: d.petLineJa, ko: d.petLineKo }, viewerLang),
        options: d.options,
        optionsVi: pickLangArray({ vi: d.optionsVi, ja: d.optionsJa, ko: d.optionsKo }, viewerLang),
        answerIndex: d.answerIndex,
        replyLine: d.replyLine,
        replyLineVi: pickLang({ vi: d.replyLineVi, ja: d.replyLineJa, ko: d.replyLineKo }, viewerLang),
      };
    }),
  };
}

/** Vocab.worldId isn't a real FK (see schema.prisma) — it's reused here as a free-form topic key. */
export async function listVocabTopics() {
  const rows = await prisma.vocab.groupBy({ by: ["worldId"], _count: { _all: true } });
  return rows.map((r) => ({ topic: r.worldId, count: r._count._all })).sort((a, b) => a.topic.localeCompare(b.topic));
}

export async function listVocabByTopic(topic: string, viewerLang: Lang) {
  const rows = await prisma.vocab.findMany({
    where: { worldId: topic },
    orderBy: { word: "asc" },
    select: { id: true, word: true, meaningVi: true, meaningJa: true, meaningKo: true },
  });
  return rows.map((v) => ({ id: v.id, word: v.word, meaningVi: pickLang({ vi: v.meaningVi, ja: v.meaningJa, ko: v.meaningKo }, viewerLang) }));
}

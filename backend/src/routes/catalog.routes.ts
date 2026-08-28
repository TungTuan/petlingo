import type { FastifyInstance } from "fastify";
import { attachViewerLanguage } from "../middleware/attachViewerLanguage.js";
import { verifyAuth } from "../middleware/verifyAuth.js";
import { AppError } from "../middleware/errorHandler.js";
import {
  getChatBuddyTopicWithRounds,
  getDetectiveCaseWithRounds,
  getEchoParrotTopicWithRounds,
  getHomeTopicWithRounds,
  getMiniGameTopicWithWords,
  getRpgTopicWithMonsters,
  getShopTopicWithRounds,
  getStoryWithPages,
  getWordCatchTopicWithRounds,
  getWordTrainTopicWithRounds,
  listActiveChatBuddyTopics,
  listActiveDetectiveCases,
  listActiveEchoParrotTopics,
  listActiveHomeTopics,
  listActiveLessons,
  listActiveMiniGameTopics,
  listActiveRpgTopics,
  listActiveShopTopics,
  listActiveStories,
  listActiveWordCatchTopics,
  listActiveWordTrainTopics,
  listActiveWorlds,
  listQuestions,
  listVocabByTopic,
  listVocabTopics,
} from "../services/catalog.service.js";

export async function catalogRoutes(app: FastifyInstance) {
  // Any logged-in parent can read the catalog — no admin requirement, this
  // is what the kid app itself plays through.
  app.addHook("preHandler", verifyAuth);
  // Resolves request.viewerLanguage from the viewer's account — every
  // route below passes it into catalog.service.ts so word/instruction/
  // scenario meanings come back already picked for the right language
  // (see pickLang() there). Must run after verifyAuth (needs parentId).
  app.addHook("preHandler", attachViewerLanguage);

  app.get("/worlds", async (_request, reply) => {
    return reply.send({ worlds: await listActiveWorlds() });
  });

  app.get<{ Params: { id: string } }>("/worlds/:id/lessons", async (request, reply) => {
    return reply.send({ lessons: await listActiveLessons(request.params.id, request.parentId) });
  });

  app.get<{ Params: { id: string } }>("/lessons/:id/questions", async (request, reply) => {
    return reply.send({ questions: await listQuestions(request.params.id) });
  });

  app.get("/vocab/topics", async (_request, reply) => {
    return reply.send({ topics: await listVocabTopics() });
  });

  app.get<{ Querystring: { topic: string } }>("/vocab", async (request, reply) => {
    return reply.send({ words: await listVocabByTopic(request.query.topic, request.viewerLanguage) });
  });

  // ---- Stories (Đọc truyện) ------------------------------------------------

  app.get("/stories", async (request, reply) => {
    return reply.send({ stories: await listActiveStories(request.parentId) });
  });

  app.get<{ Params: { id: string } }>("/stories/:id", async (request, reply) => {
    const story = await getStoryWithPages(request.params.id, request.parentId, request.viewerLanguage);
    if (!story) throw new AppError(404, "Không tìm thấy truyện.", "STORY_NOT_FOUND");
    return reply.send({ story });
  });

  // ---- Memory Match topics --------------------------------------------------

  app.get("/minigame-topics", async (request, reply) => {
    return reply.send({ topics: await listActiveMiniGameTopics(request.parentId) });
  });

  app.get<{ Params: { id: string } }>("/minigame-topics/:id", async (request, reply) => {
    const topic = await getMiniGameTopicWithWords(request.params.id, request.parentId, request.viewerLanguage);
    if (!topic) throw new AppError(404, "Không tìm thấy chủ đề.", "MINIGAME_TOPIC_NOT_FOUND");
    return reply.send({ topic });
  });

  // ---- Word Catch topics ------------------------------------------------------

  app.get("/wordcatch-topics", async (request, reply) => {
    return reply.send({ topics: await listActiveWordCatchTopics(request.parentId) });
  });

  app.get<{ Params: { id: string } }>("/wordcatch-topics/:id", async (request, reply) => {
    const topic = await getWordCatchTopicWithRounds(request.params.id, request.parentId, request.viewerLanguage);
    if (!topic) throw new AppError(404, "Không tìm thấy chủ đề.", "WORDCATCH_TOPIC_NOT_FOUND");
    return reply.send({ topic });
  });

  // ---- English Shop topics ----------------------------------------------------

  app.get("/shop-topics", async (request, reply) => {
    return reply.send({ topics: await listActiveShopTopics(request.parentId) });
  });

  app.get<{ Params: { id: string } }>("/shop-topics/:id", async (request, reply) => {
    const topic = await getShopTopicWithRounds(request.params.id, request.parentId, request.viewerLanguage);
    if (!topic) throw new AppError(404, "Không tìm thấy chủ đề.", "SHOP_TOPIC_NOT_FOUND");
    return reply.send({ topic });
  });

  // ---- English Home topics ----------------------------------------------------

  app.get("/home-topics", async (request, reply) => {
    return reply.send({ topics: await listActiveHomeTopics(request.parentId) });
  });

  app.get<{ Params: { id: string } }>("/home-topics/:id", async (request, reply) => {
    const topic = await getHomeTopicWithRounds(request.params.id, request.parentId, request.viewerLanguage);
    if (!topic) throw new AppError(404, "Không tìm thấy chủ đề.", "HOME_TOPIC_NOT_FOUND");
    return reply.send({ topic });
  });

  // ---- Word RPG topics ----------------------------------------------------

  app.get("/rpg-topics", async (request, reply) => {
    return reply.send({ topics: await listActiveRpgTopics(request.parentId) });
  });

  app.get<{ Params: { id: string } }>("/rpg-topics/:id", async (request, reply) => {
    const topic = await getRpgTopicWithMonsters(request.params.id, request.parentId, request.viewerLanguage);
    if (!topic) throw new AppError(404, "Không tìm thấy hầm ngục.", "RPG_TOPIC_NOT_FOUND");
    return reply.send({ topic });
  });

  // ---- Word Train topics ----------------------------------------------------

  app.get("/word-train-topics", async (request, reply) => {
    return reply.send({ topics: await listActiveWordTrainTopics(request.parentId) });
  });

  app.get<{ Params: { id: string } }>("/word-train-topics/:id", async (request, reply) => {
    const topic = await getWordTrainTopicWithRounds(request.params.id, request.parentId, request.viewerLanguage);
    if (!topic) throw new AppError(404, "Không tìm thấy chuyến tàu.", "WORD_TRAIN_TOPIC_NOT_FOUND");
    return reply.send({ topic });
  });

  app.get("/detective-cases", async (request, reply) => {
    return reply.send({ cases: await listActiveDetectiveCases(request.parentId, request.viewerLanguage) });
  });

  app.get<{ Params: { id: string } }>("/detective-cases/:id", async (request, reply) => {
    const detectiveCase = await getDetectiveCaseWithRounds(request.params.id, request.parentId, request.viewerLanguage);
    if (!detectiveCase) throw new AppError(404, "Không tìm thấy vụ án.", "DETECTIVE_CASE_NOT_FOUND");
    return reply.send({ case: detectiveCase });
  });

  app.get("/echo-parrot-topics", async (request, reply) => {
    return reply.send({ topics: await listActiveEchoParrotTopics(request.parentId) });
  });

  app.get<{ Params: { id: string } }>("/echo-parrot-topics/:id", async (request, reply) => {
    const topic = await getEchoParrotTopicWithRounds(request.params.id, request.parentId, request.viewerLanguage);
    if (!topic) throw new AppError(404, "Không tìm thấy chủ đề.", "ECHO_PARROT_TOPIC_NOT_FOUND");
    return reply.send({ topic });
  });

  app.get("/chat-buddy-topics", async (request, reply) => {
    return reply.send({ topics: await listActiveChatBuddyTopics(request.parentId) });
  });

  app.get<{ Params: { id: string } }>("/chat-buddy-topics/:id", async (request, reply) => {
    const topic = await getChatBuddyTopicWithRounds(request.params.id, request.parentId, request.viewerLanguage);
    if (!topic) throw new AppError(404, "Không tìm thấy chủ đề.", "CHAT_BUDDY_TOPIC_NOT_FOUND");
    return reply.send({ topic });
  });
}

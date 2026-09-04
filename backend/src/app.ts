import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import rateLimit from "@fastify/rate-limit";
import websocket from "@fastify/websocket";
import Fastify from "fastify";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { adminChatBuddyRoundsRoutes } from "./routes/admin/chatBuddyRounds.routes.js";
import { adminChatBuddyTopicsRoutes } from "./routes/admin/chatBuddyTopics.routes.js";
import { adminDetectiveCasesRoutes } from "./routes/admin/detectiveCases.routes.js";
import { adminDetectiveRoundsRoutes } from "./routes/admin/detectiveRounds.routes.js";
import { adminEchoParrotRoundsRoutes } from "./routes/admin/echoParrotRounds.routes.js";
import { adminEchoParrotTopicsRoutes } from "./routes/admin/echoParrotTopics.routes.js";
import { adminItemsRoutes } from "./routes/admin/items.routes.js";
import { adminLessonsRoutes } from "./routes/admin/lessons.routes.js";
import { adminMiniGameTopicsRoutes } from "./routes/admin/miniGameTopics.routes.js";
import { adminMiniGameWordsRoutes } from "./routes/admin/miniGameWords.routes.js";
import { adminPetsRoutes } from "./routes/admin/pets.routes.js";
import { adminQuestionsRoutes } from "./routes/admin/questions.routes.js";
import { adminHomeRoundsRoutes } from "./routes/admin/homeRounds.routes.js";
import { adminHomeTopicsRoutes } from "./routes/admin/homeTopics.routes.js";
import { adminQuestsRoutes } from "./routes/admin/quests.routes.js";
import { adminBattlePassRoutes } from "./routes/admin/battlePassSeasons.routes.js";
import { battlePassRoutes } from "./routes/battlePass.routes.js";
import { adminShopPackagesRoutes } from "./routes/admin/shopPackages.routes.js";
import { packagesRoutes } from "./routes/packages.routes.js";
import { adminRpgMonstersRoutes } from "./routes/admin/rpgMonsters.routes.js";
import { adminRpgTopicsRoutes } from "./routes/admin/rpgTopics.routes.js";
import { adminShopRoundsRoutes } from "./routes/admin/shopRounds.routes.js";
import { adminShopTopicsRoutes } from "./routes/admin/shopTopics.routes.js";
import { adminWordTrainRoundsRoutes } from "./routes/admin/wordTrainRounds.routes.js";
import { adminWordTrainTopicsRoutes } from "./routes/admin/wordTrainTopics.routes.js";
import { adminStoriesRoutes } from "./routes/admin/stories.routes.js";
import { adminStoryPagesRoutes } from "./routes/admin/storyPages.routes.js";
import { adminUsersRoutes } from "./routes/admin/users.routes.js";
import { adminWordCatchRoundsRoutes } from "./routes/admin/wordCatchRounds.routes.js";
import { adminWordCatchTopicsRoutes } from "./routes/admin/wordCatchTopics.routes.js";
import { adminWorldsRoutes } from "./routes/admin/worlds.routes.js";
import { authRoutes } from "./routes/auth.routes.js";
import { catalogRoutes } from "./routes/catalog.routes.js";
import { childRoutes } from "./routes/child.routes.js";
import { fightRoutes } from "./routes/fight.routes.js";
import { fightWsRoutes } from "./routes/fight.ws.routes.js";
import { inventoryRoutes } from "./routes/inventory.routes.js";
import { myChatBuddyRoundsRoutes } from "./routes/my/chatBuddyRounds.routes.js";
import { myChatBuddyTopicsRoutes } from "./routes/my/chatBuddyTopics.routes.js";
import { myDetectiveCasesRoutes } from "./routes/my/detectiveCases.routes.js";
import { myDetectiveRoundsRoutes } from "./routes/my/detectiveRounds.routes.js";
import { myEchoParrotRoundsRoutes } from "./routes/my/echoParrotRounds.routes.js";
import { myEchoParrotTopicsRoutes } from "./routes/my/echoParrotTopics.routes.js";
import { myLessonsRoutes } from "./routes/my/lessons.routes.js";
import { myMiniGameTopicsRoutes } from "./routes/my/miniGameTopics.routes.js";
import { savedWordsRoutes } from "./routes/savedWords.routes.js";
import { notificationRoutes } from "./routes/notification.routes.js";
import { myMiniGameWordsRoutes } from "./routes/my/miniGameWords.routes.js";
import { myHomeRoundsRoutes } from "./routes/my/homeRounds.routes.js";
import { myHomeTopicsRoutes } from "./routes/my/homeTopics.routes.js";
import { myQuestionsRoutes } from "./routes/my/questions.routes.js";
import { myQuotaRoutes } from "./routes/my/quota.routes.js";
import { myRpgMonstersRoutes } from "./routes/my/rpgMonsters.routes.js";
import { myRpgTopicsRoutes } from "./routes/my/rpgTopics.routes.js";
import { myShopRoundsRoutes } from "./routes/my/shopRounds.routes.js";
import { myShopTopicsRoutes } from "./routes/my/shopTopics.routes.js";
import { myWordTrainRoundsRoutes } from "./routes/my/wordTrainRounds.routes.js";
import { myWordTrainTopicsRoutes } from "./routes/my/wordTrainTopics.routes.js";
import { myStoriesRoutes } from "./routes/my/stories.routes.js";
import { myStoryPagesRoutes } from "./routes/my/storyPages.routes.js";
import { myWordCatchRoundsRoutes } from "./routes/my/wordCatchRounds.routes.js";
import { myWordCatchTopicsRoutes } from "./routes/my/wordCatchTopics.routes.js";
import { petCareRoutes } from "./routes/petCare.routes.js";
import { progressRoutes } from "./routes/progress.routes.js";
import { friendRoutes } from "./routes/friend.routes.js";
import { questRoutes } from "./routes/quest.routes.js";
import { rpgRoutes } from "./routes/rpg.routes.js";
import { ttsRoutes } from "./routes/tts.routes.js";

export function buildApp() {
  const app = Fastify({
    logger: {
      level: env.NODE_ENV === "test" ? "silent" : "info",
      transport: env.NODE_ENV === "development" ? { target: "pino-pretty" } : undefined,
    },
  });

  const allowedOrigins = env.CORS_ORIGIN.split(",").map((s) => s.trim());
  // ngrok's free tunnel URL is random and changes every time it restarts
  // (see frontend/MOBILE_BUILD.md's "Backend qua ngrok" section) — rather
  // than hand-editing CORS_ORIGIN each session, just allow any *.ngrok-free.app
  // / *.ngrok.io / *.ngrok.app origin outside production. Still HTTPS-only,
  // and never applies in production regardless of what's in CORS_ORIGIN.
  const NGROK_ORIGIN = /^https:\/\/[a-z0-9-]+\.(ngrok-free\.app|ngrok\.io|ngrok\.app)$/;
  app.register(cors, {
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      // Vite automatically tries the next port when 5173 is occupied. Allow
      // loopback dev origins without forcing developers to edit .env for each
      // local run; production remains strict.
      if (env.NODE_ENV !== "production" && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) return cb(null, true);
      if (env.NODE_ENV !== "production" && NGROK_ORIGIN.test(origin)) return cb(null, true);
      cb(new Error("Not allowed by CORS"), false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  // Register the plugin without a global bucket. Normal gameplay legitimately
  // fans out into many authenticated requests (pet stats, catalog, quests), so
  // one IP-wide 100/min limit punished ordinary play. Expensive/sensitive
  // endpoints opt in to their own limits (login and TTS).
  app.register(rateLimit, { global: false });

  // Global request-body validation errors and thrown AppErrors are all
  // funneled through one place — see middleware/errorHandler.ts.
  app.setErrorHandler(errorHandler);

  // Powers the "Đấu trường" (fight room) live battle — see routes/fight.ws.routes.ts.
  app.register(websocket);

  // Two independent JWT instances (different secret + TTL) so access and
  // refresh tokens can never be verified against each other's secret.
  app.register(jwt, {
    secret: env.JWT_ACCESS_SECRET,
    namespace: "access",
    jwtSign: "accessJwtSign",
    jwtVerify: "accessJwtVerify",
    jwtDecode: "accessJwtDecode",
    sign: { expiresIn: env.JWT_ACCESS_EXPIRES_IN },
  });
  app.register(jwt, {
    secret: env.JWT_REFRESH_SECRET,
    namespace: "refresh",
    jwtSign: "refreshJwtSign",
    jwtVerify: "refreshJwtVerify",
    jwtDecode: "refreshJwtDecode",
    sign: { expiresIn: env.JWT_REFRESH_EXPIRES_IN },
  });

  app.get("/health", async () => ({ status: "ok" }));

  app.register(authRoutes, { prefix: "/auth" });
  app.register(childRoutes, { prefix: "/children" });
  app.register(progressRoutes, { prefix: "/children" });
  app.register(friendRoutes, { prefix: "/children" });
  app.register(inventoryRoutes, { prefix: "/children" });
  app.register(savedWordsRoutes, { prefix: "/children" });
  app.register(notificationRoutes, { prefix: "/children" });
  app.register(battlePassRoutes, { prefix: "/children" });
  app.register(packagesRoutes, { prefix: "/children" });
  app.register(petCareRoutes, { prefix: "/children" });
  app.register(questRoutes, { prefix: "/children" });
  app.register(catalogRoutes, { prefix: "/catalog" });
  app.register(ttsRoutes, { prefix: "/tts" });
  app.register(fightRoutes, { prefix: "/fight" });
  app.register(fightWsRoutes, { prefix: "/fight" });
  app.register(rpgRoutes, { prefix: "/rpg" });

  // Self-serve: any logged-in parent managing content THEY created (see
  // services/admin/*.service.ts's ownerId scoping) — distinct from /admin/*
  // below, which requires the ADMIN role and manages everything unscoped.
  app.register(myLessonsRoutes, { prefix: "/my/lessons" });
  app.register(myQuestionsRoutes, { prefix: "/my/questions" });
  app.register(myQuotaRoutes, { prefix: "/my/quota" });
  app.register(myStoriesRoutes, { prefix: "/my/stories" });
  app.register(myStoryPagesRoutes, { prefix: "/my/story-pages" });
  app.register(myMiniGameTopicsRoutes, { prefix: "/my/minigame-topics" });
  app.register(myMiniGameWordsRoutes, { prefix: "/my/minigame-words" });
  app.register(myWordCatchTopicsRoutes, { prefix: "/my/wordcatch-topics" });
  app.register(myWordCatchRoundsRoutes, { prefix: "/my/wordcatch-rounds" });
  app.register(myShopTopicsRoutes, { prefix: "/my/shop-topics" });
  app.register(myShopRoundsRoutes, { prefix: "/my/shop-rounds" });
  app.register(myHomeTopicsRoutes, { prefix: "/my/home-topics" });
  app.register(myHomeRoundsRoutes, { prefix: "/my/home-rounds" });
  app.register(myRpgTopicsRoutes, { prefix: "/my/rpg-topics" });
  app.register(myRpgMonstersRoutes, { prefix: "/my/rpg-monsters" });
  app.register(myWordTrainTopicsRoutes, { prefix: "/my/word-train-topics" });
  app.register(myWordTrainRoundsRoutes, { prefix: "/my/word-train-rounds" });
  app.register(myDetectiveCasesRoutes, { prefix: "/my/detective-cases" });
  app.register(myDetectiveRoundsRoutes, { prefix: "/my/detective-rounds" });
  app.register(myEchoParrotTopicsRoutes, { prefix: "/my/echo-parrot-topics" });
  app.register(myEchoParrotRoundsRoutes, { prefix: "/my/echo-parrot-rounds" });
  app.register(myChatBuddyTopicsRoutes, { prefix: "/my/chat-buddy-topics" });
  app.register(myChatBuddyRoundsRoutes, { prefix: "/my/chat-buddy-rounds" });

  app.register(adminUsersRoutes, { prefix: "/admin/users" });
  app.register(adminPetsRoutes, { prefix: "/admin/pets" });
  app.register(adminItemsRoutes, { prefix: "/admin/items" });
  app.register(adminWorldsRoutes, { prefix: "/admin/worlds" });
  app.register(adminLessonsRoutes, { prefix: "/admin/lessons" });
  app.register(adminQuestionsRoutes, { prefix: "/admin/questions" });
  app.register(adminQuestsRoutes, { prefix: "/admin/quests" });
  app.register(adminBattlePassRoutes, { prefix: "/admin/battle-pass" });
  app.register(adminShopPackagesRoutes, { prefix: "/admin/shop-packages" });
  app.register(adminStoriesRoutes, { prefix: "/admin/stories" });
  app.register(adminStoryPagesRoutes, { prefix: "/admin/story-pages" });
  app.register(adminMiniGameTopicsRoutes, { prefix: "/admin/minigame-topics" });
  app.register(adminMiniGameWordsRoutes, { prefix: "/admin/minigame-words" });
  app.register(adminWordCatchTopicsRoutes, { prefix: "/admin/wordcatch-topics" });
  app.register(adminWordCatchRoundsRoutes, { prefix: "/admin/wordcatch-rounds" });
  app.register(adminShopTopicsRoutes, { prefix: "/admin/shop-topics" });
  app.register(adminShopRoundsRoutes, { prefix: "/admin/shop-rounds" });
  app.register(adminHomeTopicsRoutes, { prefix: "/admin/home-topics" });
  app.register(adminHomeRoundsRoutes, { prefix: "/admin/home-rounds" });
  app.register(adminRpgTopicsRoutes, { prefix: "/admin/rpg-topics" });
  app.register(adminRpgMonstersRoutes, { prefix: "/admin/rpg-monsters" });
  app.register(adminWordTrainTopicsRoutes, { prefix: "/admin/word-train-topics" });
  app.register(adminWordTrainRoundsRoutes, { prefix: "/admin/word-train-rounds" });
  app.register(adminDetectiveCasesRoutes, { prefix: "/admin/detective-cases" });
  app.register(adminDetectiveRoundsRoutes, { prefix: "/admin/detective-rounds" });
  app.register(adminEchoParrotTopicsRoutes, { prefix: "/admin/echo-parrot-topics" });
  app.register(adminEchoParrotRoundsRoutes, { prefix: "/admin/echo-parrot-rounds" });
  app.register(adminChatBuddyTopicsRoutes, { prefix: "/admin/chat-buddy-topics" });
  app.register(adminChatBuddyRoundsRoutes, { prefix: "/admin/chat-buddy-rounds" });

  return app;
}

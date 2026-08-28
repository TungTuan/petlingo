-- CreateEnum
CREATE TYPE "QuestTrackKind" AS ENUM ('lessons', 'miniGame', 'petCare');

-- CreateTable
CREATE TABLE "daily_quests" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "trackKind" "QuestTrackKind" NOT NULL,
    "target" INTEGER NOT NULL,
    "rewardCoins" INTEGER NOT NULL,
    "color" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_quests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_quest_progress" (
    "childId" TEXT NOT NULL,
    "questId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "claimed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "daily_quest_progress_pkey" PRIMARY KEY ("childId","questId","date")
);

-- CreateIndex
CREATE UNIQUE INDEX "daily_quests_key_key" ON "daily_quests"("key");

-- CreateIndex
CREATE INDEX "daily_quest_progress_childId_idx" ON "daily_quest_progress"("childId");

-- AddForeignKey
ALTER TABLE "daily_quest_progress" ADD CONSTRAINT "daily_quest_progress_childId_fkey" FOREIGN KEY ("childId") REFERENCES "children"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_quest_progress" ADD CONSTRAINT "daily_quest_progress_questId_fkey" FOREIGN KEY ("questId") REFERENCES "daily_quests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

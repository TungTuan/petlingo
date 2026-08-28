-- AlterTable
ALTER TABLE "progress" ADD COLUMN     "rpgXp" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "rpg_topics" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "parentId" TEXT,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rpg_topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rpg_monsters" (
    "id" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "isBoss" BOOLEAN NOT NULL DEFAULT false,
    "questions" JSONB NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "rpg_monsters_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "rpg_topics_key_key" ON "rpg_topics"("key");

-- CreateIndex
CREATE INDEX "rpg_topics_parentId_idx" ON "rpg_topics"("parentId");

-- CreateIndex
CREATE INDEX "rpg_monsters_topicId_idx" ON "rpg_monsters"("topicId");

-- AddForeignKey
ALTER TABLE "rpg_topics" ADD CONSTRAINT "rpg_topics_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "parents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rpg_monsters" ADD CONSTRAINT "rpg_monsters_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "rpg_topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

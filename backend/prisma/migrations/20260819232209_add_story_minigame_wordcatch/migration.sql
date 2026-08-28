-- CreateTable
CREATE TABLE "stories" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "colorTheme" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "story_pages" (
    "id" TEXT NOT NULL,
    "storyId" TEXT NOT NULL,
    "en" TEXT NOT NULL,
    "vi" TEXT NOT NULL,
    "img1" TEXT NOT NULL,
    "img2" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sceneBg" TEXT NOT NULL,
    "ground" TEXT NOT NULL,
    "words" JSONB NOT NULL DEFAULT '[]',
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "story_pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "minigame_topics" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "minigame_topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "minigame_words" (
    "id" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "en" TEXT NOT NULL,
    "vi" TEXT NOT NULL,
    "img" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "minigame_words_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wordcatch_topics" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wordcatch_topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wordcatch_rounds" (
    "id" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "vi" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "options" JSONB NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "wordcatch_rounds_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "stories_key_key" ON "stories"("key");

-- CreateIndex
CREATE INDEX "story_pages_storyId_idx" ON "story_pages"("storyId");

-- CreateIndex
CREATE UNIQUE INDEX "minigame_topics_key_key" ON "minigame_topics"("key");

-- CreateIndex
CREATE INDEX "minigame_words_topicId_idx" ON "minigame_words"("topicId");

-- CreateIndex
CREATE UNIQUE INDEX "wordcatch_topics_key_key" ON "wordcatch_topics"("key");

-- CreateIndex
CREATE INDEX "wordcatch_rounds_topicId_idx" ON "wordcatch_rounds"("topicId");

-- AddForeignKey
ALTER TABLE "story_pages" ADD CONSTRAINT "story_pages_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "stories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "minigame_words" ADD CONSTRAINT "minigame_words_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "minigame_topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wordcatch_rounds" ADD CONSTRAINT "wordcatch_rounds_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "wordcatch_topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

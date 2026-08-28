-- CreateTable
CREATE TABLE "chat_buddy_topics" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "parentId" TEXT,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_buddy_topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_buddy_rounds" (
    "id" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "chat_buddy_rounds_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "chat_buddy_topics_key_key" ON "chat_buddy_topics"("key");

-- CreateIndex
CREATE INDEX "chat_buddy_topics_parentId_idx" ON "chat_buddy_topics"("parentId");

-- CreateIndex
CREATE INDEX "chat_buddy_rounds_topicId_idx" ON "chat_buddy_rounds"("topicId");

-- AddForeignKey
ALTER TABLE "chat_buddy_topics" ADD CONSTRAINT "chat_buddy_topics_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "parents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_buddy_rounds" ADD CONSTRAINT "chat_buddy_rounds_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "chat_buddy_topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

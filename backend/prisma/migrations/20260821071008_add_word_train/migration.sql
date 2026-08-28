-- CreateTable
CREATE TABLE "word_train_topics" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "parentId" TEXT,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "word_train_topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "word_train_rounds" (
    "id" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "vi" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "word_train_rounds_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "word_train_topics_key_key" ON "word_train_topics"("key");

-- CreateIndex
CREATE INDEX "word_train_topics_parentId_idx" ON "word_train_topics"("parentId");

-- CreateIndex
CREATE INDEX "word_train_rounds_topicId_idx" ON "word_train_rounds"("topicId");

-- AddForeignKey
ALTER TABLE "word_train_topics" ADD CONSTRAINT "word_train_topics_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "parents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "word_train_rounds" ADD CONSTRAINT "word_train_rounds_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "word_train_topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

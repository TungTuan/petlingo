-- CreateTable
CREATE TABLE "echo_parrot_topics" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "parentId" TEXT,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "echo_parrot_topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "echo_parrot_rounds" (
    "id" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "en" TEXT NOT NULL,
    "vi" TEXT NOT NULL,
    "phonetic" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "echo_parrot_rounds_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "echo_parrot_topics_key_key" ON "echo_parrot_topics"("key");

-- CreateIndex
CREATE INDEX "echo_parrot_topics_parentId_idx" ON "echo_parrot_topics"("parentId");

-- CreateIndex
CREATE INDEX "echo_parrot_rounds_topicId_idx" ON "echo_parrot_rounds"("topicId");

-- AddForeignKey
ALTER TABLE "echo_parrot_topics" ADD CONSTRAINT "echo_parrot_topics_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "parents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "echo_parrot_rounds" ADD CONSTRAINT "echo_parrot_rounds_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "echo_parrot_topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

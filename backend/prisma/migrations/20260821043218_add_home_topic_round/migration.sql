-- CreateTable
CREATE TABLE "home_topics" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "parentId" TEXT,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "home_topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "home_rounds" (
    "id" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "instructionEn" TEXT NOT NULL,
    "instructionVi" TEXT NOT NULL,
    "objects" JSONB NOT NULL,
    "correctObjectKey" TEXT NOT NULL,
    "zones" JSONB NOT NULL,
    "correctZoneKey" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "home_rounds_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "home_topics_key_key" ON "home_topics"("key");

-- CreateIndex
CREATE INDEX "home_topics_parentId_idx" ON "home_topics"("parentId");

-- CreateIndex
CREATE INDEX "home_rounds_topicId_idx" ON "home_rounds"("topicId");

-- AddForeignKey
ALTER TABLE "home_topics" ADD CONSTRAINT "home_topics_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "parents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "home_rounds" ADD CONSTRAINT "home_rounds_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "home_topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

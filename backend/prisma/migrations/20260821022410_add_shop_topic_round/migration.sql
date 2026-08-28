-- CreateTable
CREATE TABLE "shop_topics" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "parentId" TEXT,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shop_topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shop_rounds" (
    "id" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "instructionEn" TEXT NOT NULL,
    "instructionVi" TEXT NOT NULL,
    "shelf" JSONB NOT NULL,
    "required" JSONB NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "shop_rounds_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "shop_topics_key_key" ON "shop_topics"("key");

-- CreateIndex
CREATE INDEX "shop_topics_parentId_idx" ON "shop_topics"("parentId");

-- CreateIndex
CREATE INDEX "shop_rounds_topicId_idx" ON "shop_rounds"("topicId");

-- AddForeignKey
ALTER TABLE "shop_topics" ADD CONSTRAINT "shop_topics_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "parents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shop_rounds" ADD CONSTRAINT "shop_rounds_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "shop_topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

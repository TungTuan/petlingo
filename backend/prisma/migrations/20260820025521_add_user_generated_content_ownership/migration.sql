-- AlterTable
ALTER TABLE "lessons" ADD COLUMN     "parentId" TEXT;

-- AlterTable
ALTER TABLE "minigame_topics" ADD COLUMN     "parentId" TEXT;

-- AlterTable
ALTER TABLE "stories" ADD COLUMN     "parentId" TEXT;

-- AlterTable
ALTER TABLE "wordcatch_topics" ADD COLUMN     "parentId" TEXT;

-- CreateIndex
CREATE INDEX "lessons_parentId_idx" ON "lessons"("parentId");

-- CreateIndex
CREATE INDEX "minigame_topics_parentId_idx" ON "minigame_topics"("parentId");

-- CreateIndex
CREATE INDEX "stories_parentId_idx" ON "stories"("parentId");

-- CreateIndex
CREATE INDEX "wordcatch_topics_parentId_idx" ON "wordcatch_topics"("parentId");

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "parents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stories" ADD CONSTRAINT "stories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "parents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "minigame_topics" ADD CONSTRAINT "minigame_topics_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "parents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wordcatch_topics" ADD CONSTRAINT "wordcatch_topics_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "parents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "saved_words" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "word" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_words_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "saved_words_childId_idx" ON "saved_words"("childId");

-- CreateIndex
CREATE UNIQUE INDEX "saved_words_childId_word_key" ON "saved_words"("childId", "word");

-- AddForeignKey
ALTER TABLE "saved_words" ADD CONSTRAINT "saved_words_childId_fkey" FOREIGN KEY ("childId") REFERENCES "children"("id") ON DELETE CASCADE ON UPDATE CASCADE;

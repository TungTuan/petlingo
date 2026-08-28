-- CreateTable
CREATE TABLE "parents" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "children" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "avatarId" TEXT NOT NULL,
    "birthYear" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "children_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "progress" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "coins" INTEGER NOT NULL DEFAULT 0,
    "gems" INTEGER NOT NULL DEFAULT 0,
    "unlockedPets" JSONB NOT NULL DEFAULT '[]',
    "unlockedWorlds" JSONB NOT NULL DEFAULT '[]',
    "streakDays" INTEGER NOT NULL DEFAULT 0,
    "lastActiveDate" TIMESTAMP(3),
    "localVersion" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vocab" (
    "id" TEXT NOT NULL,
    "word" TEXT NOT NULL,
    "worldId" TEXT NOT NULL,
    "meaningVi" TEXT NOT NULL,

    CONSTRAINT "vocab_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "child_vocab" (
    "childId" TEXT NOT NULL,
    "vocabId" TEXT NOT NULL,
    "learnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "timesReviewed" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "child_vocab_pkey" PRIMARY KEY ("childId","vocabId")
);

-- CreateIndex
CREATE UNIQUE INDEX "parents_email_key" ON "parents"("email");

-- CreateIndex
CREATE INDEX "children_parentId_idx" ON "children"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "progress_childId_key" ON "progress"("childId");

-- CreateIndex
CREATE INDEX "progress_childId_idx" ON "progress"("childId");

-- CreateIndex
CREATE INDEX "vocab_worldId_idx" ON "vocab"("worldId");

-- CreateIndex
CREATE INDEX "child_vocab_childId_idx" ON "child_vocab"("childId");

-- CreateIndex
CREATE INDEX "child_vocab_vocabId_idx" ON "child_vocab"("vocabId");

-- AddForeignKey
ALTER TABLE "children" ADD CONSTRAINT "children_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "parents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progress" ADD CONSTRAINT "progress_childId_fkey" FOREIGN KEY ("childId") REFERENCES "children"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "child_vocab" ADD CONSTRAINT "child_vocab_childId_fkey" FOREIGN KEY ("childId") REFERENCES "children"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "child_vocab" ADD CONSTRAINT "child_vocab_vocabId_fkey" FOREIGN KEY ("vocabId") REFERENCES "vocab"("id") ON DELETE CASCADE ON UPDATE CASCADE;

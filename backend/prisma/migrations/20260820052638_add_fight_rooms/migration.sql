-- CreateEnum
CREATE TYPE "FightRoomStatus" AS ENUM ('waiting', 'active', 'finished', 'abandoned');

-- CreateTable
CREATE TABLE "fight_rooms" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "hostChildId" TEXT NOT NULL,
    "status" "FightRoomStatus" NOT NULL DEFAULT 'waiting',
    "winnerChildId" TEXT,
    "rewardCoins" INTEGER NOT NULL DEFAULT 50,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fight_rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fight_participants" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fight_participants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "fight_rooms_code_key" ON "fight_rooms"("code");

-- CreateIndex
CREATE INDEX "fight_rooms_hostChildId_idx" ON "fight_rooms"("hostChildId");

-- CreateIndex
CREATE INDEX "fight_participants_childId_idx" ON "fight_participants"("childId");

-- CreateIndex
CREATE UNIQUE INDEX "fight_participants_roomId_childId_key" ON "fight_participants"("roomId", "childId");

-- AddForeignKey
ALTER TABLE "fight_rooms" ADD CONSTRAINT "fight_rooms_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fight_rooms" ADD CONSTRAINT "fight_rooms_hostChildId_fkey" FOREIGN KEY ("hostChildId") REFERENCES "children"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fight_rooms" ADD CONSTRAINT "fight_rooms_winnerChildId_fkey" FOREIGN KEY ("winnerChildId") REFERENCES "children"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fight_participants" ADD CONSTRAINT "fight_participants_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "fight_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fight_participants" ADD CONSTRAINT "fight_participants_childId_fkey" FOREIGN KEY ("childId") REFERENCES "children"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateEnum
CREATE TYPE "ItemCategory" AS ENUM ('food', 'toy', 'accessory', 'special');

-- AlterTable
ALTER TABLE "progress" ADD COLUMN     "activePetId" TEXT;

-- CreateTable
CREATE TABLE "items" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "ItemCategory" NOT NULL,
    "color" TEXT NOT NULL,
    "radius" TEXT NOT NULL DEFAULT '12px',
    "description" TEXT NOT NULL,
    "effects" JSONB NOT NULL DEFAULT '[]',
    "defaultQty" INTEGER NOT NULL DEFAULT 0,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "child_items" (
    "childId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "child_items_pkey" PRIMARY KEY ("childId","itemId")
);

-- CreateTable
CREATE TABLE "pet_stats" (
    "childId" TEXT NOT NULL,
    "petKey" TEXT NOT NULL,
    "hunger" INTEGER NOT NULL DEFAULT 70,
    "happiness" INTEGER NOT NULL DEFAULT 70,
    "health" INTEGER NOT NULL DEFAULT 70,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pet_stats_pkey" PRIMARY KEY ("childId","petKey")
);

-- CreateIndex
CREATE UNIQUE INDEX "items_key_key" ON "items"("key");

-- CreateIndex
CREATE INDEX "child_items_childId_idx" ON "child_items"("childId");

-- CreateIndex
CREATE INDEX "pet_stats_childId_idx" ON "pet_stats"("childId");

-- AddForeignKey
ALTER TABLE "child_items" ADD CONSTRAINT "child_items_childId_fkey" FOREIGN KEY ("childId") REFERENCES "children"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "child_items" ADD CONSTRAINT "child_items_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pet_stats" ADD CONSTRAINT "pet_stats_childId_fkey" FOREIGN KEY ("childId") REFERENCES "children"("id") ON DELETE CASCADE ON UPDATE CASCADE;

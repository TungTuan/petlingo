CREATE TABLE "gifts" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),
    CONSTRAINT "gifts_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "gifts_receiverId_createdAt_idx" ON "gifts"("receiverId", "createdAt");
CREATE INDEX "gifts_senderId_createdAt_idx" ON "gifts"("senderId", "createdAt");
ALTER TABLE "gifts" ADD CONSTRAINT "gifts_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "children"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "gifts" ADD CONSTRAINT "gifts_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "children"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "gifts" ADD CONSTRAINT "gifts_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Product cleanup: food without artwork must not remain in the shop/bag.
-- Child inventory rows are removed by the existing ChildItem -> Item cascade.
DELETE FROM "items" WHERE "category" = 'food' AND "imagePath" = '';

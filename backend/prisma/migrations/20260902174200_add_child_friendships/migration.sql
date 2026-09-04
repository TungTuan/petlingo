-- Existing child rows receive a code lazily on first opening the Friends UI.
ALTER TABLE "children" ADD COLUMN "friendCode" TEXT;

CREATE UNIQUE INDEX "children_friendCode_key" ON "children"("friendCode");

CREATE TYPE "FriendshipStatus" AS ENUM ('pending', 'accepted');

CREATE TABLE "friendships" (
  "id" TEXT NOT NULL,
  "requesterId" TEXT NOT NULL,
  "addresseeId" TEXT NOT NULL,
  "status" "FriendshipStatus" NOT NULL DEFAULT 'pending',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "acceptedAt" TIMESTAMP(3),
  CONSTRAINT "friendships_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "friendships_requesterId_addresseeId_key" ON "friendships"("requesterId", "addresseeId");
CREATE INDEX "friendships_addresseeId_status_idx" ON "friendships"("addresseeId", "status");
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "children"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_addresseeId_fkey" FOREIGN KEY ("addresseeId") REFERENCES "children"("id") ON DELETE CASCADE ON UPDATE CASCADE;

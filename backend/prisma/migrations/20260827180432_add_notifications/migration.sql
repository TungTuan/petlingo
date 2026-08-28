CREATE TYPE "NotificationKind" AS ENUM ('lesson', 'petUnlock', 'checkin', 'quest');

CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "kind" "NotificationKind" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "notifications_childId_createdAt_idx" ON "notifications"("childId", "createdAt");

ALTER TABLE "notifications" ADD CONSTRAINT "notifications_childId_fkey" FOREIGN KEY ("childId") REFERENCES "children"("id") ON DELETE CASCADE ON UPDATE CASCADE;

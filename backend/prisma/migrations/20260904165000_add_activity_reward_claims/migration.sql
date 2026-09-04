CREATE TABLE "activity_reward_claims" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "activity" TEXT NOT NULL,
    "contentKey" TEXT NOT NULL,
    "rewardDay" TEXT NOT NULL,
    "rewardCoins" INTEGER NOT NULL DEFAULT 0,
    "rewardXp" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activity_reward_claims_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "activity_reward_claims_childId_activity_contentKey_rewardDay_key"
ON "activity_reward_claims"("childId", "activity", "contentKey", "rewardDay");

CREATE INDEX "activity_reward_claims_childId_rewardDay_idx"
ON "activity_reward_claims"("childId", "rewardDay");

ALTER TABLE "activity_reward_claims"
ADD CONSTRAINT "activity_reward_claims_childId_fkey"
FOREIGN KEY ("childId") REFERENCES "children"("id") ON DELETE CASCADE ON UPDATE CASCADE;

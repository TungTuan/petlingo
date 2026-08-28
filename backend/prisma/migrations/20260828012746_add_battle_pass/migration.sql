CREATE TABLE "battle_pass_seasons" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "battle_pass_seasons_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "battle_pass_tiers" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "tier" INTEGER NOT NULL,
    "xpRequired" INTEGER NOT NULL,
    "freeRewardKind" TEXT NOT NULL,
    "freeRewardAmount" INTEGER NOT NULL DEFAULT 0,
    "freeRewardItemKey" TEXT,
    "vipRewardKind" TEXT NOT NULL,
    "vipRewardAmount" INTEGER NOT NULL DEFAULT 0,
    "vipRewardItemKey" TEXT,

    CONSTRAINT "battle_pass_tiers_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "battle_pass_tiers_seasonId_tier_key" ON "battle_pass_tiers"("seasonId", "tier");

CREATE TABLE "battle_pass_progress" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "hasVip" BOOLEAN NOT NULL DEFAULT false,
    "lastQuestBumpDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "battle_pass_progress_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "battle_pass_progress_childId_seasonId_key" ON "battle_pass_progress"("childId", "seasonId");

CREATE TABLE "battle_pass_claims" (
    "id" TEXT NOT NULL,
    "progressId" TEXT NOT NULL,
    "tier" INTEGER NOT NULL,
    "track" TEXT NOT NULL,
    "claimedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "battle_pass_claims_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "battle_pass_claims_progressId_tier_track_key" ON "battle_pass_claims"("progressId", "tier", "track");

ALTER TABLE "battle_pass_tiers" ADD CONSTRAINT "battle_pass_tiers_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "battle_pass_seasons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "battle_pass_progress" ADD CONSTRAINT "battle_pass_progress_childId_fkey" FOREIGN KEY ("childId") REFERENCES "children"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "battle_pass_progress" ADD CONSTRAINT "battle_pass_progress_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "battle_pass_seasons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "battle_pass_claims" ADD CONSTRAINT "battle_pass_claims_progressId_fkey" FOREIGN KEY ("progressId") REFERENCES "battle_pass_progress"("id") ON DELETE CASCADE ON UPDATE CASCADE;

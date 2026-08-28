-- AlterTable: passwordHash is now optional (social-only accounts never set one)
ALTER TABLE "parents" ALTER COLUMN "passwordHash" DROP NOT NULL;

-- AlterTable: add social login identity columns
ALTER TABLE "parents" ADD COLUMN "googleId" TEXT;
ALTER TABLE "parents" ADD COLUMN "facebookId" TEXT;
ALTER TABLE "parents" ADD COLUMN "appleId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "parents_googleId_key" ON "parents"("googleId");
CREATE UNIQUE INDEX "parents_facebookId_key" ON "parents"("facebookId");
CREATE UNIQUE INDEX "parents_appleId_key" ON "parents"("appleId");

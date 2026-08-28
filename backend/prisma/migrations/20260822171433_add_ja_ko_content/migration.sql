-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Language" ADD VALUE 'ja';
ALTER TYPE "Language" ADD VALUE 'ko';

-- AlterTable
ALTER TABLE "detective_cases" ADD COLUMN     "scenarioJa" TEXT,
ADD COLUMN     "scenarioKo" TEXT;

-- AlterTable
ALTER TABLE "detective_rounds" ADD COLUMN     "ja" TEXT,
ADD COLUMN     "ko" TEXT;

-- AlterTable
ALTER TABLE "echo_parrot_rounds" ADD COLUMN     "ja" TEXT,
ADD COLUMN     "ko" TEXT;

-- AlterTable
ALTER TABLE "home_rounds" ADD COLUMN     "instructionJa" TEXT,
ADD COLUMN     "instructionKo" TEXT;

-- AlterTable
ALTER TABLE "minigame_words" ADD COLUMN     "ja" TEXT,
ADD COLUMN     "ko" TEXT;

-- AlterTable
ALTER TABLE "parents" ALTER COLUMN "language" DROP NOT NULL,
ALTER COLUMN "language" DROP DEFAULT;

-- AlterTable
ALTER TABLE "shop_rounds" ADD COLUMN     "instructionJa" TEXT,
ADD COLUMN     "instructionKo" TEXT;

-- AlterTable
ALTER TABLE "story_pages" ADD COLUMN     "ja" TEXT,
ADD COLUMN     "ko" TEXT;

-- AlterTable
ALTER TABLE "vocab" ADD COLUMN     "meaningJa" TEXT,
ADD COLUMN     "meaningKo" TEXT;

-- AlterTable
ALTER TABLE "word_train_rounds" ADD COLUMN     "ja" TEXT,
ADD COLUMN     "ko" TEXT;

-- AlterTable
ALTER TABLE "wordcatch_rounds" ADD COLUMN     "ja" TEXT,
ADD COLUMN     "ko" TEXT;

-- CreateEnum
CREATE TYPE "Language" AS ENUM ('vi', 'en');

-- AlterTable
ALTER TABLE "parents" ADD COLUMN     "language" "Language" NOT NULL DEFAULT 'vi';

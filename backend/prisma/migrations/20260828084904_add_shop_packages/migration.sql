-- CreateEnum
CREATE TYPE "ShopPackageKind" AS ENUM ('combo', 'firstPurchase');

-- CreateTable
CREATE TABLE "shop_packages" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "kind" "ShopPackageKind" NOT NULL,
    "color" TEXT NOT NULL,
    "imagePath" TEXT NOT NULL DEFAULT '',
    "price" INTEGER NOT NULL DEFAULT 0,
    "currency" "Currency" NOT NULL DEFAULT 'coin',
    "realPriceLabel" TEXT NOT NULL DEFAULT '',
    "contents" JSONB NOT NULL DEFAULT '[]',
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shop_packages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "child_package_claims" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "claimedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "child_package_claims_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "shop_packages_key_key" ON "shop_packages"("key");

-- CreateIndex
CREATE INDEX "child_package_claims_childId_idx" ON "child_package_claims"("childId");

-- CreateIndex
CREATE UNIQUE INDEX "child_package_claims_childId_packageId_key" ON "child_package_claims"("childId", "packageId");

-- AddForeignKey
ALTER TABLE "child_package_claims" ADD CONSTRAINT "child_package_claims_childId_fkey" FOREIGN KEY ("childId") REFERENCES "children"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "child_package_claims" ADD CONSTRAINT "child_package_claims_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "shop_packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

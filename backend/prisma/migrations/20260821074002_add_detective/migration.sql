-- CreateTable
CREATE TABLE "detective_cases" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "parentId" TEXT,
    "name" TEXT NOT NULL,
    "scenario" TEXT NOT NULL,
    "scenarioVi" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "detective_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "detective_rounds" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "vi" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "detective_rounds_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "detective_cases_key_key" ON "detective_cases"("key");

-- CreateIndex
CREATE INDEX "detective_cases_parentId_idx" ON "detective_cases"("parentId");

-- CreateIndex
CREATE INDEX "detective_rounds_caseId_idx" ON "detective_rounds"("caseId");

-- AddForeignKey
ALTER TABLE "detective_cases" ADD CONSTRAINT "detective_cases_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "parents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detective_rounds" ADD CONSTRAINT "detective_rounds_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "detective_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

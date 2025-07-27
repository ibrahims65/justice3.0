-- AlterTable
ALTER TABLE "Case" ADD COLUMN     "crimeSceneDetails" TEXT,
ADD COLUMN     "interrogationLogs" TEXT,
ADD COLUMN     "preliminaryFindings" TEXT;

-- CreateTable
CREATE TABLE "Lawyer" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "firm" TEXT NOT NULL,
    "license" TEXT NOT NULL,
    "personId" INTEGER NOT NULL,

    CONSTRAINT "Lawyer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LawyerVisit" (
    "id" SERIAL NOT NULL,
    "visitDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "lawyerId" INTEGER NOT NULL,

    CONSTRAINT "LawyerVisit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProsecutorNote" (
    "id" SERIAL NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "caseId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "ProsecutorNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PleaBargain" (
    "id" SERIAL NOT NULL,
    "caseId" INTEGER NOT NULL,
    "offer" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PleaBargain_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Lawyer_license_key" ON "Lawyer"("license");

-- AddForeignKey
ALTER TABLE "Lawyer" ADD CONSTRAINT "Lawyer_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LawyerVisit" ADD CONSTRAINT "LawyerVisit_lawyerId_fkey" FOREIGN KEY ("lawyerId") REFERENCES "Lawyer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProsecutorNote" ADD CONSTRAINT "ProsecutorNote_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProsecutorNote" ADD CONSTRAINT "ProsecutorNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PleaBargain" ADD CONSTRAINT "PleaBargain_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

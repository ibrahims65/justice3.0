/*
  Warnings:

  - You are about to drop the column `personId` on the `Lawyer` table. All the data in the column will be lost.
  - Added the required column `bookingId` to the `Lawyer` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Lawyer" DROP CONSTRAINT "Lawyer_personId_fkey";

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "facilityName" TEXT,
ADD COLUMN     "incarcerationStartDate" TIMESTAMP(3),
ADD COLUMN     "paroleEligibility" TIMESTAMP(3),
ADD COLUMN     "rehabilitationPrograms" TEXT,
ADD COLUMN     "releaseDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Case" ADD COLUMN     "evidenceStrengthRating" INTEGER,
ADD COLUMN     "recommendedCharges" TEXT,
ADD COLUMN     "riskAssessment" TEXT;

-- AlterTable
ALTER TABLE "Lawyer" DROP COLUMN "personId",
ADD COLUMN     "bookingId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "Investigator" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "badgeNumber" TEXT NOT NULL,
    "rank" TEXT NOT NULL,

    CONSTRAINT "Investigator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Investigation" (
    "id" SERIAL NOT NULL,
    "caseId" INTEGER NOT NULL,
    "investigatorId" INTEGER NOT NULL,
    "details" TEXT,

    CONSTRAINT "Investigation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Media" (
    "id" SERIAL NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "investigationId" INTEGER NOT NULL,

    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BailDecision" (
    "id" SERIAL NOT NULL,
    "caseId" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL,
    "conditions" TEXT,
    "decidedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "judgeName" TEXT NOT NULL,

    CONSTRAINT "BailDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicalRecord" (
    "id" SERIAL NOT NULL,
    "bookingId" INTEGER NOT NULL,
    "condition" TEXT NOT NULL,
    "allergies" TEXT,
    "notes" TEXT,

    CONSTRAINT "MedicalRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicationSchedule" (
    "id" SERIAL NOT NULL,
    "medicalId" INTEGER NOT NULL,
    "medication" TEXT NOT NULL,
    "dosage" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),

    CONSTRAINT "MedicationSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NextOfKin" (
    "id" SERIAL NOT NULL,
    "personId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address" TEXT,

    CONSTRAINT "NextOfKin_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Investigator_badgeNumber_key" ON "Investigator"("badgeNumber");

-- AddForeignKey
ALTER TABLE "Lawyer" ADD CONSTRAINT "Lawyer_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Investigation" ADD CONSTRAINT "Investigation_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Investigation" ADD CONSTRAINT "Investigation_investigatorId_fkey" FOREIGN KEY ("investigatorId") REFERENCES "Investigator"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_investigationId_fkey" FOREIGN KEY ("investigationId") REFERENCES "Investigation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BailDecision" ADD CONSTRAINT "BailDecision_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalRecord" ADD CONSTRAINT "MedicalRecord_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicationSchedule" ADD CONSTRAINT "MedicationSchedule_medicalId_fkey" FOREIGN KEY ("medicalId") REFERENCES "MedicalRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NextOfKin" ADD CONSTRAINT "NextOfKin_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

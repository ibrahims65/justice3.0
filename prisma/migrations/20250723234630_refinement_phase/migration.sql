/*
  Warnings:

  - You are about to drop the column `bookingId` on the `Lawyer` table. All the data in the column will be lost.
  - You are about to drop the column `approvedAt` on the `SearchWarrant` table. All the data in the column will be lost.
  - You are about to drop the column `deniedAt` on the `SearchWarrant` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `SearchWarrant` table. All the data in the column will be lost.
  - You are about to drop the column `requestedAt` on the `SearchWarrant` table. All the data in the column will be lost.
  - You are about to drop the column `scope` on the `SearchWarrant` table. All the data in the column will be lost.
  - Added the required column `caseId` to the `Lawyer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `caseId` to the `MedicalRecord` table without a default value. This is not possible if the table is not empty.
  - Added the required column `reason` to the `SearchWarrant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `requestedBy` to the `SearchWarrant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `targetDetails` to the `SearchWarrant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `targetType` to the `SearchWarrant` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Lawyer" DROP CONSTRAINT "Lawyer_bookingId_fkey";

-- DropForeignKey
ALTER TABLE "MedicalRecord" DROP CONSTRAINT "MedicalRecord_bookingId_fkey";

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "arrestingOfficerName" TEXT,
ADD COLUMN     "arrestingOfficerRank" TEXT;

-- AlterTable
ALTER TABLE "Lawyer" DROP COLUMN "bookingId",
ADD COLUMN     "caseId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "MedicalRecord" ADD COLUMN     "caseId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "SearchWarrant" DROP COLUMN "approvedAt",
DROP COLUMN "deniedAt",
DROP COLUMN "location",
DROP COLUMN "requestedAt",
DROP COLUMN "scope",
ADD COLUMN     "dateRequested" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "reason" TEXT NOT NULL,
ADD COLUMN     "requestedBy" TEXT NOT NULL,
ADD COLUMN     "targetDetails" TEXT NOT NULL,
ADD COLUMN     "targetType" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Lawyer" ADD CONSTRAINT "Lawyer_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalRecord" ADD CONSTRAINT "MedicalRecord_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

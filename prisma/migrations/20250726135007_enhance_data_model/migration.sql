-- AlterTable
ALTER TABLE "Evidence" ADD COLUMN     "ballisticsInfo" TEXT,
ADD COLUMN     "evidenceType" TEXT,
ADD COLUMN     "serialNumber" TEXT;

-- AlterTable
ALTER TABLE "Lawyer" ADD COLUMN     "areaOfExpertise" TEXT,
ADD COLUMN     "barNumber" TEXT;

-- AlterTable
ALTER TABLE "NextOfKin" ADD COLUMN     "roleInLife" TEXT;

-- CreateTable
CREATE TABLE "Affiliation" (
    "id" SERIAL NOT NULL,
    "personId" INTEGER NOT NULL,
    "organization" TEXT NOT NULL,
    "type" TEXT NOT NULL,

    CONSTRAINT "Affiliation_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Affiliation" ADD CONSTRAINT "Affiliation_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

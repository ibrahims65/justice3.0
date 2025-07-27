-- AlterTable
ALTER TABLE "ActionHistory" ADD COLUMN     "notes" TEXT;

-- AlterTable
ALTER TABLE "Evidence" ADD COLUMN     "dateReceived" TIMESTAMP(3),
ADD COLUMN     "receivedFrom" TEXT,
ADD COLUMN     "storageLocation" TEXT;

-- AlterTable
ALTER TABLE "Witness" ADD COLUMN     "testimonyType" TEXT,
ADD COLUMN     "testimonyUrl" TEXT;

-- CreateTable
CREATE TABLE "Victim" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "dob" TIMESTAMP(3) NOT NULL,
    "photoUrl" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "statement" TEXT,
    "caseId" INTEGER NOT NULL,

    CONSTRAINT "Victim_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Victim_email_key" ON "Victim"("email");

-- AddForeignKey
ALTER TABLE "Victim" ADD CONSTRAINT "Victim_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

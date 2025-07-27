-- AlterTable
ALTER TABLE "Case" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Person" ADD COLUMN     "deletedAt" TIMESTAMP(3);
